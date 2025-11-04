import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CollaboratorProfile } from '@/types/collaborator';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useCollaborators() {
  return useQuery({
    queryKey: ['collaborators-complete'],
    queryFn: async () => {
      // Buscar perfis de colaboradores com JOIN em profiles
      const { data, error } = await supabase
        .from('collaborator_profiles')
        .select(`
          id,
          user_id,
          church,
          position,
          bio,
          city,
          state,
          neighborhood,
          age,
          accepting_new,
          profiles!inner(name, avatar_url)
        `)
        .not('church', 'is', null)
        .not('city', 'is', null)
        .not('state', 'is', null)
        .not('age', 'is', null)
        .order('city', { ascending: true });

      if (error) throw error;

      // Transformar dados para incluir nome e avatar do profile
      const collaborators: CollaboratorProfile[] = (data || [])
        .map((item: any) => {
          // Verificar se tem perfil associado e campos obrigatórios
          if (!item.profiles?.name || !item.profiles?.avatar_url) {
            return null;
          }

          return {
            id: item.id,
            user_id: item.user_id,
            church: item.church,
            position: item.position,
            bio: item.bio,
            city: item.city,
            state: item.state,
            neighborhood: item.neighborhood,
            age: item.age,
            accepting_new: item.accepting_new,
            created_at: '',
            updated_at: '',
            updated_by: null,
            latitude: null,
            longitude: null,
            region: null,
            street: null,
            street_number: null,
            postal_code: null,
            name: item.profiles.name,
            avatar_url: item.profiles.avatar_url,
          } as CollaboratorProfile;
        })
        .filter((item): item is CollaboratorProfile => item !== null);

      return collaborators;
    },
  });
}

// Hook para verificar se deve mostrar a aba de colaboradores
export function useShowCollaboratorsTab() {
  const queryClient = useQueryClient();

  // Configurar listener de realtime para atualizar quando perfis mudarem
  useEffect(() => {
    const channel = supabase
      .channel('collaborator-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaborator_profiles',
        },
        () => {
          // Invalidar query quando houver mudanças
          queryClient.invalidateQueries({ queryKey: ['show-collaborators-tab'] });
          queryClient.invalidateQueries({ queryKey: ['collaborators-complete'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['show-collaborators-tab'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('collaborator_profiles')
        .select(`
          id,
          profiles!inner(avatar_url)
        `, { count: 'exact', head: true })
        .not('church', 'is', null)
        .not('city', 'is', null)
        .not('state', 'is', null)
        .not('age', 'is', null)
        .not('profiles.avatar_url', 'is', null);

      if (error) throw error;
      
      return (count || 0) > 0;
    },
  });
}
