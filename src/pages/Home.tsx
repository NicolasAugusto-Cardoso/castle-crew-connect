import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useVerseOfTheDay } from '@/hooks/useVerseOfTheDay';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Heart, BookOpen, Loader2, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { CreatePostDialog } from '@/components/posts/CreatePostDialog';
import { EditPostDialog } from '@/components/posts/EditPostDialog';
import { ImageLightbox } from '@/components/posts/ImageLightbox';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

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

  const handleLike = (postId: string, isLiked: boolean) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para curtir publicações",
        variant: "destructive"
      });
      return;
    }
    toggleLike.mutate(postId);
  };

  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6 max-w-2xl">
      {/* Welcome Section */}
      <div className="mb-6 xs:mb-7 sm:mb-8 text-center animate-fade-in px-2">
        <h1 className="text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1.5 xs:mb-2">
          Bem-vindo ao Castle Movement
        </h1>
        <p className="text-sm xs:text-base text-muted-foreground">
          Comunidade, fé e transformação
        </p>
      </div>

      {/* Verse of the Day */}
      {verse && !loadingVerse ? (
        <Card className="mb-5 xs:mb-5.5 sm:mb-6 bg-gradient-to-br from-primary-light to-primary text-white card-elevated animate-fade-in">
          <CardHeader className="pb-2.5 xs:pb-3 px-4 xs:px-5 sm:px-6 pt-4 xs:pt-5 sm:pt-6">
            <div className="flex items-center gap-1.5 xs:gap-2">
              <BookOpen className="w-4 xs:w-4.5 sm:w-5 h-4 xs:h-4.5 sm:h-5 text-accent flex-shrink-0" />
              <h2 className="text-base xs:text-lg font-bold">Versículo do Dia</h2>
            </div>
          </CardHeader>
          <CardContent className="px-4 xs:px-5 sm:px-6 pb-4 xs:pb-5 sm:pb-6">
            <p className="text-sm xs:text-base md:text-lg mb-2.5 xs:mb-3 leading-relaxed whitespace-pre-wrap break-words">
              "{verse.text}"
            </p>
            <p className="text-xs xs:text-sm md:text-base font-bold text-accent hover:text-white transition-colors cursor-default">
              {verse.reference}
            </p>
          </CardContent>
        </Card>
      ) : loadingVerse ? (
        <Card className="mb-5 xs:mb-5.5 sm:mb-6 card-elevated">
          <CardContent className="py-5 xs:py-5.5 sm:py-6 px-4 xs:px-5 sm:px-6">
            <div className="flex items-center gap-2.5 xs:gap-3">
              <Loader2 className="w-4 xs:w-4.5 sm:w-5 h-4 xs:h-4.5 sm:h-5 animate-spin text-primary flex-shrink-0" />
              <p className="text-xs xs:text-sm text-muted-foreground">Carregando versículo do dia...</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* New Post Button */}
      {canManagePosts && (
        <div className="mb-5 xs:mb-5.5 sm:mb-6">
          <CreatePostDialog />
        </div>
      )}

      {/* Posts Feed */}
      {loadingPosts ? (
        <div className="flex justify-center py-10 xs:py-11 sm:py-12">
          <Loader2 className="w-7 xs:w-7.5 sm:w-8 h-7 xs:h-7.5 sm:h-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-10 xs:py-11 sm:py-12 px-4 xs:px-5 sm:px-6 text-center text-muted-foreground">
            <p className="text-sm xs:text-base">Nenhuma postagem ainda</p>
            {canManagePosts && (
              <p className="text-xs xs:text-sm mt-2">Seja o primeiro a criar uma postagem!</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
          {posts.map((post) => {
            const postImages = post.images && post.images.length > 0 
              ? post.images.sort((a, b) => a.display_order - b.display_order)
              : post.image_url 
                ? [{ id: 'legacy', image_url: post.image_url, display_order: 0, post_id: post.id, created_at: '' }]
                : [];
            
            return (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author_avatar || undefined} />
                        <AvatarFallback>
                          {post.author_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{post.author_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    {canManagePosts && (
                      <EditPostDialog post={post} />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Carousel para múltiplas imagens ou imagem única */}
                  {postImages.length > 1 ? (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {postImages.map((img, idx) => (
                          <CarouselItem key={img.id}>
                            <div 
                              className="w-full aspect-square overflow-hidden bg-muted cursor-pointer hover:opacity-95 transition-opacity flex items-center justify-center"
                              onClick={() => setSelectedImage({ url: img.image_url, alt: `Imagem ${idx + 1}` })}
                            >
                              <img
                                src={img.image_url}
                                alt={`Imagem ${idx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  ) : postImages.length === 1 ? (
                    <div 
                      className="w-full aspect-square overflow-hidden bg-muted cursor-pointer hover:opacity-95 transition-opacity flex items-center justify-center"
                      onClick={() => setSelectedImage({ url: postImages[0].image_url, alt: 'Imagem' })}
                    >
                      <img
                        src={postImages[0].image_url}
                        alt="Imagem"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}

                  {/* Likes e Reactions */}
                  <div className="flex items-center gap-4 border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id, post.is_liked || false)}
                      onMouseDown={(e) => handlePressStart(e, post.id)}
                      onMouseUp={handlePressEnd}
                      onMouseLeave={handlePressEnd}
                      onTouchStart={(e) => handlePressStart(e, post.id)}
                      onTouchEnd={handlePressEnd}
                      className="gap-2"
                      disabled={!user || isProcessing}
                    >
                      <Heart
                        className={cn(
                          "h-5 w-5",
                          post.is_liked && "fill-red-500 text-red-500"
                        )}
                      />
                      <span>{post.likes_count || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handlePressStart(e, post.id)}
                      onMouseDown={(e) => handlePressStart(e, post.id)}
                      onMouseUp={handlePressEnd}
                      onMouseLeave={handlePressEnd}
                      onTouchStart={(e) => handlePressStart(e, post.id)}
                      onTouchEnd={handlePressEnd}
                      className="gap-2"
                      disabled={!user || isProcessing}
                    >
                      {post.user_reaction ? (
                        <span className="text-lg">{EMOJI_MAP[post.user_reaction]}</span>
                      ) : (
                        <Smile className="h-5 w-5" />
                      )}
                      <span>
                        {post.reactions.fire + post.reactions.heart + post.reactions.hands}
                      </span>
                    </Button>
                  </div>

                  {/* Legenda */}
                  {post.content && (
                    <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
