import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type EmojiType = 'fire' | 'heart' | 'hands';

export interface PostImage {
  id: string;
  post_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
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
  user_reaction?: EmojiType | null;
  reactions: Record<EmojiType, number>;
  images?: PostImage[];
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

      // Get post images
      const { data: postImages } = await supabase
        .from('post_images')
        .select('*')
        .order('display_order', { ascending: true });

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
      const { data: reactionsData } = await supabase
        .from('post_reactions')
        .select('post_id, user_id, emoji_type');

      // Combine data
      return postsData.map(post => {
        const images = postImages?.filter(img => img.post_id === post.id) || [];
        const author = profiles?.find(p => p.id === post.author_id);
        const postLikes = likes?.filter(l => l.post_id === post.id) || [];
        const postReactions = reactionsData?.filter(r => r.post_id === post.id) || [];
        
        // Count reactions by type
        const reactionCounts: Record<EmojiType, number> = {
          fire: 0,
          heart: 0,
          hands: 0
        };

        let userReaction: EmojiType | null = null;

        postReactions.forEach(reaction => {
          const emojiType = reaction.emoji_type as EmojiType;
          reactionCounts[emojiType]++;
          if (user && reaction.user_id === user.id) {
            userReaction = emojiType;
          }
        });
        
        return {
          ...post,
          author_name: author?.name || 'Usuário',
          author_avatar: author?.avatar_url,
          likes_count: postLikes.length,
          is_liked: user ? postLikes.some(l => l.user_id === user.id) : false,
          user_reaction: userReaction,
          reactions: reactionCounts,
          images
        };
      }) as Post[];
    }
  });

  const createPost = useMutation({
    mutationFn: async (post: { title: string; content: string; image_url?: string; images?: { image_url: string; display_order: number }[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: post.title,
          content: post.content,
          image_url: post.image_url,
          author_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Insert multiple images if provided
      if (data && post.images && post.images.length > 0) {
        const imagesToInsert = post.images.map(img => ({
          post_id: data.id,
          image_url: img.image_url,
          display_order: img.display_order
        }));

        const { error: imagesError } = await supabase
          .from('post_images')
          .insert(imagesToInsert);

        if (imagesError) {
          console.error('Error inserting images:', imagesError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: 'Sucesso', description: 'Postagem criada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Erro ao criar postagem', variant: 'destructive' });
      console.error(error);
    }
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, images, ...updates }: Omit<Partial<Post>, 'images'> & { id: string; images?: Array<{ id?: string; image_url: string; display_order: number }> }) => {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Handle images update
      if (images !== undefined) {
        // Delete existing images
        await supabase
          .from('post_images')
          .delete()
          .eq('post_id', id);

        // Insert new images
        if (images.length > 0) {
          const imagesToInsert = images.map(img => ({
            post_id: id,
            image_url: img.image_url,
            display_order: img.display_order
          }));

          const { error: imagesError } = await supabase
            .from('post_images')
            .insert(imagesToInsert);

          if (imagesError) {
            console.error('Error updating images:', imagesError);
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: 'Sucesso', description: 'Postagem atualizada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Erro ao atualizar postagem', variant: 'destructive' });
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
      toast({ title: 'Sucesso', description: 'Postagem excluída!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Erro ao excluir postagem', variant: 'destructive' });
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
    onError: (err: any, postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      
      if (err.message?.includes('JWT') || err.message?.includes('auth') || err.message?.includes('Not authenticated')) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para curtir",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao curtir postagem",
          variant: "destructive"
        });
      }
      console.error(err);
    },
    onSettled: () => {
      // Revalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const setReaction = useMutation({
    mutationFn: async ({ postId, emojiType }: { postId: string; emojiType: EmojiType }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user already has a reaction on this post
      const { data: existingReaction } = await supabase
        .from('post_reactions')
        .select('id, emoji_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingReaction) {
        if (existingReaction.emoji_type === emojiType) {
          // Remove reaction if clicking the same emoji
          const { error } = await supabase
            .from('post_reactions')
            .delete()
            .eq('id', existingReaction.id);
          if (error) throw error;
          return { action: 'removed' };
        } else {
          // Update to new emoji
          const { error } = await supabase
            .from('post_reactions')
            .update({ emoji_type: emojiType })
            .eq('id', existingReaction.id);
          if (error) throw error;
          return { action: 'updated', oldEmoji: existingReaction.emoji_type, newEmoji: emojiType };
        }
      } else {
        // Add new reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({ post_id: postId, user_id: user.id, emoji_type: emojiType });
        if (error) throw error;
        return { action: 'added', newEmoji: emojiType };
      }
    },
    onMutate: async ({ postId, emojiType }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts']);
      
      queryClient.setQueryData(['posts'], (old: Post[] | undefined) => {
        if (!old) return old;
        
        return old.map(post => {
          if (post.id === postId) {
            const newReactions = { ...post.reactions };
            const oldReaction = post.user_reaction;
            
            // Remove old reaction count if exists
            if (oldReaction) {
              newReactions[oldReaction] = Math.max(0, newReactions[oldReaction] - 1);
            }
            
            // Toggle or add new reaction
            if (oldReaction === emojiType) {
              // Remove reaction
              return { ...post, user_reaction: null, reactions: newReactions };
            } else {
              // Add/change reaction
              newReactions[emojiType]++;
              return { ...post, user_reaction: emojiType, reactions: newReactions };
            }
          }
          return post;
        });
      });
      
      return { previousPosts };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      
      if (err.message?.includes('JWT') || err.message?.includes('auth') || err.message?.includes('Not authenticated')) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para reagir",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao reagir à publicação",
          variant: "destructive"
        });
      }
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
    setReaction
  };
}
