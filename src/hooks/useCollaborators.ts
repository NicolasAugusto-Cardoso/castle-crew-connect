import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CollaboratorProfile } from '@/types/collaborator';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useCollaborators() {
  return useQuery({
    queryKey: ['collaborators-complete'],
    queryFn: async () => {
      // Buscar perfis de colaboradores (SEM JOIN)
      const { data, error } = await supabase
        .from('collaborator_profiles')
        .select('*')
        .not('church', 'is', null)
        .not('city', 'is', null)
        .not('state', 'is', null)
        .not('age', 'is', null)
        .order('city', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Buscar profiles separadamente
      const userIds = data.map(c => c.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds)
        .not('avatar_url', 'is', null)
        .not('name', 'is', null);

      if (profileError) throw profileError;

      // Criar mapa de profiles para acesso rápido
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combinar dados manualmente
      const collaborators: CollaboratorProfile[] = data
        .filter(item => {
          const profile = profilesMap.get(item.user_id);
          return profile && profile.name && profile.avatar_url;
        })
        .map(item => {
          const profile = profilesMap.get(item.user_id)!;
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
            created_at: item.created_at,
            updated_at: item.updated_at,
            updated_by: item.updated_by,
            latitude: item.latitude,
            longitude: item.longitude,
            region: item.region,
            street: item.street,
            street_number: item.street_number,
            postal_code: item.postal_code,
            name: profile.name,
            avatar_url: profile.avatar_url,
          } as CollaboratorProfile;
        });

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
      // Buscar colaboradores com perfis completos
      const { data, error } = await supabase
        .from('collaborator_profiles')
        .select('user_id')
        .not('church', 'is', null)
        .not('city', 'is', null)
        .not('state', 'is', null)
        .not('age', 'is', null);

      if (error) throw error;
      
      if (!data || data.length === 0) return false;

      // Verificar quais desses têm avatar
      const userIds = data.map(c => c.user_id);
      const { data: profilesWithAvatar, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .in('id', userIds)
        .not('avatar_url', 'is', null);

      if (profileError) throw profileError;
      
      return (profilesWithAvatar || []).length > 0;
    },
  });
}
