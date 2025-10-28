import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles } from 'lucide-react';
import { Testimonial } from '@/types';

const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    title: 'Liberto das Drogas',
    content: 'Eu estava nas drogas há 5 anos. Conheci o Castle Movement numa ação na praça e minha vida mudou completamente. Hoje sou livre e servo a Jesus!',
    authorName: 'Carlos Eduardo',
    status: 'published',
    createdAt: new Date(Date.now() - 864000000).toISOString(),
    publishedAt: new Date(Date.now() - 864000000).toISOString(),
  },
  {
    id: '2',
    title: 'Encontrei Propósito',
    content: 'Estava perdida, sem rumo na vida. Através do discipulado do Castle, encontrei Jesus e hoje sei qual é meu propósito!',
    authorName: 'Mariana Silva',
    status: 'published',
    createdAt: new Date(Date.now() - 1728000000).toISOString(),
    publishedAt: new Date(Date.now() - 1728000000).toISOString(),
  },
];

export default function Testimonials() {
  const { hasRole } = useAuth();
  const [testimonials] = useState<Testimonial[]>(mockTestimonials);

  const canManageTestimonials = hasRole(['admin', 'social_media']);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl md:ml-64">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold gradient-text">Testemunhos</h1>
        </div>
        <p className="text-muted-foreground">
          Histórias reais de transformação através de Jesus
        </p>
      </div>

      {canManageTestimonials && (
        <Button className="w-full mb-6 h-14 btn-accent text-base">
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Testemunho
        </Button>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="card-elevated">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl">{testimonial.title}</CardTitle>
                {canManageTestimonials && (
                  <Badge variant={testimonial.status === 'published' ? 'default' : 'secondary'}>
                    {testimonial.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-semibold text-primary">{testimonial.authorName}</p>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{testimonial.content}</p>
              <p className="text-xs text-muted-foreground mt-4">
                {new Date(testimonial.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
