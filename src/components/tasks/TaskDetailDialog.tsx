import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Paperclip, Video } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { SocialMediaTask, TaskStatus } from '@/hooks/useSocialMediaTasks';

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_production: 'Em Produção',
  completed: 'Concluído',
};

interface Props {
  task: SocialMediaTask | null;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({ task, onOpenChange }: Props) {
  if (!task) return null;
  const refs = task.reference_urls || [];

  return (
    <Dialog open={!!task} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-xl">{task.title}</DialogTitle>
            <Badge variant="secondary" className="shrink-0">{STATUS_LABELS[task.status]}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {task.due_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Prazo: {format(new Date(task.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          )}

          {task.instructions && (
            <div>
              <h4 className="text-sm font-semibold mb-1.5">Instruções</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {task.instructions}
              </p>
            </div>
          )}

          {refs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" /> Referências ({refs.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {refs.map((ref, i) => (
                  <a
                    key={i}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg bg-muted overflow-hidden border border-border hover:border-primary transition-colors flex items-center justify-center"
                  >
                    {ref.type === 'video' ? (
                      <video src={ref.url} className="w-full h-full object-cover" controls={false} muted />
                    ) : (
                      <img src={ref.url} alt={ref.name} className="w-full h-full object-cover" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
