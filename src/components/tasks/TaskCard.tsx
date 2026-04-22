import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Paperclip, Trash2, Image as ImageIcon, Video, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteTask, useUpdateTaskStatus, type SocialMediaTask, type TaskStatus } from '@/hooks/useSocialMediaTasks';
import { useAuth } from '@/hooks/useAuth';

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_production: 'Em Produção',
  completed: 'Concluído',
};

const STATUS_VARIANTS: Record<TaskStatus, 'secondary' | 'default' | 'outline'> = {
  pending: 'secondary',
  in_production: 'default',
  completed: 'outline',
};

interface Props {
  task: SocialMediaTask;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: Props) {
  const { user, hasRole } = useAuth();
  const deleteTask = useDeleteTask();
  const updateStatus = useUpdateTaskStatus();

  const canDelete = hasRole(['admin']) || task.created_by === user?.id;
  const canChangeStatus = hasRole(['admin', 'social_media']) || task.created_by === user?.id;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  const refs = task.reference_urls || [];

  return (
    <Card
      className="p-4 hover:shadow-md transition-all cursor-pointer group bg-card"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm line-clamp-2 flex-1">{task.title}</h3>
        <Badge variant={STATUS_VARIANTS[task.status]} className="shrink-0 text-[10px]">
          {STATUS_LABELS[task.status]}
        </Badge>
      </div>

      {task.instructions && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {task.instructions}
        </p>
      )}

      <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground">
        {task.due_date && (
          <span className={`inline-flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
            <Calendar className="w-3 h-3" />
            {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
          </span>
        )}
        {refs.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            {refs.length}
          </span>
        )}
      </div>

      {refs.length > 0 && (
        <div className="flex gap-1.5 mt-3 overflow-x-auto">
          {refs.slice(0, 3).map((ref, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border"
            >
              {ref.type === 'video' ? (
                <Video className="w-4 h-4 text-muted-foreground" />
              ) : (
                <img src={ref.url} alt={ref.name} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
          {refs.length > 3 && (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
              +{refs.length - 3}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        {canChangeStatus ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Mudar status <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  disabled={s === task.status}
                  onClick={() => updateStatus.mutate({ id: task.id, status: s })}
                >
                  {STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span />
        )}

        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTask.mutate(task.id)}
                  className="bg-destructive text-destructive-foreground"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Card>
  );
}
