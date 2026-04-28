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
import { useGallery, GalleryFolder } from '@/hooks/useGallery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Edit, Trash2 } from 'lucide-react';
import { MediaUpload } from '@/components/ui/media-upload';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface EditFolderDialogProps {
  folder: GalleryFolder;
}

export function EditFolderDialog({ folder }: EditFolderDialogProps) {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { updateFolder, deleteFolder } = useGallery();
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description || '');
  const [eventDate, setEventDate] = useState(
    folder.event_date ? new Date(folder.event_date).toISOString().split('T')[0] : ''
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(folder.cover_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const canDelete = hasRole(['admin']);

  const handleCoverChange = (files: File[] | null) => {
    const file = files?.[0];
    if (!file) {
      setCoverFile(null);
      setCoverPreview(folder.cover_url || '');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
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
      toast.error('Erro ao atualizar pasta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Deletar todos os arquivos de mídia da pasta
      const { data: mediaFiles } = await supabase
        .from('gallery_media')
        .select('url')
        .eq('folder_id', folder.id);

      if (mediaFiles && mediaFiles.length > 0) {
        // Extrair paths dos arquivos e deletar do storage
        const filePaths = mediaFiles.map(media => {
          const urlParts = media.url.split('/');
          return urlParts.slice(urlParts.indexOf('gallery') + 1).join('/');
        });

        const { error: storageError } = await supabase.storage
          .from('gallery')
          .remove(filePaths);

        if (storageError) {
          // Silenciar erro de storage - pasta será deletada mesmo assim
        }
      }

      // Deletar capa se existir
      if (folder.cover_url) {
        const urlParts = folder.cover_url.split('/');
        const coverPath = urlParts.slice(urlParts.indexOf('gallery') + 1).join('/');
        
        await supabase.storage
          .from('gallery')
          .remove([coverPath]);
      }

      // Deletar a pasta (cascata deletará as mídias automaticamente)
      await deleteFolder.mutateAsync(folder.id);
      
      toast.success('Pasta excluída com sucesso!');
      setShowDeleteDialog(false);
      setOpen(false);
      navigate('/gallery');
    } catch (error) {
      toast.error('Erro ao excluir pasta');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto px-4 sm:px-6">
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
            <Label>Foto de Capa</Label>
            <MediaUpload
              accept="image/jpeg,image/jpg,image/png"
              value={coverFile}
              onChange={handleCoverChange}
              maxSizeMB={5}
              disabled={isSubmitting}
              previewUrl={!coverFile ? coverPreview : undefined}
              label="Selecionar foto de capa"
              hint="JPG, JPEG ou PNG • até 5 MB"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            {canDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Pasta
              </Button>
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:ml-auto w-full sm:w-auto">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir pasta "{folder.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Todos os arquivos desta pasta também serão permanentemente removidos do servidor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir Pasta'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
