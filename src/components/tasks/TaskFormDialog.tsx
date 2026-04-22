import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, Upload, X, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateTask, useSocialMediaUsers, uploadTaskReference,
} from '@/hooks/useSocialMediaTasks';
import { toast } from 'sonner';

interface Props {
  trigger: React.ReactNode;
}

export function TaskFormDialog({ trigger }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const create = useCreateTask();
  const { data: socialUsers = [] } = useSocialMediaUsers();

  const reset = () => {
    setTitle('');
    setInstructions('');
    setDueDate(undefined);
    setAssignedTo('');
    setFiles([]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Informe um título');
      return;
    }
    if (!user?.id) return;

    setUploading(true);
    try {
      const refs = [] as { url: string; name: string; type: string }[];
      for (const f of files) {
        const r = await uploadTaskReference(f, user.id);
        refs.push(r);
      }

      await create.mutateAsync({
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        reference_urls: refs,
        due_date: dueDate ? dueDate.toISOString() : null,
        assigned_to: assignedTo || null,
      });

      reset();
      setOpen(false);
    } catch (err) {
      toast.error('Erro ao enviar arquivos', {
        description: err instanceof Error ? err.message : 'Tente novamente',
      });
    } finally {
      setUploading(false);
    }
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    const valid = list.filter((f) => f.type.startsWith('image') || f.type.startsWith('video'));
    setFiles((prev) => [...prev, ...valid].slice(0, 8));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription>Atribua uma demanda à equipe de Social Media.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Título *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Post para Stories — Domingo"
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-instructions">Instruções</Label>
            <Textarea
              id="task-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Detalhe roteiro, copy, hashtags, formato, dimensões…"
              rows={5}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd MMM yyyy", { locale: ptBR }) : 'Sem prazo'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label>Atribuir a</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Toda a equipe" />
                </SelectTrigger>
                <SelectContent>
                  {socialUsers.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhum membro com role social_media
                    </div>
                  ) : (
                    socialUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Referências (imagens / vídeos)</Label>
            <label
              htmlFor="task-files"
              className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Clique para adicionar (até 8)</span>
              <input
                id="task-files"
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={onPickFiles}
              />
            </label>

            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded border border-border bg-muted overflow-hidden group">
                    {f.type.startsWith('video') ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ) : (
                      <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 bg-background/90 rounded-full p-0.5 opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading || create.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={uploading || create.isPending}>
            {(uploading || create.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
