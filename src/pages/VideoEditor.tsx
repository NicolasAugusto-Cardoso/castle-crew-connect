import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Save,
  Loader2,
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMediaProject, useUpdateMediaProject, uploadMediaFile } from '@/hooks/useMediaProjects';
import { useVideoExport } from '@/hooks/useVideoExport';
import { useSilenceDetection } from '@/hooks/useSilenceDetection';
import { useAudioWaveform } from '@/hooks/useAudioWaveform';
import { useStickyState } from '@/hooks/useStickyState';
import { VideoPreview } from '@/components/studio/video/VideoPreview';
import { WaveformTimeline } from '@/components/studio/video/WaveformTimeline';
import { AIChatSidebar, type ChatMessage } from '@/components/studio/video/AIChatSidebar';
import { PropertiesPanel, DEFAULT_VISUAL, type VideoVisualSettings } from '@/components/studio/video/PropertiesPanel';
import type {
  VideoCaption,
  VideoClip,
  VideoProjectData,
} from '@/types/studio';

function isVideoData(d: unknown): d is VideoProjectData {
  return !!d && typeof d === 'object' && 'clips' in (d as Record<string, unknown>);
}

interface AssistantAction {
  type: string;
  threshold_db?: number;
  min_duration_s?: number;
  factor?: number;
  start?: number;
  end?: number;
  text?: string;
}

