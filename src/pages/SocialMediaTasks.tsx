import { useMemo, useState } from 'react';
import { Plus, ClipboardList, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useSocialMediaTasks, type SocialMediaTask, type TaskStatus } from '@/hooks/useSocialMediaTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'pending', label: 'Pendente' },
  { id: 'in_production', label: 'Em Produção' },
  { id: 'completed', label: 'Concluído' },
];

export default function SocialMediaTasks() {
  const { hasRole } = useAuth();
  const { data: tasks = [], isLoading } = useSocialMediaTasks();
  const [selected, setSelected] = useState<SocialMediaTask | null>(null);

  const canCreate = hasRole(['admin', 'volunteer']);

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, SocialMediaTask[]> = {
      pending: [], in_production: [], completed: [],
    };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <header className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            Tarefas — Social Media
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {canCreate
              ? 'Crie demandas para a equipe e acompanhe o progresso.'
              : 'Tarefas atribuídas à equipe de social media.'}
          </p>
        </div>

        {canCreate && (
          <TaskFormDialog
            trigger={
              <Button className="shrink-0">
                <Plus className="w-4 h-4 mr-1.5" /> Nova tarefa
              </Button>
            }
          />
        )}
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-10 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-semibold mb-1">Nenhuma tarefa ainda</h2>
          <p className="text-sm text-muted-foreground">
            {canCreate
              ? 'Clique em "Nova tarefa" para começar.'
              : 'Quando admins ou voluntários atribuírem tarefas, elas aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: tabs por coluna */}
          <div className="md:hidden">
            <Tabs defaultValue="pending">
              <TabsList className="grid grid-cols-3 w-full mb-4">
                {COLUMNS.map((c) => (
                  <TabsTrigger key={c.id} value={c.id}>
                    {c.label}
                    <span className="ml-1.5 text-[10px] opacity-70">({grouped[c.id].length})</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {COLUMNS.map((c) => (
                <TabsContent key={c.id} value={c.id} className="space-y-3">
                  {grouped[c.id].length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">Nenhuma tarefa.</p>
                  ) : (
                    grouped[c.id].map((t) => (
                      <TaskCard key={t.id} task={t} onClick={() => setSelected(t)} />
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Desktop: kanban 3 colunas */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            {COLUMNS.map((c) => (
              <div key={c.id} className="bg-muted/30 rounded-xl p-3 min-h-[400px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-semibold text-sm">{c.label}</h3>
                  <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
                    {grouped[c.id].length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {grouped[c.id].length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-6">Vazio</p>
                  ) : (
                    grouped[c.id].map((t) => (
                      <TaskCard key={t.id} task={t} onClick={() => setSelected(t)} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <TaskDetailDialog task={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
