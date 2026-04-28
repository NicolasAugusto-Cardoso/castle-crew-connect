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
import { MediaUpload } from '@/components/ui/media-upload';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';

interface UploadMediaDialogProps {
  folderId: string;
  compact?: boolean;
}

export function UploadMediaDialog({ folderId, compact = false }: UploadMediaDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

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

      const fileArray = Array.from(files);
      setUploadProgress({ current: 0, total: fileArray.length });

      // Função para fazer upload de um arquivo
      const uploadSingleFile = async (file: File, index: number) => {
        try {
          // Validar tipo de arquivo com fallback para extensão
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          const validExtensions = ['jpeg', 'jpg', 'mp4', 'png'];
          const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'video/quicktime'];
          
          const isValidExtension = fileExtension && validExtensions.includes(fileExtension);
          const isValidMimeType = validMimeTypes.includes(file.type);
          
          if (!isValidExtension && !isValidMimeType) {
            return { success: false, error: `${file.name} não é um formato válido` };
          }
          
          // Determinar tipo MIME correto baseado na extensão
          let mimeType: string;
          if (fileExtension === 'mp4') {
            mimeType = 'video/mp4';
          } else if (fileExtension === 'jpeg' || fileExtension === 'jpg') {
            mimeType = 'image/jpeg';
          } else if (fileExtension === 'png') {
            mimeType = 'image/png';
          } else {
            mimeType = file.type || 'application/octet-stream';
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
            if (uploadError.message.includes('new row violates row-level security')) {
              return { success: false, error: 'Sem permissão' };
            } else if (uploadError.message.includes('Payload too large')) {
              return { success: false, error: `${file.name} muito grande (máx 50MB)` };
            } else {
              return { success: false, error: `Erro ao enviar ${file.name}` };
            }
          }

          // Obter URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('gallery')
            .getPublicUrl(fileName);

          // Inserir registro no banco
          const { error: dbError } = await supabase
            .from('gallery_media')
            .insert({
              folder_id: folderId,
              url: publicUrl,
              type: mimeType,
              created_by: user.id
            });

          if (dbError) {
            return { success: false, error: `Erro ao registrar ${file.name}` };
          }

          // Atualizar progresso
          setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
          
          return { success: true };
        } catch (error) {
          return { success: false, error: `Erro ao processar ${file.name}` };
        }
      };

      // Upload paralelo de todos os arquivos
      const results = await Promise.allSettled(
        fileArray.map((file, index) => uploadSingleFile(file, index))
      );

      // Contar sucessos e falhas
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

      // Mostrar erros específicos
      failed.forEach(result => {
        if (result.status === 'fulfilled' && !result.value.success) {
          toast.error(result.value.error);
        }
      });

      if (successful > 0) {
        queryClient.invalidateQueries({ queryKey: ['gallery-media', folderId] });
        toast.success(`${successful} arquivo(s) enviado(s)!`);
        setFiles(null);
        setOpen(false);
      } else {
        toast.error('Nenhum arquivo foi enviado');
      }
    } catch (error: any) {
      toast.error('Erro ao enviar arquivos');
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Upload className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="btn-accent">
            <Upload className="w-4 h-4 mr-2" />
            Enviar Mídia
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Fotos ou Vídeos</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="files">Arquivos (.jpeg, .png, .mp4)</Label>
            <input
              id="files"
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,video/mp4,video/*,image/*"
              capture="environment"
              onChange={(e) => setFiles(e.target.files)}
              className="w-full p-2 border rounded"
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              📱 Mobile: Toque para acessar câmera ou galeria<br />
              💻 Desktop: Selecione arquivos (.jpeg, .png ou .mp4, máx 50MB cada)
            </p>
          </div>

          {files && files.length > 0 && (
            <div className="space-y-2">
              <Label>Arquivos selecionados: {files.length}</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {Array.from(files).map((file, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    {file.type.startsWith('image/') ? '🖼️' : '🎥'}
                    <span>{file.name}</span>
                    <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isUploading && uploadProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando...</span>
                <span>{uploadProgress.current}/{uploadProgress.total}</span>
              </div>
              <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
            </div>
          )}

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
