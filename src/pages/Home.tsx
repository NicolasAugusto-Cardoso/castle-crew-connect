import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useVerseOfTheDay } from '@/hooks/useVerseOfTheDay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MessageCircle, Plus, BookOpen, Loader2 } from 'lucide-react';

export default function Home() {
  const { hasRole } = useAuth();
  const { posts, isLoading: loadingPosts, toggleLike } = usePosts();
  const { verse, isLoading: loadingVerse } = useVerseOfTheDay();

  const canManagePosts = hasRole(['admin', 'social_media']);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl md:ml-64">
      {/* Verse of the Day */}
      {loadingVerse ? (
        <Card className="mb-6 card-elevated">
          <CardContent className="py-8">
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      ) : verse ? (
        <Card className="mb-6 bg-gradient-to-br from-primary-light to-primary text-white card-elevated">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              <CardTitle className="text-lg font-bold">Versículo do Dia</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base mb-2 leading-relaxed">{verse.text}</p>
            <p className="text-sm font-bold text-accent">{verse.reference}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 bg-gradient-to-br from-primary-light to-primary text-white card-elevated">
          <CardContent className="py-8 text-center">
            <BookOpen className="w-12 h-12 text-accent mx-auto mb-3" />
            <p className="text-sm">Nenhum versículo disponível hoje</p>
          </CardContent>
        </Card>
      )}

      {/* New Post Button */}
      {canManagePosts && (
        <Button className="w-full mb-6 h-14 btn-gradient text-base">
          <Plus className="w-5 h-5 mr-2" />
          Criar Nova Postagem
        </Button>
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
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Por {post.author_name} • {new Date(post.created_at).toLocaleDateString('pt-BR')}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
                <p className="text-foreground leading-relaxed">{post.content}</p>
                
                <div className="flex items-center gap-6 pt-4 border-t">
                  <button
                    onClick={() => toggleLike.mutate(post.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      post.is_liked
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                    disabled={toggleLike.isPending}
                  >
                    <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{post.likes_count || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{post.comments_count || 0}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
