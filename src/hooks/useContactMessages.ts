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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContactMessage[];
    }
  });

  const createMessage = useMutation({
    mutationFn: async (message: { name: string; phone: string; email?: string; message: string }) => {
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
      
      if (error.code === '23505') {
        toast.error('Você já enviou uma mensagem recentemente. Aguarde alguns minutos.');
      } else if (error.code === 'PGRST116') {
        toast.error('Limite de mensagens atingido. Aguarde 1 hora para enviar novamente.');
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
