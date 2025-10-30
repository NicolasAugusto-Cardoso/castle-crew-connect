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
import { usePosts } from '@/hooks/usePosts';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export function CreatePostDialog() {
  const { createPost } = usePosts();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpeg', 'jpg', 'png'];
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    const isValidExtension = fileExtension && validExtensions.includes(fileExtension);
    const isValidMimeType = validMimeTypes.includes(file.type);
    
    if (!isValidExtension && !isValidMimeType) {
      toast.error('Formato inválido. Use .jpeg ou .png');
      return;
    }

    // Validar tamanho (máx 5MB para posts)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 5MB');
      return;
    }

    setImageFile(file);
    setImageUrl(''); // Limpar URL se havia uma

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = imageUrl;

      // Se tem arquivo, fazer upload
      if (imageFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          toast.error('Erro ao enviar imagem');
          throw uploadError;
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      }

      await createPost.mutateAsync({
        title,
        content,
        image_url: finalImageUrl || undefined
      });
      
      setTitle('');
      setContent('');
      setImageUrl('');
      setImageFile(null);
      setImagePreview('');
      setOpen(false);
    } catch (error) {
      console.error('Erro ao criar postagem:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-14 btn-gradient text-base">
          <Plus className="w-5 h-5 mr-2" />
          Criar Nova Postagem
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Postagem</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da postagem"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o conteúdo da postagem..."
              rows={6}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem (opcional)</Label>
            
            {/* Preview da imagem */}
            {(imagePreview || imageUrl) && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={imagePreview || imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Upload de arquivo */}
            {!imagePreview && !imageUrl && (
              <div className="space-y-3">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <Label htmlFor="image-file" className="cursor-pointer">
                    <span className="text-sm text-primary hover:underline">
                      Clique para enviar uma imagem
                    </span>
                    <input
                      id="image-file"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/*"
                      capture="environment"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    📱 Mobile: Toque para usar câmera ou galeria<br />
                    💻 Desktop: .jpeg ou .png (máx 5MB)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-muted"></div>
                  <span className="text-xs text-muted-foreground">ou</span>
                  <div className="flex-1 border-t border-muted"></div>
                </div>

                <div>
                  <Label htmlFor="image-url" className="text-sm">URL da Imagem</Label>
                  <Input
                    id="image-url"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>
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
              {isSubmitting ? 'Criando...' : 'Criar Postagem'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
