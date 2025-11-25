import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePosts, Post } from '@/hooks/usePosts';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
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

interface EditPostDialogProps {
  post: Post;
}

interface ImageFile {
  id?: string;
  file?: File;
  url: string;
  preview: string;
  order: number;
}

export function EditPostDialog({ post }: EditPostDialogProps) {
  const { updatePost, deletePost } = usePosts();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [content, setContent] = useState(post.content);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setContent(post.content);
      
      // Carregar imagens existentes
      if (post.images && post.images.length > 0) {
        setImages(post.images.map((img, index) => ({
          id: img.id,
          url: img.image_url,
          preview: img.image_url,
          order: index
        })));
      } else if (post.image_url) {
        // Fallback para imagem antiga
        setImages([{
          url: post.image_url,
          preview: post.image_url,
          order: 0
        }]);
      } else {
        setImages([]);
      }
    }
  }, [open, post]);

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limite de 10 imagens
    if (images.length + files.length > 10) {
      toast.error('Máximo de 10 imagens por postagem');
      return;
    }

    const newImages: ImageFile[] = [];

    files.forEach((file, index) => {
      // Validar tipo
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['jpeg', 'jpg', 'png'];
      const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      
      const isValidExtension = fileExtension && validExtensions.includes(fileExtension);
      const isValidMimeType = validMimeTypes.includes(file.type);
      
      if (!isValidExtension && !isValidMimeType) {
        toast.error(`${file.name}: Formato inválido`);
        return;
      }

      // Validar tamanho
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Imagem muito grande`);
        return;
      }

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push({
          file,
          url: '',
          preview: reader.result as string,
          order: images.length + index
        });

        if (newImages.length === files.length) {
          setImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i })));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return newImages.map((img, i) => ({ ...img, order: i }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages(prev => {
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return newImages.map((img, i) => ({ ...img, order: i }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Por favor, escreva uma legenda.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const finalImages: { id?: string; image_url: string; display_order: number }[] = [];

      // Processar imagens
      for (const image of images) {
        if (image.file) {
          // Upload nova imagem
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Não autenticado');

          const fileExt = image.file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(fileName, image.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

          finalImages.push({
            image_url: publicUrl,
            display_order: image.order
          });
        } else {
          // Manter imagem existente
          finalImages.push({
            id: image.id,
            image_url: image.url,
            display_order: image.order
          });
        }
      }

      await updatePost.mutateAsync({
        id: post.id,
        title: null,
        content: content.trim(),
        image_url: finalImages.length > 0 ? finalImages[0].image_url : null,
        images: finalImages
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar postagem:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deletePost.mutateAsync(post.id);
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
      >
        <Edit className="w-4 h-4 mr-2" />
        Editar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto px-4 sm:px-6">
          <DialogHeader>
            <DialogTitle>Editar Postagem</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Imagens (opcional - máx 10)</Label>
              
              {/* Grid de previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={image.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRemoveImage(index)}
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="absolute bottom-2 right-2 flex gap-1 bg-background/80 rounded p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || isSubmitting}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === images.length - 1 || isSubmitting}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload de arquivos */}
              {images.length < 10 && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <Label htmlFor="edit-image-files" className="cursor-pointer">
                    <span className="text-sm text-primary hover:underline">
                      Adicionar mais imagens ({images.length}/10)
                    </span>
                    <input
                      id="edit-image-files"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/*"
                      multiple
                      onChange={handleImageFilesChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </Label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Legenda</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva uma legenda..."
                rows={6}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
              <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="w-full xs:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full xs:w-auto">
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
              Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.
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