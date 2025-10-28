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
      toast.success('Mensagem enviada! Entraremos em contato em breve.');
    },
    onError: (error) => {
      toast.error('Erro ao enviar mensagem');
      console.error(error);
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
