import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string | null;
  likes_count?: number;
  is_liked?: boolean;
  comments_count?: number;
}

export function usePosts() {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      // Get all posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      if (!postsData) return [];

      // Get author profiles
      const authorIds = [...new Set(postsData.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', authorIds);

      // Get likes count and user likes
      const { data: { user } } = await supabase.auth.getUser();
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id, user_id');

      // Get comments count
      const { data: comments } = await supabase
        .from('post_comments')
        .select('post_id');

      // Combine data
      return postsData.map(post => {
        const author = profiles?.find(p => p.id === post.author_id);
        const postLikes = likes?.filter(l => l.post_id === post.id) || [];
        const postComments = comments?.filter(c => c.post_id === post.id) || [];
        
        return {
          ...post,
          author_name: author?.name || 'Usuário',
          author_avatar: author?.avatar_url,
          likes_count: postLikes.length,
          is_liked: user ? postLikes.some(l => l.user_id === user.id) : false,
          comments_count: postComments.length
        };
      }) as Post[];
    }
  });

  const createPost = useMutation({
    mutationFn: async (post: { title: string; content: string; image_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          ...post,
          author_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Postagem criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar postagem');
      console.error(error);
    }
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Post> & { id: string }) => {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Postagem atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar postagem');
      console.error(error);
    }
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Postagem excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir postagem');
      console.error(error);
    }
  });

  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      toast.error('Erro ao curtir postagem');
      console.error(error);
    }
  });

  return {
    posts,
    isLoading,
    createPost,
    updatePost,
    deletePost,
    toggleLike
  };
}
