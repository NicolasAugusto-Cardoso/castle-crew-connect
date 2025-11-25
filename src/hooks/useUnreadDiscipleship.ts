import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const useUnreadDiscipleship = (userId: string | undefined, userRoles?: string[]) => {
  const queryClient = useQueryClient();
  const isCollaborator = userRoles?.includes('collaborator');

  // Contar contatos com status 'not_contacted' atribuídos ao colaborador
  const { data: unreadDiscipleshipCount = 0 } = useQuery({
    queryKey: ['unread-discipleship-count', userId],
    queryFn: async () => {
      if (!userId || !isCollaborator) return 0;

      const { count } = await supabase
        .from('discipleship_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_collaborator_id', userId)
        .eq('status', 'not_contacted');

      return count || 0;
    },
    enabled: !!userId && isCollaborator,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Listener em tempo real para novos contatos atribuídos ou alterações de status
  useEffect(() => {
    if (!userId || !isCollaborator) return;

    const channel = supabase
      .channel('discipleship-badge-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discipleship_contacts',
        },
        () => {
          queryClient.invalidateQueries({ 
            queryKey: ['unread-discipleship-count'],
            refetchType: 'all'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isCollaborator, queryClient]);

  return { unreadDiscipleshipCount };
};
