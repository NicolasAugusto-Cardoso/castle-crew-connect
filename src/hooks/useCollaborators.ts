import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CollaboratorProfile } from '@/types/collaborator';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useCollaborators() {
  const queryClient = useQueryClient();

  const query = useQuery({
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

      // 🗺️ GEOCODIFICAÇÃO AUTOMÁTICA: Processar colaboradores sem coordenadas
      const needsGeocode = collaborators.filter(c => 
        c.street && c.city && (!c.latitude || !c.longitude)
      );

      if (needsGeocode.length > 0) {
        console.log(`🗺️ Geocodificando ${needsGeocode.length} colaborador(es) sem coordenadas...`);
        
        // Geocodificar em background (não bloqueante)
        Promise.all(
          needsGeocode.map(async (collab) => {
            try {
              const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode-address', {
                body: {
                  street: collab.street,
                  streetNumber: collab.street_number,
                  neighborhood: collab.neighborhood,
                  city: collab.city,
                  state: collab.state,
                  postalCode: collab.postal_code,
                },
              });

              if (geoError) {
                console.error(`❌ Erro ao geocodificar ${collab.name}:`, geoError);
                return;
              }

              if (geoData?.latitude && geoData?.longitude) {
                console.log(`📍 Coordenadas obtidas para ${collab.name}:`, {
                  lat: geoData.latitude,
                  lng: geoData.longitude
                });

                // Atualizar no banco
                const { error: updateError } = await supabase
                  .from('collaborator_profiles')
                  .update({
                    latitude: geoData.latitude,
                    longitude: geoData.longitude,
                  })
                  .eq('user_id', collab.user_id);

                if (updateError) {
                  console.error(`❌ Erro ao salvar coordenadas para ${collab.name}:`, updateError);
                } else {
                  console.log(`✅ Coordenadas salvas para ${collab.name}`);
                }
              }
            } catch (error) {
              console.error(`❌ Erro ao processar ${collab.name}:`, error);
            }
          })
        ).then(() => {
          // Invalidar query após geocodificar todos
          console.log('🔄 Atualizando mapa com novas coordenadas...');
          queryClient.invalidateQueries({ queryKey: ['collaborators-complete'] });
        });
      }

      return collaborators;
    },
  });

  return query;
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
