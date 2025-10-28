import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GalleryFolder {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  event_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryMedia {
  id: string;
  folder_id: string;
  url: string;
  type: string;
  created_by: string;
  created_at: string;
}

export function useGallery() {
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['gallery-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_folders')
        .select('*')
        .order('event_date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as GalleryFolder[];
    }
  });

  const createFolder = useMutation({
    mutationFn: async (folder: { name: string; description?: string; event_date?: string; cover_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('gallery_folders')
        .insert({
          ...folder,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-folders'] });
      toast.success('Pasta criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar pasta');
      console.error(error);
    }
  });

  const updateFolder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GalleryFolder> & { id: string }) => {
      const { data, error } = await supabase
        .from('gallery_folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-folders'] });
      toast.success('Pasta atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar pasta');
      console.error(error);
    }
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gallery_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-folders'] });
      toast.success('Pasta excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir pasta');
      console.error(error);
    }
  });

  const getMediaByFolder = (folderId: string) => {
    return useQuery({
      queryKey: ['gallery-media', folderId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('gallery_media')
          .select('*')
          .eq('folder_id', folderId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as GalleryMedia[];
      },
      enabled: !!folderId
    });
  };

  return {
    folders,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    getMediaByFolder
  };
}
