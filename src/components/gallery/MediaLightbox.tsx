import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Download, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
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
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

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
  const [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const canDelete = hasRole(['admin']);
  const currentMedia = media[currentIndex];
  const isImage = currentMedia.type.startsWith('image/');

  // Reset zoom when changing media
  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onClose]);

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

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
    
    setTouchStart(null);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isImage) return;
    e.preventDefault();
    
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
      toast.error('Erro ao excluir mídia');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Fullscreen Overlay */}
      <div 
        className="fixed inset-0 z-50 bg-black/98 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleOverlayClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={handleDownload}
              >
                <Download className="w-5 h-5" />
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-destructive/80 backdrop-blur-sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
              {isImage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 backdrop-blur-sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 backdrop-blur-sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                  >
                    <ZoomOut className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Media Container */}
        <div 
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center p-4 md:p-8"
          onWheel={handleWheel}
        >
          {isImage ? (
            <img
              ref={imageRef}
              src={currentMedia.url}
              alt="Media"
              className={cn(
                "max-w-full max-h-full object-contain transition-transform duration-300 cursor-zoom-in",
                zoom > 1 && "cursor-zoom-out"
              )}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center'
              }}
              draggable={false}
            />
          ) : (
            <video
              src={currentMedia.url}
              controls
              autoPlay
              className="w-full h-full max-w-full max-h-full object-contain"
              style={{ maxWidth: '100vw', maxHeight: '100vh' }}
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 backdrop-blur-sm w-12 h-12 md:w-14 md:h-14"
            onClick={handlePrevious}
          >
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
          </Button>
        )}

        {currentIndex < media.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 backdrop-blur-sm w-12 h-12 md:w-14 md:h-14"
            onClick={handleNext}
          >
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
          </Button>
        )}

        {/* Bottom Counter */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="text-center text-white text-sm md:text-base font-medium backdrop-blur-sm inline-block px-4 py-2 rounded-full bg-black/30 left-1/2 -translate-x-1/2 relative">
            {currentIndex + 1} / {media.length}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[60]">
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
