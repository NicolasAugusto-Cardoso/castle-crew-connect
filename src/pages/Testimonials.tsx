import { useAuth } from '@/hooks/useAuth';
import { useTestimonials } from '@/hooks/useTestimonials';
import { Card, CardContent } from '@/components/ui/card';
import {
  CardThemed,
  CardThemedHeader,
  CardThemedTitle,
  CardThemedContent,
} from '@/components/ui/themed-card';
import { COLOR_THEMES, getColorTheme } from '@/lib/colorThemes';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import { CreateTestimonialDialog } from '@/components/testimonials/CreateTestimonialDialog';
import { EditTestimonialDialog } from '@/components/testimonials/EditTestimonialDialog';
import { SectionHeading } from '@/components/ui/section-heading';
import { getSectionTheme } from '@/lib/colorThemes';
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
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6 max-w-4xl">
      <div className="mb-6 xs:mb-7 sm:mb-8">
        <SectionHeading
          colorTheme={getSectionTheme('testimonials')}
          as="h1"
          icon={<Sparkles className="w-6 xs:w-7 sm:w-8 h-6 xs:h-7 sm:h-8" />}
        >
          Testemunhos
        </SectionHeading>
        <p className="text-sm xs:text-base text-muted-foreground mt-2">
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
        <div className="grid gap-4 xs:gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {testimonials.map((testimonial, idx) => {
            const theme = getColorTheme(idx);
            const t = COLOR_THEMES[theme];
            return (
              <CardThemed key={testimonial.id} colorTheme={theme}>
                <CardThemedHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardThemedTitle colorTheme={theme} as="h3" className="text-lg sm:text-xl break-words">
                        {testimonial.title}
                      </CardThemedTitle>
                      <p className={cn('text-sm font-semibold mt-1', t.accent)}>
                        {testimonial.author_name || 'Anônimo'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canManageTestimonials && (
                        <Badge variant={testimonial.status === 'published' ? 'default' : 'secondary'} className="whitespace-nowrap">
                          {testimonial.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      )}
                      {user?.id === testimonial.created_by && testimonial.status === 'draft' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 sm:p-2 hover:bg-secondary rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <EditTestimonialDialog testimonial={testimonial} />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {canManageTestimonials && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setTestimonialToDelete(testimonial.id);
                            setDeleteOpen(true);
                          }}
                          className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 sm:h-10 sm:w-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardThemedHeader>
                <CardThemedContent>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed break-words">{testimonial.content}</p>
                  <p className="text-xs text-slate-400 mt-4">
                    {new Date(testimonial.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </CardThemedContent>
              </CardThemed>
            );
          })}
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
