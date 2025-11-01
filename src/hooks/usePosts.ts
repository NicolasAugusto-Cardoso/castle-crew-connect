import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type EmojiType = 'fire' | 'heart' | 'hands';

export interface Reaction {
  emoji_type: EmojiType;
  count: number;
  user_reacted: boolean;
}

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
  reactions?: Reaction[];
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

      // Get reactions
      const { data: reactions } = await supabase
        .from('post_reactions')
        .select('post_id, user_id, emoji_type');

      // Combine data
      return postsData.map(post => {
        const author = profiles?.find(p => p.id === post.author_id);
        const postLikes = likes?.filter(l => l.post_id === post.id) || [];
        const postReactions = reactions?.filter(r => r.post_id === post.id) || [];
        
        // Group reactions by emoji type
        const reactionsByEmoji: Record<EmojiType, Reaction> = {
          fire: { emoji_type: 'fire', count: 0, user_reacted: false },
          heart: { emoji_type: 'heart', count: 0, user_reacted: false },
          hands: { emoji_type: 'hands', count: 0, user_reacted: false }
        };

        postReactions.forEach(reaction => {
          const emojiType = reaction.emoji_type as EmojiType;
          reactionsByEmoji[emojiType].count++;
          if (user && reaction.user_id === user.id) {
            reactionsByEmoji[emojiType].user_reacted = true;
          }
        });
        
        return {
          ...post,
          author_name: author?.name || 'Usuário',
          author_avatar: author?.avatar_url,
          likes_count: postLikes.length,
          is_liked: user ? postLikes.some(l => l.user_id === user.id) : false,
          reactions: Object.values(reactionsByEmoji)
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
    onMutate: async (postId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      
      // Snapshot previous state
      const previousPosts = queryClient.getQueryData(['posts']);
      
      // Optimistic update
      queryClient.setQueryData(['posts'], (old: Post[] | undefined) => {
        if (!old) return old;
        
        return old.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: !post.is_liked,
              likes_count: (post.likes_count || 0) + (post.is_liked ? -1 : 1)
            };
          }
          return post;
        });
      });
      
      return { previousPosts };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      toast.error('Erro ao curtir postagem');
      console.error(err);
    },
    onSettled: () => {
      // Revalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const toggleReaction = useMutation({
    mutationFn: async ({ postId, emojiType }: { postId: string; emojiType: EmojiType }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already reacted with this emoji
      const { data: existingReaction } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('emoji_type', emojiType)
        .maybeSingle();

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('id', existingReaction.id);
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({ post_id: postId, user_id: user.id, emoji_type: emojiType });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, emojiType }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts']);
      
      queryClient.setQueryData(['posts'], (old: Post[] | undefined) => {
        if (!old) return old;
        
        return old.map(post => {
          if (post.id === postId && post.reactions) {
            const updatedReactions = post.reactions.map(reaction => {
              if (reaction.emoji_type === emojiType) {
                return {
                  ...reaction,
                  user_reacted: !reaction.user_reacted,
                  count: reaction.count + (reaction.user_reacted ? -1 : 1)
                };
              }
              return reaction;
            });
            return { ...post, reactions: updatedReactions };
          }
          return post;
        });
      });
      
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      toast.error('Erro ao reagir');
      console.error(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  return {
    posts,
    isLoading,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    toggleReaction
  };
}
