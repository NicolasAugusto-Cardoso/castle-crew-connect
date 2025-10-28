import { useAuth } from '@/hooks/useAuth';
import { useTestimonials } from '@/hooks/useTestimonials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles, Loader2 } from 'lucide-react';

export default function Testimonials() {
  const { hasRole } = useAuth();
  const canManageTestimonials = hasRole(['admin', 'social_media']);
  const { testimonials, isLoading } = useTestimonials(canManageTestimonials);

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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : testimonials.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-accent" />
            <p>Nenhum testemunho publicado ainda</p>
            {canManageTestimonials && (
              <p className="text-sm mt-2">Adicione o primeiro testemunho!</p>
            )}
          </CardContent>
        </Card>
      ) : (
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
                <p className="text-sm font-semibold text-primary">{testimonial.author_name}</p>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{testimonial.content}</p>
                <p className="text-xs text-muted-foreground mt-4">
                  {new Date(testimonial.created_at).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
