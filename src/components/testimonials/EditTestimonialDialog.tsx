import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTestimonials, Testimonial } from '@/hooks/useTestimonials';
import { Edit, Trash2 } from 'lucide-react';
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

interface EditTestimonialDialogProps {
  testimonial: Testimonial;
}

export function EditTestimonialDialog({ testimonial }: EditTestimonialDialogProps) {
  const { updateTestimonial, deleteTestimonial } = useTestimonials();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(testimonial.title);
  const [content, setContent] = useState(testimonial.content);
  const [authorName, setAuthorName] = useState(testimonial.author_name);
  const [published, setPublished] = useState(testimonial.status === 'published');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(testimonial.title);
      setContent(testimonial.content);
      setAuthorName(testimonial.author_name);
      setPublished(testimonial.status === 'published');
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
        author_name: authorName,
        status: published ? 'published' : 'draft'
      });
      
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteTestimonial.mutateAsync(testimonial.id);
      setDeleteOpen(false);
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
        <DialogContent className="max-w-2xl">
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
              <Label htmlFor="edit-author">Nome do Autor</Label>
              <Input
                id="edit-author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Nome completo"
                required
                disabled={isSubmitting}
              />
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

            <div className="flex items-center gap-2">
              <Switch
                id="edit-published"
                checked={published}
                onCheckedChange={setPublished}
                disabled={isSubmitting}
              />
              <Label htmlFor="edit-published" className="cursor-pointer">
                Publicado
              </Label>
            </div>

            <div className="flex gap-3 justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este testemunho? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
