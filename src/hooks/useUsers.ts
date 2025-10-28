import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserWithRoles {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  roles: string[];
  created_at: string;
}

export const useUsers = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = profiles.map((profile) => ({
        id: profile.id,
        email: '', // Will be populated from auth
        name: profile.name,
        avatar_url: profile.avatar_url || undefined,
        roles: userRoles
          .filter((ur) => ur.user_id === profile.id)
          .map((ur) => ur.role),
        created_at: profile.created_at,
      }));

      // Fetch emails from auth.users (admin only)
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      if (authUsers?.users) {
        authUsers.users.forEach((authUser: { id: string; email?: string }) => {
          const user = usersWithRoles.find((u) => u.id === authUser.id);
          if (user) {
            user.email = authUser.email || '';
          }
        });
      }

      return usersWithRoles;
    },
  });

  const createUser = useMutation({
    mutationFn: async ({
      email,
      password,
      name,
      roles,
    }: {
      email: string;
      password: string;
      name: string;
      roles: string[];
    }) => {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Insert roles
      const roleInserts = roles.map((role) => ({
        user_id: authData.user.id,
        role: role as 'admin' | 'social_media' | 'collaborator' | 'user',
      }));

      const { error: rolesError } = await supabase
        .from('user_roles')
        .insert(roleInserts);

      if (rolesError) throw rolesError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    },
  });

  const updateUserRoles = useMutation({
    mutationFn: async ({
      userId,
      roles,
    }: {
      userId: string;
      roles: string[];
    }) => {
      // Delete existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new roles
      if (roles.length > 0) {
        const roleInserts = roles.map((role) => ({
          user_id: userId,
          role: role as 'admin' | 'social_media' | 'collaborator' | 'user',
        }));

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Roles atualizadas com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar roles: ${error.message}`);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário removido com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao remover usuário: ${error.message}`);
    },
  });

  return {
    users: users || [],
    isLoading,
    createUser: createUser.mutate,
    updateUserRoles: updateUserRoles.mutate,
    deleteUser: deleteUser.mutate,
    isCreating: createUser.isPending,
    isUpdating: updateUserRoles.isPending,
    isDeleting: deleteUser.isPending,
  };
};
