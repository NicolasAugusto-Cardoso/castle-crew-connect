import { useAuth } from '@/hooks/useAuth';
import { useTestimonials } from '@/hooks/useTestimonials';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import { CreateTestimonialDialog } from '@/components/testimonials/CreateTestimonialDialog';
import { EditTestimonialDialog } from '@/components/testimonials/EditTestimonialDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export default function Testimonials() {
  const { hasRole, user } = useAuth();
  const canManageTestimonials = hasRole(['admin', 'social_media']);
  const { testimonials, isLoading, deleteTestimonial } = useTestimonials(canManageTestimonials);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!testimonialToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteTestimonial.mutateAsync(testimonialToDelete);
      setDeleteOpen(false);
      setTestimonialToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold gradient-text">Testemunhos</h1>
        </div>
        <p className="text-muted-foreground">
          Histórias reais de transformação através de Jesus
        </p>
      </div>

      {user && (
        <div className="mb-6">
          <CreateTestimonialDialog />
        </div>
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
                  <div className="flex-1">
                    <CardTitle className="text-xl">{testimonial.title}</CardTitle>
                    <p className="text-sm font-semibold text-primary mt-1">
                      {testimonial.author_name || 'Anônimo'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageTestimonials && (
                      <Badge variant={testimonial.status === 'published' ? 'default' : 'secondary'}>
                        {testimonial.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    )}
                    {/* Mostrar editar apenas para o próprio criador se for rascunho */}
                    {user?.id === testimonial.created_by && testimonial.status === 'draft' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <EditTestimonialDialog testimonial={testimonial} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {/* Mostrar apenas delete para admins */}
                    {canManageTestimonials && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTestimonialToDelete(testimonial.id);
                          setDeleteOpen(true);
                        }}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este testemunho? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
