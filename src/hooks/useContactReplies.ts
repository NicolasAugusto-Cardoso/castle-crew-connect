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
  sender?: {
    name: string;
    avatar_url?: string | null;
  } | null;
}

export const useContactReplies = (messageId: string | null) => {
  const queryClient = useQueryClient();

  // Fetch replies for a specific message
  const { data: replies = [], isLoading } = useQuery({
    queryKey: ['contact-replies', messageId],
    queryFn: async () => {
      if (!messageId) return [];

      const { data: repliesData, error } = await supabase
        .from('contact_replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!repliesData) return [];

      // Fetch sender profiles
      const senderIds = [...new Set(repliesData.map(r => r.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', senderIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return repliesData.map(reply => ({
        ...reply,
        sender: profilesMap.get(reply.sender_id) || null,
      })) as ContactReply[];
    },
    enabled: !!messageId,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!messageId) return;

    const channel = supabase
      .channel(`contact-replies-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_replies',
          filter: `message_id=eq.${messageId}`,
        },
        async (payload) => {
          console.log('🔔 Nova resposta recebida:', payload);
          
          // Fetch the complete reply with sender info
          const { data: replyData } = await supabase
            .from('contact_replies')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (replyData) {
            // Fetch sender profile
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('id, name, avatar_url')
              .eq('id', replyData.sender_id)
              .single();

            const completeReply: ContactReply = {
              ...replyData,
              sender: senderProfile || null,
            };

            queryClient.setQueryData<ContactReply[]>(
              ['contact-replies', messageId],
              (old = []) => [...old, completeReply]
            );
            
            toast.success('💬 Nova resposta recebida!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId, queryClient]);

  // Create reply mutation
  const createReply = useMutation({
    mutationFn: async (content: string) => {
      if (!messageId) throw new Error('Message ID is required');

      const { data: replyData, error } = await supabase
        .from('contact_replies')
        .insert({
          message_id: messageId,
          content,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch sender profile
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', replyData.sender_id)
        .single();

      return {
        ...replyData,
        sender: senderProfile || null,
      } as ContactReply;
    },
    onSuccess: () => {
      toast.success('Resposta enviada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta. Tente novamente.');
    },
  });

  return {
    replies,
    isLoading,
    createReply,
  };
};
