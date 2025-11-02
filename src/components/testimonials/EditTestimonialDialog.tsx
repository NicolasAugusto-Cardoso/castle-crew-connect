import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTestimonials, Testimonial } from '@/hooks/useTestimonials';
import { Edit } from 'lucide-react';

interface EditTestimonialDialogProps {
  testimonial: Testimonial;
}

export function EditTestimonialDialog({ testimonial }: EditTestimonialDialogProps) {
  const { updateTestimonial } = useTestimonials();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(testimonial.title);
  const [content, setContent] = useState(testimonial.content);
  const [authorName, setAuthorName] = useState(testimonial.author_name || '');
  const [anonymous, setAnonymous] = useState(!testimonial.author_name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(testimonial.title);
      setContent(testimonial.content);
      setAuthorName(testimonial.author_name || '');
      setAnonymous(!testimonial.author_name);
    }
  }, [open, testimonial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateTestimonial.mutateAsync({
        id: testimonial.id,
        title,
        content,
        author_name: anonymous ? null : authorName,
        status: 'draft' // Sempre manter como rascunho ao editar
      });
      
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        <Edit className="w-4 h-4 mr-2" />
        Editar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto px-4 sm:px-6">
          <DialogHeader>
            <DialogTitle>Editar Testemunho</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do testemunho"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="edit-anonymous"
                  checked={anonymous}
                  onCheckedChange={(checked) => setAnonymous(checked === true)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-anonymous" className="cursor-pointer">
                  Publicar anonimamente
                </Label>
              </div>
              {!anonymous && (
                <>
                  <Label htmlFor="edit-author">Nome do Autor</Label>
                  <Input
                    id="edit-author"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Nome completo"
                    required
                    disabled={isSubmitting}
                  />
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Testemunho</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva o testemunho..."
                rows={8}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
