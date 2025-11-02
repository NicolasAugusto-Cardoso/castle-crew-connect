import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTestimonials } from '@/hooks/useTestimonials';
import { Plus, Info } from 'lucide-react';

export function CreateTestimonialDialog() {
  const { createTestimonial } = useTestimonials();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createTestimonial.mutateAsync({
        title,
        content,
        author_name: isAnonymous ? undefined : authorName,
        status: 'draft'
      });
      
      setTitle('');
      setContent('');
      setAuthorName('');
      setIsAnonymous(false);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-14 btn-accent text-base">
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Testemunho
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle>Novo Testemunho</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do testemunho"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Nome do Autor</Label>
            <Input
              id="author"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Nome completo"
              required={!isAnonymous}
              disabled={isSubmitting || isAnonymous}
            />
            
            <div className="flex items-center gap-2 pt-2">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                disabled={isSubmitting}
              />
              <Label htmlFor="anonymous" className="cursor-pointer text-sm text-muted-foreground">
                Publicar anonimamente
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Testemunho</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o testemunho..."
              rows={8}
              required
              disabled={isSubmitting}
            />
          </div>

          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
              Seu testemunho será enviado para revisão antes de ser publicado.
            </AlertDescription>
          </Alert>

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
              {isSubmitting ? 'Enviando...' : 'Enviar Testemunho'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
