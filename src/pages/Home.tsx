import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MessageCircle, Plus, BookOpen } from 'lucide-react';
import { Post, VerseOfTheDay } from '@/types';

// Mock data
const mockVerse: VerseOfTheDay = {
  reference: 'João 3:16',
  text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
  date: new Date().toISOString(),
};

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Ação Evangelística na Unimar',
    content: 'Glória a Deus! Neste sábado realizamos mais uma ação evangelística na Unimar. Foram muitas vidas alcançadas e corações tocados pela palavra! 🙏✨',
    image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800',
    authorId: '1',
    authorName: 'Castle Movement',
    likes: 42,
    comments: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Culto Jovem - Sexta-feira',
    content: 'Vem aí o Culto Jovem desta sexta! Presença confirmada da banda Altitude. Não perca! 🎸🔥',
    authorId: '2',
    authorName: 'Mídia Castle',
    likes: 38,
    comments: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function Home() {
  const { hasRole } = useAuth();
  const [posts] = useState<Post[]>(mockPosts);
  const [verse] = useState<VerseOfTheDay>(mockVerse);

  const canManagePosts = hasRole(['admin', 'social_media']);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl md:ml-64">
      {/* Verse of the Day */}
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

      {/* New Post Button */}
      {canManagePosts && (
        <Button className="w-full mb-6 h-14 btn-gradient text-base">
          <Plus className="w-5 h-5 mr-2" />
          Criar Nova Postagem
        </Button>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="card-elevated">
            <CardHeader>
              <CardTitle className="text-xl">{post.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Por {post.authorName} • {new Date(post.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {post.image && (
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <p className="text-foreground leading-relaxed">{post.content}</p>
              
              <div className="flex items-center gap-6 pt-4 border-t">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Heart className="w-5 h-5" />
                  <span className="font-medium">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{post.comments.length}</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