export default function VideoEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: project, isLoading } = useMediaProject(projectId);
  const updateProject = useUpdateMediaProject();
  const { exportVideo, isExporting, progress } = useVideoExport();
  const { analyze: analyzeSilence, analyzing: analyzingSilence } = useSilenceDetection();
  const { peaks } = useAudioWaveform(project?.source_url ?? undefined);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Estado do projeto
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [captions, setCaptions] = useState<VideoCaption[]>([]);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [zoom, setZoom] = useState(60);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // Estado sticky (persiste em localStorage)
  const stickyKey = projectId ? `studio:video:${projectId}` : null;
  const [sticky, setSticky] = useStickyState(stickyKey, {
    visual: DEFAULT_VISUAL,
    chat: [] as ChatMessage[],
  });
  const visual = sticky.visual;
  const chatMessages = sticky.chat;

  const setVisual = useCallback(
    (patch: Partial<VideoVisualSettings>) => {
      setSticky((prev) => ({ ...prev, visual: { ...prev.visual, ...patch } }));
    },
    [setSticky],
  );
  const resetVisual = useCallback(() => {
    setSticky((prev) => ({ ...prev, visual: DEFAULT_VISUAL }));
  }, [setSticky]);
  const pushChat = useCallback(
    (msg: ChatMessage) => {
      setSticky((prev) => ({ ...prev, chat: [...prev.chat, msg] }));
    },
    [setSticky],
  );

  const [chatLoading, setChatLoading] = useState(false);

  // Carrega estado inicial do projeto
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

  const skip = (delta: number) => seek(currentTime + delta);

  // Sincroniza volume/mute com o elemento video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
    }
  }, [volume, muted]);

  const splitAtPlayhead = useCallback(() => {
    const t = currentTime;
    const idx = clips.findIndex((c) => t > c.start + 0.05 && t < c.end - 0.05);
    if (idx === -1) {
      toast.info('Posicione o playhead dentro de um clipe.');
      return;
    }
    const c = clips[idx];
    const next = [...clips];
    next.splice(idx, 1, { ...c, end: t }, { id: crypto.randomUUID(), start: t, end: c.end });
    setClips(next);
    toast.success('Clipe dividido');
  }, [clips, currentTime]);

  const addCaptionAtPlayhead = useCallback(() => {
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
  }, [currentTime, duration]);

  const updateCaption = (id: string, patch: Partial<VideoCaption>) => {
    setCaptions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)).sort((a, b) => a.start - b.start),
    );
  };
  const deleteCaption = (id: string) => {
    setCaptions((prev) => prev.filter((c) => c.id !== id));
    if (selectedCaptionId === id) setSelectedCaptionId(null);
  };
  const updateClip = (id: string, patch: Partial<VideoClip>) =>
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const deleteClip = (id: string) =>
    setClips((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));

  // Auto-save (debounced) — não inclui visual/chat (esses ficam só no sticky)
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

  // ============ Ações ============

  const handleRemoveSilence = useCallback(async () => {
    if (!project?.source_url) return;
    toast.info('Analisando áudio…');
    try {
      const newClips = await analyzeSilence(project.source_url, { thresholdDb: -40, minSilenceS: 0.8 });
      setClips(newClips);
      toast.success(`Silêncios removidos: ${newClips.length} clipes ativos.`);
      return `Removi os silêncios automaticamente. Ficaram **${newClips.length} clipes** ativos.`;
    } catch (e) {
      console.error(e);
      toast.error('Falha ao analisar áudio');
      return 'Não consegui analisar o áudio agora. Tente novamente.';
    }
  }, [project?.source_url, analyzeSilence]);

  const handleGenerateCaptions = useCallback(async () => {
    if (!project?.source_url) return 'Sem vídeo de origem.';
    toast.info('Gerando legendas com IA…');
    try {
      // Baixa o arquivo e converte em base64
      const resp = await fetch(project.source_url);
      const blob = await resp.blob();
      const base64 = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke('studio-transcribe', {
        body: {
          audioBase64: base64,
          mimeType: blob.type || 'audio/webm',
          durationSeconds: duration,
          language: 'pt-BR',
        },
      });
      if (error) throw error;
      const items = (data?.captions || []) as Array<{ start: number; end: number; text: string }>;
      if (!items.length) {
        toast.warning('Nenhuma fala detectada.');
        return 'Não detectei falas claras no vídeo.';
      }
      const newCaps: VideoCaption[] = items.map((c) => ({
        id: crypto.randomUUID(),
        start: c.start,
        end: c.end,
        text: c.text,
        style: { fontSize: 22, color: '#ffffff', background: 'rgba(0,0,0,0.55)', y: 0.12 },
      }));
      setCaptions(newCaps);
      toast.success(`${newCaps.length} legendas geradas`);
      return `Gerei **${newCaps.length} legendas** sincronizadas para o seu vídeo.`;
    } catch (e) {
      console.error(e);
      toast.error('Falha ao gerar legendas');
      return 'Tive problemas para gerar legendas. Verifique sua conexão e tente novamente.';
    }
  }, [project?.source_url, duration]);

  const applyAssistantActions = useCallback(
    async (actions: AssistantAction[]): Promise<string[]> => {
      const notes: string[] = [];
      for (const a of actions) {
        switch (a.type) {
          case 'remove_silence': {
            const note = await handleRemoveSilence();
            if (note) notes.push(note);
            break;
          }
          case 'generate_captions': {
            const note = await handleGenerateCaptions();
            if (note) notes.push(note);
            break;
          }
          case 'set_speed': {
            const f = a.factor ?? 1;
            if (videoRef.current) videoRef.current.playbackRate = f;
            notes.push(`Velocidade alterada para **${f.toFixed(2)}x**.`);
            break;
          }
          case 'trim': {
            if (a.start != null && a.end != null) {
              setClips([{ id: crypto.randomUUID(), start: a.start, end: a.end }]);
              notes.push(`Recortei do **${a.start.toFixed(1)}s** ao **${a.end.toFixed(1)}s**.`);
            }
            break;
          }
          case 'add_caption': {
            if (a.text) {
              const start = a.start ?? currentTime;
              const end = a.end ?? Math.min(duration, start + 2);
              const cap: VideoCaption = {
                id: crypto.randomUUID(),
                start,
                end,
                text: a.text,
                style: { fontSize: 22, color: '#ffffff', background: 'rgba(0,0,0,0.55)', y: 0.12 },
              };
              setCaptions((prev) => [...prev, cap].sort((x, y) => x.start - y.start));
            }
            break;
          }
          case 'darker':
            setVisual({ brightness: Math.max(0, visual.brightness - 20) });
            break;
          case 'brighter':
            setVisual({ brightness: Math.min(200, visual.brightness + 20) });
            break;
          case 'cooler':
            setVisual({ hue: Math.max(-180, visual.hue - 20) });
            break;
          case 'warmer':
            setVisual({ hue: Math.min(180, visual.hue + 20) });
            break;
        }
      }
      return notes;
    },
    [handleRemoveSilence, handleGenerateCaptions, currentTime, duration, setVisual, visual],
  );

  const sendChatMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      pushChat(userMsg);
      setChatLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('studio-ai-assistant', {
          body: {
            messages: [...chatMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
            projectSnapshot: {
              duration,
              clipsCount: clips.length,
              captionsCount: captions.length,
              currentTime,
            },
          },
        });
        if (error) throw error;
        const reply: string = data?.reply || 'Pronto.';
        const actions: AssistantAction[] = data?.actions || [];
        const notes = await applyAssistantActions(actions);
        const finalReply = [reply, ...notes].filter(Boolean).join('\n\n');
        pushChat({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: finalReply,
          timestamp: Date.now(),
        });
      } catch (e) {
        console.error(e);
        const errMsg = e instanceof Error ? e.message : 'Erro desconhecido';
        toast.error('Falha ao falar com a IA');
        pushChat({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Não consegui processar agora. (${errMsg})`,
          timestamp: Date.now(),
        });
      } finally {
        setChatLoading(false);
      }
    },
    [chatMessages, duration, clips.length, captions.length, currentTime, applyAssistantActions, pushChat],
  );

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

  const filterCss = useMemo(
    () =>
      `brightness(${visual.brightness}%) contrast(${visual.contrast}%) saturate(${visual.saturate}%) hue-rotate(${visual.hue}deg)`,
    [visual],
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
    <div className="dark flex flex-col h-[100dvh] bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/studio')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 max-w-[280px] bg-transparent"
          />
          {(analyzingSilence || updateProject.isPending) && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveNow} className="gap-2">
            <Save className="w-4 h-4" /> Salvar
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar Vídeo
          </Button>
        </div>
      </div>

      {isExporting && (
        <div className="px-4 py-2 border-b border-border bg-muted/40 space-y-1">
          <div className="text-xs text-muted-foreground">Renderizando vídeo… {Math.round(progress)}%</div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Conteúdo principal: 4 quadrantes (chat | preview | props), timeline embaixo */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] min-h-0">
        {/* Sidebar IA */}
        <div className="hidden lg:flex min-h-0">
          <AIChatSidebar
            messages={chatMessages}
            onSend={sendChatMessage}
            onQuickAction={sendChatMessage}
            isLoading={chatLoading}
          />
        </div>

        {/* Preview central */}
        <div className="flex flex-col min-h-0 bg-[hsl(var(--studio-bg))]">
          <div className="flex-1 min-h-0">
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
              filterCss={filterCss}
              scale={visual.scale}
              opacity={visual.opacity}
            />
          </div>
          {/* Transport controls */}
          <div className="flex items-center gap-3 px-3 py-2 border-t border-border bg-card">
            <Button variant="ghost" size="icon" onClick={() => skip(-5)} title="Voltar 5s">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="default" size="icon" onClick={togglePlay} className="rounded-full">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(5)} title="Avançar 5s">
              <SkipForward className="w-4 h-4" />
            </Button>
            <div className="text-xs tabular-nums text-muted-foreground min-w-[110px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" onClick={addCaptionAtPlayhead} title="Adicionar legenda">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider
              className="w-24"
              min={0}
              max={1}
              step={0.05}
              value={[muted ? 0 : volume]}
              onValueChange={([v]) => {
                setVolume(v);
                if (v > 0) setMuted(false);
              }}
            />
          </div>
        </div>

        {/* Sidebar propriedades */}
        <div className="hidden lg:flex min-h-0">
          <PropertiesPanel
            caption={selectedCaption}
            onCaptionChange={(patch) => selectedCaption && updateCaption(selectedCaption.id, patch)}
            onCaptionDelete={() => selectedCaption && deleteCaption(selectedCaption.id)}
            visual={visual}
            onVisualChange={setVisual}
            onResetVisual={resetVisual}
          />
        </div>
      </div>

      {/* Timeline com waveform */}
      <WaveformTimeline
        duration={duration}
        currentTime={currentTime}
        clips={clips}
        captions={captions}
        peaks={peaks}
        selectedCaptionId={selectedCaptionId}
        zoom={zoom}
        onZoomChange={setZoom}
        onSeek={seek}
        onSelectCaption={setSelectedCaptionId}
        onUpdateClip={updateClip}
        onDeleteClip={deleteClip}
        onSplit={splitAtPlayhead}
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result as string;
      const i = dataUrl.indexOf(',');
      resolve(i >= 0 ? dataUrl.slice(i + 1) : dataUrl);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
