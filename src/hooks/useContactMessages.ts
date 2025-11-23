import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: 'new' | 'in_progress' | 'answered';
  user_id: string | null;
  collaborator_id: string | null;
  collaborator_name?: string | null;
  collaborator_avatar?: string | null;
  created_at: string;
  updated_at: string;
}

export function useContactMessages() {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select(`
          *,
          collaborator:collaborator_profiles(
            id,
            user_id,
            profile:profiles(name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include collaborator_name and collaborator_avatar
      return data.map((msg: any) => ({
        ...msg,
        collaborator_name: msg.collaborator?.profile?.name || null,
        collaborator_avatar: msg.collaborator?.profile?.avatar_url || null,
        collaborator: undefined
      })) as ContactMessage[];
    }
  });

  const createMessage = useMutation({
    mutationFn: async (message: { name: string; phone: string; email?: string; message: string; collaborator_id?: string | null }) => {
      // O user_id será definido automaticamente pelo trigger no backend
      const { data, error } = await supabase
        .from('contact_messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast.success('✅ Mensagem enviada com sucesso! Responderemos em breve.', {
        duration: 5000,
      });
    },
    onError: (error: any) => {
      console.error('Erro ao enviar mensagem:', error);
      
      if (error.code === 'PGRST116' || error.message?.includes('Rate limit')) {
        toast.error('⏱️ Limite de envios atingido. Você pode enviar no máximo 3 mensagens por hora.');
      } else if (error.code === '42501') {
        toast.error('🔐 Erro de permissão. Por favor, faça login e tente novamente.');
      } else if (error.code === '23505') {
        toast.error('Você já enviou uma mensagem recentemente. Aguarde alguns minutos.');
      } else if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        toast.error('🔐 Você precisa estar logado para enviar mensagens.');
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao enviar mensagem. Tente novamente em instantes.');
      }
    }
  });

  const updateMessageStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactMessage['status'] }) => {
      const { data, error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status');
      console.error(error);
    }
  });

  return {
    messages,
    isLoading,
    createMessage,
    updateMessageStatus
  };
}
