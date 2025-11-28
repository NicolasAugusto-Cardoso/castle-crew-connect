import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDeleteAccount() {
  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar autenticado');
      }

      // supabase.functions.invoke automatically includes the auth token
      const { data, error } = await supabase.functions.invoke('delete-account');

      if (error) {
        console.error('Error deleting account:', error);
        throw new Error(error.message || 'Erro ao excluir conta');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao excluir conta');
      }

      return data;
    },
  });

  return {
    deleteAccount: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
