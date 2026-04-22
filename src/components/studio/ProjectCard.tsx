import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Image as ImageIcon, Film, MoreVertical, Trash2, Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useDeleteMediaProject } from '@/hooks/useMediaProjects';
import type { MediaProject } from '@/types/studio';

export function ProjectCard({ project }: { project: MediaProject }) {
  const navigate = useNavigate();
  const del = useDeleteMediaProject();

  const open = () => {
    navigate(`/studio/${project.type}/${project.id}`);
  };

  const previewUrl = project.thumbnail_url || project.output_url || project.source_url;

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
      <button
        onClick={open}
        className="relative aspect-video w-full bg-muted overflow-hidden block"
      >
        {previewUrl ? (
          project.type === 'video' ? (
            <video src={previewUrl} className="w-full h-full object-cover" muted preload="metadata" />
          ) : (
            <img src={previewUrl} alt={project.title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {project.type === 'video' ? <Film className="w-10 h-10" /> : <ImageIcon className="w-10 h-10" />}
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 backdrop-blur bg-background/80 gap-1"
        >
          {project.type === 'video' ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
          {project.type === 'video' ? 'Vídeo' : 'Foto'}
        </Badge>
        {project.output_url && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">Exportado</Badge>
        )}
      </button>

      <div className="p-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm truncate">{project.title}</h3>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={open} title="Abrir editor">
            <Pencil className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {project.output_url && (
                <DropdownMenuItem asChild>
                  <a href={project.output_url} download target="_blank" rel="noreferrer">
                    <Download className="w-4 h-4 mr-2" /> Baixar export
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  if (!confirm(`Excluir o projeto "${project.title}"?`)) return;
                  await del.mutateAsync(project.id);
                  toast.success('Projeto excluído');
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
