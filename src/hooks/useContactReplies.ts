import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface ContactReply {
  id: string;
  message_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useContactReplies(messageId: string | null) {
  const queryClient = useQueryClient();

  // Fetch replies for a specific message
  const { data: replies = [], isLoading } = useQuery({
    queryKey: ['contact-replies', messageId],
    queryFn: async () => {
      if (!messageId) return [];

      const { data, error } = await supabase
        .from('contact_replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ContactReply[];
    },
    enabled: !!messageId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!messageId) return;

    const channel = supabase
      .channel(`contact-replies-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_replies',
          filter: `message_id=eq.${messageId}`,
        },
        (payload) => {
          console.log('Mudança em reply:', payload);
          queryClient.invalidateQueries({ queryKey: ['contact-replies', messageId] });
          queryClient.invalidateQueries({ queryKey: ['unread-replies-count'] });
          queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId, queryClient]);

  // Create a new reply
  const createReply = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('contact_replies')
        .insert({
          message_id: messageId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-replies', variables.messageId] });
      toast.success('✅ Resposta enviada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao enviar resposta:', error);
      
      if (error.code === '42501') {
        toast.error('🔐 Você não tem permissão para responder esta mensagem.');
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao enviar resposta. Tente novamente.');
      }
    },
  });

  // Update a reply
  const updateReply = useMutation({
    mutationFn: async ({ replyId, content, messageId }: { replyId: string; content: string; messageId: string }) => {
      const { data, error } = await supabase
        .from('contact_replies')
        .update({ content: content.trim() })
        .eq('id', replyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-replies', variables.messageId] });
      toast.success('✏️ Mensagem editada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao editar mensagem:', error);
      toast.error('Erro ao editar mensagem. Tente novamente.');
    },
  });

  // Delete a reply
  const deleteReply = useMutation({
    mutationFn: async ({ replyId, messageId }: { replyId: string; messageId: string }) => {
      const { error } = await supabase
        .from('contact_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-replies', variables.messageId] });
      queryClient.invalidateQueries({ queryKey: ['unread-replies-count'] });
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast.success('🗑️ Mensagem apagada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao apagar mensagem:', error);
      toast.error('Erro ao apagar mensagem. Tente novamente.');
    },
  });

  return {
    replies,
    isLoading,
    createReply,
    updateReply,
    deleteReply,
  };
}

// Hook to subscribe to all new replies for the current user
export function useUserRepliesNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('user-contact-replies')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_replies',
        },
        (payload) => {
          console.log('Nova reply no sistema:', payload);
          // Invalidar queries de mensagens para atualizar contadores
          queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
          queryClient.invalidateQueries({ queryKey: ['unread-replies-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
