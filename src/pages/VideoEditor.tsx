import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Scissors,
  Captions as CaptionsIcon,
  Download,
  Save,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useMediaProject, useUpdateMediaProject, uploadMediaFile } from '@/hooks/useMediaProjects';
import { useVideoExport } from '@/hooks/useVideoExport';
import { VideoPreview } from '@/components/studio/video/VideoPreview';
import { Timeline } from '@/components/studio/video/Timeline';
import { CaptionPropertiesPanel } from '@/components/studio/video/CaptionPropertiesPanel';
import type {
  VideoCaption,
  VideoClip,
  VideoProjectData,
} from '@/types/studio';

function isVideoData(d: unknown): d is VideoProjectData {
  return !!d && typeof d === 'object' && 'clips' in (d as Record<string, unknown>);
}

export default function VideoEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: project, isLoading } = useMediaProject(projectId);
  const updateProject = useUpdateMediaProject();
  const { exportVideo, isExporting, progress } = useVideoExport();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [captions, setCaptions] = useState<VideoCaption[]>([]);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  // Carrega estado do projeto
  useEffect(() => {
    if (!project) return;
    setTitle(project.title);
    if (isVideoData(project.project_data)) {
      setClips(project.project_data.clips || []);
      setCaptions(project.project_data.captions || []);
      if (project.project_data.duration) setDuration(project.project_data.duration);
    }
  }, [project]);

  const onLoadedMetadata = useCallback(
    (d: number) => {
      setDuration(d);
      // Se ainda não há clips, criar um único cobrindo o vídeo todo
      if (clips.length === 0) {
        setClips([{ id: crypto.randomUUID(), start: 0, end: d }]);
      }
    },
    [clips.length],
  );

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const seek = (t: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(duration, t));
    setCurrentTime(t);
  };

  const splitAtPlayhead = () => {
    const t = currentTime;
    const idx = clips.findIndex((c) => t > c.start + 0.05 && t < c.end - 0.05);
    if (idx === -1) {
      toast.info('Posicione o playhead dentro de um clipe para dividir.');
      return;
    }
    const c = clips[idx];
    const next = [...clips];
    next.splice(idx, 1, { ...c, end: t }, { id: crypto.randomUUID(), start: t, end: c.end });
    setClips(next);
  };

  const addCaptionAtPlayhead = () => {
    const start = currentTime;
    const end = Math.min(duration, currentTime + 2);
    const newCap: VideoCaption = {
      id: crypto.randomUUID(),
      start,
      end,
      text: 'Nova legenda',
      style: { fontSize: 22, color: '#ffffff', background: 'rgba(0,0,0,0.55)', y: 0.12 },
    };
    setCaptions((prev) => [...prev, newCap].sort((a, b) => a.start - b.start));
    setSelectedCaptionId(newCap.id);
  };

  const updateCaption = (id: string, patch: Partial<VideoCaption>) => {
    setCaptions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)).sort((a, b) => a.start - b.start),
    );
  };

  const deleteCaption = (id: string) => {
    setCaptions((prev) => prev.filter((c) => c.id !== id));
    if (selectedCaptionId === id) setSelectedCaptionId(null);
  };

  const updateClip = (id: string, patch: Partial<VideoClip>) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const deleteClip = (id: string) => {
    setClips((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  };

  // Auto-save (debounced)
  useEffect(() => {
    if (!project) return;
    const handle = setTimeout(() => {
      updateProject.mutate({
        id: project.id,
        title,
        project_data: { clips, captions, duration },
      });
    }, 1500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips, captions, title, duration]);

  const handleSaveNow = async () => {
    if (!project) return;
    await updateProject.mutateAsync({
      id: project.id,
      title,
      project_data: { clips, captions, duration },
    });
    toast.success('Projeto salvo');
  };

  const handleExport = async () => {
    if (!videoRef.current || !project || !user) return;
    try {
      const blob = await exportVideo({
        source: videoRef.current,
        clips,
        captions,
      });
      const file = new File([blob], `${title || 'video'}.webm`, { type: blob.type });
      const { url } = await uploadMediaFile({ userId: user.id, file, folder: 'exports' });
      await updateProject.mutateAsync({
        id: project.id,
        output_url: url,
        project_data: { clips, captions, duration },
      });
      toast.success('Vídeo exportado e salvo no projeto');
    } catch (e) {
      console.error(e);
      toast.error('Falha ao exportar vídeo');
    }
  };

  const selectedCaption = useMemo(
    () => captions.find((c) => c.id === selectedCaptionId) || null,
    [captions, selectedCaptionId],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project || !project.source_url) {
    return (
      <div className="px-4 sm:px-6 py-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate('/studio')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Estúdio
        </Button>
        <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground">
          Projeto sem vídeo de origem.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-h,4rem))] bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/studio')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 max-w-[280px] bg-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveNow} className="gap-2">
            <Save className="w-4 h-4" /> Salvar
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar
          </Button>
        </div>
      </div>

      {isExporting && (
        <div className="px-4 py-2 border-b border-border bg-muted/40 space-y-1">
          <div className="text-xs text-muted-foreground">Renderizando vídeo… {Math.round(progress)}%</div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-0">
        {/* Preview + transporte */}
        <div className="flex flex-col min-h-0 border-r border-border">
          <div className="flex-1 min-h-0 bg-black">
            <VideoPreview
              ref={videoRef}
              src={project.source_url}
              clips={clips}
              captions={captions}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTimeUpdate={setCurrentTime}
              onLoadedMetadata={onLoadedMetadata}
              onPlayPauseChange={setIsPlaying}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/30">
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="text-xs tabular-nums text-muted-foreground min-w-[110px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={splitAtPlayhead} className="gap-2">
              <Scissors className="w-4 h-4" /> Dividir
            </Button>
            <Button variant="outline" size="sm" onClick={addCaptionAtPlayhead} className="gap-2">
              <Plus className="w-4 h-4" /> Legenda
            </Button>
          </div>
        </div>

        {/* Painel direito */}
        <div className="hidden lg:flex flex-col min-h-0">
          <Tabs defaultValue="caption" className="flex flex-col h-full">
            <TabsList className="m-2">
              <TabsTrigger value="caption" className="gap-1">
                <CaptionsIcon className="w-4 h-4" /> Legenda
              </TabsTrigger>
              <TabsTrigger value="clips" className="gap-1">
                <Scissors className="w-4 h-4" /> Clipes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="caption" className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <CaptionPropertiesPanel
                  caption={selectedCaption}
                  onChange={(patch) => selectedCaption && updateCaption(selectedCaption.id, patch)}
                  onDelete={() => selectedCaption && deleteCaption(selectedCaption.id)}
                />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="clips" className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2 text-sm">
                  {clips.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 p-2 rounded border border-border"
                    >
                      <span className="text-muted-foreground">#{i + 1}</span>
                      <span className="tabular-nums">
                        {formatTime(c.start)} → {formatTime(c.end)}
                      </span>
                      <span className="text-muted-foreground ml-auto">
                        {(c.end - c.start).toFixed(1)}s
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteClip(c.id)}
                        disabled={clips.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {clips.length === 0 && (
                    <p className="text-muted-foreground">Nenhum clipe ainda.</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Timeline */}
      <Timeline
        duration={duration}
        currentTime={currentTime}
        clips={clips}
        captions={captions}
        selectedCaptionId={selectedCaptionId}
        onSeek={seek}
        onSelectCaption={setSelectedCaptionId}
        onUpdateClip={updateClip}
        onDeleteClip={deleteClip}
      />
    </div>
  );
}

function formatTime(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
