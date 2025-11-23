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
      // Buscar todas as mensagens primeiro
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('📦 Total de mensagens retornadas:', data?.length);
      if (data && data.length > 0) {
        console.log('🔍 Primeira mensagem:', data[0]);
      }
      
      // Buscar dados dos colaboradores para as mensagens que têm collaborator_id
      const messagesWithCollaboratorData = await Promise.all(
        data.map(async (msg: any) => {
          if (!msg.collaborator_id) {
            return {
              ...msg,
              collaborator_name: null,
              collaborator_avatar: null,
            };
          }

          // Buscar perfil do colaborador
          const { data: collabProfile } = await supabase
            .from('collaborator_profiles')
            .select('user_id')
            .eq('id', msg.collaborator_id)
            .maybeSingle();

          if (!collabProfile?.user_id) {
            console.log(`⚠️ Colaborador não encontrado para mensagem ${msg.id}`);
            return {
              ...msg,
              collaborator_name: null,
              collaborator_avatar: null,
            };
          }

          // Buscar dados do perfil do usuário
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', collabProfile.user_id)
            .maybeSingle();

          console.log(`✅ Colaborador encontrado para mensagem ${msg.id}:`, profile?.name);

          return {
            ...msg,
            collaborator_name: profile?.name || null,
            collaborator_avatar: profile?.avatar_url || null,
          };
        })
      );

      console.log('📊 Mensagens processadas:', messagesWithCollaboratorData.length);
      return messagesWithCollaboratorData as ContactMessage[];
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
      
      // Forçar refetch como fallback após 500ms
      setTimeout(() => {
        console.log('🔄 Forçando refetch das mensagens...');
        queryClient.refetchQueries({ queryKey: ['contact-messages'] });
      }, 500);
      
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
