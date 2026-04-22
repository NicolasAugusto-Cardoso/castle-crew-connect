import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type TaskStatus = Database['public']['Enums']['task_status'];

export interface SocialMediaTask {
  id: string;
  title: string;
  instructions: string | null;
  reference_urls: { url: string; name: string; type: string }[];
  due_date: string | null;
  status: TaskStatus;
  created_by: string;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  instructions?: string;
  reference_urls?: { url: string; name: string; type: string }[];
  due_date?: string | null;
  assigned_to?: string | null;
}

export const TASKS_QUERY_KEY = ['social-media-tasks'];

export function useSocialMediaTasks() {
  return useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as SocialMediaTask[];
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('social_media_tasks')
        .insert({
          title: input.title,
          instructions: input.instructions || null,
          reference_urls: (input.reference_urls || []) as any,
          due_date: input.due_date || null,
          assigned_to: input.assigned_to || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.refetchQueries({ queryKey: TASKS_QUERY_KEY });
      toast.success('Tarefa criada!');
    },
    onError: (err: Error) => {
      toast.error('Erro ao criar tarefa', { description: err.message });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from('social_media_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.refetchQueries({ queryKey: TASKS_QUERY_KEY });
    },
    onError: (err: Error) => {
      toast.error('Erro ao atualizar status', { description: err.message });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('social_media_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.refetchQueries({ queryKey: TASKS_QUERY_KEY });
      toast.success('Tarefa excluída');
    },
    onError: (err: Error) => {
      toast.error('Erro ao excluir', { description: err.message });
    },
  });
}

export async function uploadTaskReference(file: File, userId: string) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('task-references')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('task-references').getPublicUrl(path);
  return {
    url: data.publicUrl,
    name: file.name,
    type: file.type.startsWith('video') ? 'video' : 'image',
  };
}

export function useSocialMediaUsers() {
  return useQuery({
    queryKey: ['social-media-users'],
    queryFn: async () => {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'social_media');

      if (roleError) throw roleError;
      const ids = (roleData || []).map((r) => r.user_id);
      if (ids.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', ids);

      if (profilesError) throw profilesError;
      return profiles || [];
    },
  });
}
