import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Download, Trash2 } from 'lucide-react';
import { GalleryMedia } from '@/hooks/useGallery';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

interface MediaLightboxProps {
  media: GalleryMedia[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function MediaLightbox({ media, currentIndex, onClose, onNavigate }: MediaLightboxProps) {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = hasRole(['admin']);
  const currentMedia = media[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < media.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media-${currentMedia.id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao fazer download');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const urlParts = currentMedia.url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('gallery') + 1).join('/');

      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('gallery_media')
        .delete()
        .eq('id', currentMedia.id);

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['gallery-media'] });
      toast.success('Mídia excluída!');
      
      if (media.length === 1) {
        onClose();
      } else if (currentIndex === media.length - 1) {
        onNavigate(currentIndex - 1);
      }
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao excluir mídia');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black/95">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </Button>

            <div className="absolute top-4 left-4 z-50 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleDownload}
              >
                <Download className="w-5 h-5" />
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-destructive/80"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>

            {currentMedia.type.startsWith('image/') ? (
              <img
                src={currentMedia.url}
                alt="Media"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={currentMedia.url}
                controls
                className="max-w-full max-h-full"
              />
            )}

            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {currentIndex < media.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={handleNext}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentIndex + 1} / {media.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mídia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A mídia será permanentemente removida do servidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
