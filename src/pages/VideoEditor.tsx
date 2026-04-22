import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaProject } from '@/hooks/useMediaProjects';

export default function VideoEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useMediaProject(projectId);

  return (
    <div className="px-4 sm:px-6 py-6 space-y-4">
      <Button variant="ghost" onClick={() => navigate('/studio')} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Estúdio
      </Button>
      <div className="border border-dashed rounded-xl p-12 text-center space-y-3">
        <Construction className="w-10 h-10 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">
          Editor de vídeo: {isLoading ? 'carregando…' : project?.title || 'Projeto'}
        </h2>
        <p className="text-muted-foreground text-sm">
          O editor 4-quadrantes (chat IA, preview, timeline, propriedades) chega na próxima etapa.
        </p>
        {project?.source_url && (
          <video
            src={project.source_url}
            controls
            className="max-h-80 mx-auto rounded-lg shadow w-full max-w-2xl"
          />
        )}
      </div>
    </div>
  );
}
