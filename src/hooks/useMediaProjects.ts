import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { MediaProject, MediaProjectType, MediaProjectData } from '@/types/studio';

export function useMediaProjects(filter?: { taskId?: string; type?: MediaProjectType }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['media-projects', user?.id, filter],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('media_projects')
        .select('*')
        .order('updated_at', { ascending: false });
      if (filter?.taskId) q = q.eq('task_id', filter.taskId);
      if (filter?.type) q = q.eq('type', filter.type);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as MediaProject[];
    },
  });
}

export function useMediaProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['media-project', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_projects')
        .select('*')
        .eq('id', projectId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as MediaProject | null;
    },
  });
}

export function useCreateMediaProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      type: MediaProjectType;
      title?: string;
      task_id?: string | null;
      source_url?: string | null;
      project_data?: MediaProjectData;
    }) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('media_projects')
        .insert({
          user_id: user.id,
          type: input.type,
          title: input.title || (input.type === 'video' ? 'Novo vídeo' : 'Nova foto'),
          task_id: input.task_id ?? null,
          source_url: input.source_url ?? null,
          project_data: (input.project_data ?? {}) as never,
        })
        .select()
        .single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['media-projects'] });
      return data as unknown as MediaProject;
    },
  });
}

export function useUpdateMediaProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      thumbnail_url?: string | null;
      source_url?: string | null;
      output_url?: string | null;
      project_data?: MediaProjectData;
    }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from('media_projects')
        .update(patch as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['media-projects'] });
      qc.invalidateQueries({ queryKey: ['media-project', id] });
      return data as unknown as MediaProject;
    },
  });
}

export function useDeleteMediaProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('media_projects').delete().eq('id', id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['media-projects'] });
      return id;
    },
  });
}

export async function uploadMediaFile(opts: {
  userId: string;
  file: File;
  folder: 'sources' | 'exports' | 'thumbnails';
}) {
  const ext = opts.file.name.split('.').pop() || 'bin';
  const path = `${opts.userId}/${opts.folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('media-projects')
    .upload(path, opts.file, { cacheControl: '3600', upsert: false, contentType: opts.file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('media-projects').getPublicUrl(path);
  return { path, url: data.publicUrl };
}
