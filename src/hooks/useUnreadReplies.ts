import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const useUnreadReplies = (userId: string | undefined, userRoles?: string[]) => {
  const queryClient = useQueryClient();

  // Verificar roles do usuário
  const isCollaborator = userRoles?.includes('collaborator');
  const isAdmin = userRoles?.includes('admin');
  const isSocialMedia = userRoles?.includes('social_media');

  // Buscar contador de mensagens não lidas
  const { data: unreadCount = 0, isLoading } = useQuery({
    queryKey: ['unread-replies-count', userId, userRoles],
    queryFn: async () => {
      if (!userId) return 0;

      // Para colaboradores: contar mensagens novas para eles
      if (isCollaborator) {
        const { data: collabProfile } = await supabase
          .from('collaborator_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (collabProfile) {
          const { count } = await supabase
            .from('contact_messages')
            .select('*', { count: 'exact', head: true })
            .eq('collaborator_id', collabProfile.id)
            .eq('status', 'new');
          return count || 0;
        }
        return 0;
      }

      // Para admins e social media: contar todas as mensagens novas
      if (isAdmin || isSocialMedia) {
        const { count } = await supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new');
        return count || 0;
      }

      // Para usuários normais: contar respostas não lidas nas suas mensagens
      const { data: messages } = await supabase
        .from('contact_messages')
        .select('id')
        .eq('user_id', userId);

      if (!messages || messages.length === 0) return 0;

      const messageIds = messages.map(m => m.id);

      const { count } = await supabase
        .from('contact_replies')
        .select('*', { count: 'exact', head: true })
        .in('message_id', messageIds)
        .neq('sender_id', userId)
        .eq('is_read', false);

      return count || 0;
    },
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Marcar mensagem como lida
  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      if (!userId) return;

      const { error } = await supabase
        .from('contact_replies')
        .update({ is_read: true })
        .eq('message_id', messageId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['unread-replies-count', userId] });
      await queryClient.invalidateQueries({ queryKey: ['contact-replies'] });
      await queryClient.refetchQueries({ queryKey: ['unread-replies-count', userId] });
    },
  });

  // Escutar novas respostas em tempo real
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('new-replies-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_replies',
          filter: `sender_id=neq.${userId}`,
        },
        async (payload) => {
          // Verificar se a resposta é para uma mensagem do usuário
          const { data: message } = await supabase
            .from('contact_messages')
            .select('user_id, name')
            .eq('id', payload.new.message_id)
            .single();

          if (message?.user_id === userId) {
            // Mostrar notificação toast
            toast({
              title: '📩 Nova resposta recebida',
              description: 'O administrador respondeu sua mensagem.',
              duration: 5000,
            });

            // Atualizar contador
            queryClient.invalidateQueries({ queryKey: ['unread-replies-count', userId] });
            queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return {
    unreadCount,
    isLoading,
    markAsRead,
  };
};
