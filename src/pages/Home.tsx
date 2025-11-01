import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useVerseOfTheDay } from '@/hooks/useVerseOfTheDay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, BookOpen, Loader2, MoreVertical } from 'lucide-react';
import castleLogo from '@/assets/castle-logo.png';
import { CreatePostDialog } from '@/components/posts/CreatePostDialog';
import { EditPostDialog } from '@/components/posts/EditPostDialog';
import { ImageLightbox } from '@/components/posts/ImageLightbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const EMOJI_MAP = {
  fire: '🔥',
  heart: '❤️',
  hands: '🙌'
} as const;

export default function Home() {
  const { hasRole } = useAuth();
  const { posts, isLoading: loadingPosts, toggleLike, toggleReaction } = usePosts();
  const { verse, isLoading: loadingVerse } = useVerseOfTheDay();
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

  const canManagePosts = hasRole(['admin', 'social_media']);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Welcome Section with Logo */}
      <div className="mb-8 text-center animate-fade-in">
        <img 
          src={castleLogo} 
          alt="Castle Movement" 
          className="h-24 md:h-32 w-auto mx-auto mb-4"
        />
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
                
                {/* Like Button */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <button
                    onClick={() => toggleLike.mutate(post.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      post.is_liked
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{post.likes_count || 0}</span>
                  </button>
                </div>

                {/* Emoji Reactions */}
                <div className="flex items-center gap-3 pt-3 pb-2">
                  {post.reactions?.map((reaction) => (
                    <button
                      key={reaction.emoji_type}
                      onClick={() => toggleReaction.mutate({ 
                        postId: post.id, 
                        emojiType: reaction.emoji_type 
                      })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                        reaction.user_reacted
                          ? 'bg-primary/20 text-primary ring-2 ring-primary/30 scale-105'
                          : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="text-lg">{EMOJI_MAP[reaction.emoji_type]}</span>
                      {reaction.count > 0 && (
                        <span className="text-sm font-semibold">{reaction.count}</span>
                      )}
                    </button>
                  ))}
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
    </div>
  );
}
