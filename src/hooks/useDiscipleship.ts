import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DiscipleshipContact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  age: number | null;
  city: string | null;
  neighborhood: string | null;
  assigned_collaborator_id: string | null;
  status: string;
  registered_by: string;
  created_at: string;
  updated_at: string;
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
    mutationFn: async (contact: {
      name: string;
      phone: string;
      email?: string;
      age?: number;
      city?: string;
      neighborhood?: string;
      assigned_collaborator_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('discipleship_contacts')
        .insert({
          ...contact,
          registered_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipleship-contacts'] });
      toast.success('Contato cadastrado com sucesso!');
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
