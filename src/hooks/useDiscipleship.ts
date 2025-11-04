import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from './useAuth';

export interface DiscipleshipContact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  age: number | null;
  city: string | null;
  neighborhood: string | null;
  assigned_collaborator_id: string | null;
  assigned_at: string | null;
  assigned_by: string | null;
  status: string;
  registered_by: string;
  created_at: string;
  updated_at: string;
  distance_km?: number | null;
  assigned_collaborator_name?: string;
}

export interface CollaboratorProfile {
  id: string;
  user_id: string;
  church: string | null;
  position: string | null;
  bio: string | null;
  region: string | null;
  city: string | null;
  neighborhood: string | null;
  name?: string;
  avatar_url?: string | null;
}

export function useDiscipleship() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Listen for realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('discipleship-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discipleship_contacts',
          filter: `assigned_collaborator_id=eq.${user.id}`
        },
        async (payload) => {
          const newContact = payload.new as DiscipleshipContact;
          
          // Get profile name
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', newContact.registered_by)
            .single();

          toast.success(
            `Novo discipulado atribuído a você!`,
            {
              description: `${newContact.name} - ${newContact.neighborhood || newContact.city || 'Sem localização'}\nCadastrado por: ${profile?.name || 'Desconhecido'}`,
              duration: 8000,
            }
          );
          
          queryClient.invalidateQueries({ queryKey: ['discipleship-contacts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['discipleship-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipleship_contacts')
        .select('*')
        .order('created_at', { ascending: false});

      if (error) throw error;
      if (!data) return [];

      // Get collaborator names
      const collaboratorIds = data
        .map(c => c.assigned_collaborator_id)
        .filter((id): id is string => id !== null);
      
      if (collaboratorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', collaboratorIds);

        return data.map(contact => ({
          ...contact,
          assigned_collaborator_name: profiles?.find(p => p.id === contact.assigned_collaborator_id)?.name
        })) as DiscipleshipContact[];
      }

      return data as DiscipleshipContact[];
    }
  });

  const { data: collaborators = [], isLoading: loadingCollaborators } = useQuery({
    queryKey: ['collaborators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborator_profiles')
        .select('*');

      if (error) throw error;
      if (!data) return [];

      // Get user names and avatars
      const userIds = data.map(c => c.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      return data.map(collab => {
        const profile = profiles?.find(p => p.id === collab.user_id);
        return {
          ...collab,
          name: profile?.name,
          avatar_url: profile?.avatar_url
        };
      }) as CollaboratorProfile[];
    }
  });

  const createContact = useMutation({
    mutationFn: async (contactData: {
      name: string;
      phone: string;
      age: number;
      city: string;
      neighborhood: string;
      street?: string;
      street_number?: string;
      state?: string;
      postal_code?: string;
      latitude?: number | null;
      longitude?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('discipleship_contacts')
        .insert({
          ...contactData,
          registered_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Get assigned collaborator name if available
      if (data.assigned_collaborator_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', data.assigned_collaborator_id)
          .single();
        
        return {
          ...data,
          assigned_collaborator_name: profile?.name
        };
      }
      
      return data;
    },
    onSuccess: (data: DiscipleshipContact & { assigned_collaborator_name?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['discipleship-contacts'] });
      
      if (data.assigned_collaborator_id) {
        toast.success(
          'Cadastro realizado com sucesso!',
          {
            description: `Pessoa atribuída automaticamente ao colaborador: ${data.assigned_collaborator_name || 'Desconhecido'}`,
            duration: 6000,
          }
        );
      } else {
        toast.warning(
          'Cadastro realizado!',
          {
            description: 'Nenhum colaborador disponível para a região foi encontrado. O administrador será notificado.',
            duration: 6000,
          }
        );
      }
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar contato');
      console.error(error);
    }
  });

  const updateContactStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('discipleship_contacts')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipleship-contacts'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status');
      console.error(error);
    }
  });

  const assignCollaborator = useMutation({
    mutationFn: async ({ contactId, collaboratorId }: { contactId: string; collaboratorId: string }) => {
      const { data, error } = await supabase
        .from('discipleship_contacts')
        .update({ assigned_collaborator_id: collaboratorId })
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipleship-contacts'] });
      toast.success('Colaborador atribuído!');
    },
    onError: (error) => {
      toast.error('Erro ao atribuir colaborador');
      console.error(error);
    }
  });

  return {
    contacts,
    collaborators,
    isLoading: loadingContacts || loadingCollaborators,
    createContact,
    updateContactStatus,
    assignCollaborator
  };
}
