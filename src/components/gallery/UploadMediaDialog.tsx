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

      for (const file of Array.from(files)) {
        // Validar tipo de arquivo
        const validTypes = ['image/jpeg', 'image/jpg', 'video/mp4'];
        if (!validTypes.includes(file.type)) {
          toast.error(`Arquivo ${file.name} não é .jpeg ou .mp4`);
          continue;
        }

        // Upload para storage (simulado - você precisaria criar bucket primeiro)
        const fileName = `${Date.now()}_${file.name}`;
        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        
        // Inserir registro no banco com URL simulada
        const { error } = await supabase
          .from('gallery_media')
          .insert({
            folder_id: folderId,
            url: `https://placeholder.com/${fileName}`, // Substituir por storage real
            type: mediaType,
            created_by: user.id
          });

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['gallery-media', folderId] });
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
      setFiles(null);
      setOpen(false);
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
