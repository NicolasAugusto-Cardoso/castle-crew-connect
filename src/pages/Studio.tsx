import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Film, Plus, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMediaProjects, useCreateMediaProject, uploadMediaFile } from '@/hooks/useMediaProjects';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ProjectCard } from '@/components/studio/ProjectCard';
import { UploadDropzone } from '@/components/studio/UploadDropzone';
import { toast } from 'sonner';
import type { MediaProjectType } from '@/types/studio';
import { DEFAULT_ADJUSTMENTS } from '@/types/studio';

export default function Studio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useMediaProjects();
  const createProject = useCreateMediaProject();

  const [filter, setFilter] = useState<'all' | MediaProjectType>('all');
  const [newType, setNewType] = useState<MediaProjectType | null>(null);
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(
    () => (filter === 'all' ? projects : projects.filter(p => p.type === filter)),
    [projects, filter],
  );

  const handleCreate = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const { url } = await uploadMediaFile({ userId: user.id, file, folder: 'sources' });
      const project = await createProject.mutateAsync({
        type: newType!,
        title: file.name.replace(/\.[^.]+$/, '') || (newType === 'video' ? 'Novo vídeo' : 'Nova foto'),
        source_url: url,
        project_data: newType === 'photo'
          ? { adjustments: DEFAULT_ADJUSTMENTS }
          : { clips: [], captions: [] },
      });
      toast.success('Projeto criado!');
      setNewType(null);
      navigate(`/studio/${project.type}/${project.id}`);
    } catch (e: any) {
      toast.error('Falha ao criar projeto', { description: e?.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Estúdio</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Edite fotos e vídeos para suas postagens.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setNewType('video')} className="gap-2">
            <Film className="w-4 h-4" /> Novo vídeo
          </Button>
          <Button onClick={() => setNewType('photo')} variant="secondary" className="gap-2">
            <ImageIcon className="w-4 h-4" /> Nova foto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | MediaProjectType)}>
        <TabsList>
          <TabsTrigger value="all">Todos ({projects.length})</TabsTrigger>
          <TabsTrigger value="video">
            Vídeos ({projects.filter(p => p.type === 'video').length})
          </TabsTrigger>
          <TabsTrigger value="photo">
            Fotos ({projects.filter(p => p.type === 'photo').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando projetos…
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">Nenhum projeto ainda</h3>
          <p className="text-sm text-muted-foreground">
            Comece criando um novo vídeo ou foto.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Button onClick={() => setNewType('video')} className="gap-2">
              <Film className="w-4 h-4" /> Novo vídeo
            </Button>
            <Button onClick={() => setNewType('photo')} variant="secondary" className="gap-2">
              <ImageIcon className="w-4 h-4" /> Nova foto
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {/* Dialog de upload */}
      <Dialog open={!!newType} onOpenChange={(o) => !o && setNewType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newType === 'video' ? 'Novo projeto de vídeo' : 'Novo projeto de foto'}
            </DialogTitle>
            <DialogDescription>
              {newType === 'video'
                ? 'Envie um arquivo de vídeo (mp4, webm, mov). Limite 200 MB.'
                : 'Envie uma imagem (jpg, png, webp). Limite 200 MB.'}
            </DialogDescription>
          </DialogHeader>
          <UploadDropzone
            accept={newType === 'video' ? 'video/*' : 'image/*'}
            disabled={uploading}
            hint={newType === 'video' ? 'MP4, WebM, MOV — até 200 MB' : 'JPG, PNG, WebP — até 200 MB'}
            onFile={handleCreate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
