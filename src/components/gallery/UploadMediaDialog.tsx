import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UploadMediaDialogProps {
  folderId: string;
}

export function UploadMediaDialog({ folderId }: UploadMediaDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      toast.error('Selecione ao menos um arquivo');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      let uploadedCount = 0;

      for (const file of Array.from(files)) {
        // Validar tipo de arquivo
        const validTypes = ['image/jpeg', 'image/jpg', 'video/mp4'];
        if (!validTypes.includes(file.type)) {
          toast.error(`Arquivo ${file.name} não é .jpeg ou .mp4`);
          continue;
        }

        // Upload para storage bucket 'gallery'
        const fileExt = file.name.split('.').pop();
        const fileName = `${folderId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(fileName);

        // Inserir registro no banco
        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        const { error: dbError } = await supabase
          .from('gallery_media')
          .insert({
            folder_id: folderId,
            url: publicUrl,
            type: mediaType,
            created_by: user.id
          });

        if (dbError) {
          console.error('Database error:', dbError);
          toast.error(`Erro ao registrar ${file.name}`);
          continue;
        }

        uploadedCount++;
      }

      if (uploadedCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['gallery-media', folderId] });
        toast.success(`${uploadedCount} arquivo(s) enviado(s) com sucesso!`);
        setFiles(null);
        setOpen(false);
      } else {
        toast.error('Nenhum arquivo foi enviado com sucesso');
      }
    } catch (error: any) {
      toast.error('Erro ao enviar arquivos');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-accent">
          <Upload className="w-4 h-4 mr-2" />
          Enviar Mídia
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Fotos ou Vídeos</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="files">Arquivos (.jpeg, .mp4)</Label>
            <input
              id="files"
              type="file"
              multiple
              accept="image/jpeg,image/jpg,video/mp4"
              onChange={(e) => setFiles(e.target.files)}
              className="w-full p-2 border rounded"
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              Selecione uma ou mais fotos (.jpeg) ou vídeos (.mp4)
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
