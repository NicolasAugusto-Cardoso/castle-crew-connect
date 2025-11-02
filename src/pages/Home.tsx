import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useVerseOfTheDay } from '@/hooks/useVerseOfTheDay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, BookOpen, Loader2, MoreVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CreatePostDialog } from '@/components/posts/CreatePostDialog';
import { EditPostDialog } from '@/components/posts/EditPostDialog';
import { ImageLightbox } from '@/components/posts/ImageLightbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ReactionMenu } from '@/components/posts/ReactionMenu';
import { EmojiType } from '@/hooks/usePosts';

const EMOJI_MAP = {
  fire: '🔥',
  heart: '❤️',
  hands: '🙌'
} as const;

export default function Home() {
  const { user, hasRole } = useAuth();
  const { posts, isLoading: loadingPosts, toggleLike, setReaction } = usePosts();
  const { verse, isLoading: loadingVerse } = useVerseOfTheDay();
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [reactionMenu, setReactionMenu] = useState<{
    isOpen: boolean;
    postId: string | null;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    postId: null,
    position: { x: 0, y: 0 }
  });

  const canManagePosts = hasRole(['admin', 'social_media']);
  const isProcessing = setReaction.isPending || toggleLike.isPending;

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent, postId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para reagir às publicações",
        variant: "destructive"
      });
      return;
    }

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    const timer = setTimeout(() => {
      const x = rect.left + rect.width / 2;
      const y = rect.top;
      
      setReactionMenu({
        isOpen: true,
        postId,
        position: { x, y }
      });
    }, 500);

    setPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleReactionSelect = (emojiType: EmojiType) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para reagir às publicações",
        variant: "destructive"
      });
      return;
    }
    
    if (reactionMenu.postId) {
      setReaction.mutate({ postId: reactionMenu.postId, emojiType });
    }
    setReactionMenu({ isOpen: false, postId: null, position: { x: 0, y: 0 } });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (reactionMenu.isOpen) {
        setReactionMenu({ isOpen: false, postId: null, position: { x: 0, y: 0 } });
      }
    };

    if (reactionMenu.isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [reactionMenu.isOpen]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Welcome Section */}
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Bem-vindo ao Castle Movement
        </h1>
        <p className="text-muted-foreground">
          Comunidade, fé e transformação
        </p>
      </div>

      {/* Verse of the Day - Async loading without blocking feed */}
      {verse && !loadingVerse ? (
        <Card className="mb-6 bg-gradient-to-br from-primary-light to-primary text-white card-elevated animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              <CardTitle className="text-lg font-bold">Versículo do Dia</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base md:text-lg mb-3 leading-relaxed whitespace-pre-wrap break-words">
              "{verse.text}"
            </p>
            <p className="text-sm md:text-base font-bold text-accent hover:text-white transition-colors cursor-default">
              {verse.reference}
            </p>
          </CardContent>
        </Card>
      ) : loadingVerse ? (
        <Card className="mb-6 card-elevated">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando versículo do dia...</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* New Post Button */}
      {canManagePosts && (
        <div className="mb-6">
          <CreatePostDialog />
        </div>
      )}

      {/* Posts Feed */}
      {loadingPosts ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhuma postagem ainda</p>
            {canManagePosts && (
              <p className="text-sm mt-2">Seja o primeiro a criar uma postagem!</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="card-elevated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Por {post.author_name} • {new Date(post.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {canManagePosts && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <EditPostDialog post={post} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {post.image_url && (
                  <div 
                    className="w-full max-h-[500px] overflow-hidden rounded-lg bg-muted cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => setSelectedImage({ url: post.image_url!, alt: post.title })}
                  >
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-auto object-contain max-h-[500px]"
                    />
                  </div>
                )}
                <p className="text-foreground leading-relaxed">{post.content}</p>
                
                {/* Interaction - Click to like, Hold for reactions */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <button
                    disabled={!user || isProcessing}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!user) {
                        toast({
                          title: "Login necessário",
                          description: "Faça login para curtir publicações",
                          variant: "destructive"
                        });
                        return;
                      }
                      toggleLike.mutate(post.id);
                    }}
                    onMouseDown={(e) => handlePressStart(e, post.id)}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={(e) => handlePressStart(e, post.id)}
                    onTouchEnd={handlePressEnd}
                    className={`flex items-center gap-2 transition-all ${
                      !user 
                        ? 'opacity-50 cursor-not-allowed' 
                        : isProcessing
                        ? 'opacity-50 cursor-wait'
                        : post.user_reaction
                        ? 'text-primary font-bold scale-110'
                        : post.is_liked
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                    title={!user ? 'Faça login para curtir' : 'Clique para curtir, segure para reagir'}
                  >
                    {post.user_reaction ? (
                      <span className="text-2xl animate-scale-in">{EMOJI_MAP[post.user_reaction]}</span>
                    ) : (
                      <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                    )}
                    <span className="font-medium">
                      {post.user_reaction 
                        ? post.reactions[post.user_reaction]
                        : post.likes_count || 0}
                    </span>
                  </button>

                  {/* Other Reaction Counts */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {Object.entries(post.reactions).map(([type, count]) => {
                      const emojiType = type as EmojiType;
                      if (count > 0 && emojiType !== post.user_reaction) {
                        return (
                          <span key={type} className="flex items-center gap-1">
                            {EMOJI_MAP[emojiType]} {count}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <ImageLightbox
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Reaction Menu */}
      <ReactionMenu
        isOpen={reactionMenu.isOpen}
        onSelect={handleReactionSelect}
        position={reactionMenu.position}
      />
    </div>
  );
}
