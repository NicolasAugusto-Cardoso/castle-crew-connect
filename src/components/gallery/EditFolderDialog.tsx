import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useGallery, GalleryFolder } from '@/hooks/useGallery';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditFolderDialogProps {
  folder: GalleryFolder;
}

export function EditFolderDialog({ folder }: EditFolderDialogProps) {
  const { updateFolder } = useGallery();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description || '');
  const [eventDate, setEventDate] = useState(
    folder.event_date ? new Date(folder.event_date).toISOString().split('T')[0] : ''
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(folder.cover_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas para a capa');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let coverUrl = folder.cover_url;

      if (coverFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${folder.id}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, coverFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      }

      await updateFolder.mutateAsync({
        id: folder.id,
        name,
        description: description || undefined,
        event_date: eventDate || undefined,
        cover_url: coverUrl || undefined
      });

      setOpen(false);
      toast.success('Pasta atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Erro ao atualizar pasta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Pasta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Pasta *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDate">Data do Evento</Label>
            <Input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Foto de Capa</Label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <Input
                  id="cover"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleCoverChange}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Imagens JPG, JPEG ou PNG até 5MB
                </p>
              </div>
            </div>
            {coverPreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                <img
                  src={coverPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview('');
                  }}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
