import { useMemo, useRef } from 'react';
import type { VideoCaption, VideoClip } from '@/types/studio';
import { cn } from '@/lib/utils';
import { Scissors, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  duration: number;
  currentTime: number;
  clips: VideoClip[];
  captions: VideoCaption[];
  peaks: number[];
  selectedCaptionId: string | null;
  zoom: number; // px por segundo
  onZoomChange: (z: number) => void;
  onSeek: (t: number) => void;
  onSelectCaption: (id: string | null) => void;
  onUpdateClip: (id: string, patch: Partial<VideoClip>) => void;
  onDeleteClip: (id: string) => void;
  onSplit: () => void;
}

export function WaveformTimeline({
  duration,
  currentTime,
  clips,
  captions,
  peaks,
  selectedCaptionId,
  zoom,
  onZoomChange,
  onSeek,
  onSelectCaption,
  onUpdateClip,
  onDeleteClip,
  onSplit,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const totalWidth = Math.max(duration * zoom, 600);

  const ticks = useMemo(() => {
    const out: number[] = [];
    const step = duration > 60 ? 5 : duration > 20 ? 2 : 1;
    for (let s = 0; s <= duration; s += step) out.push(s);
    return out;
  }, [duration]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + trackRef.current.scrollLeft;
    onSeek(Math.max(0, Math.min(duration, x / zoom)));
  };

  return (
    <div className="border-t border-border bg-[hsl(var(--studio-panel))]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/60 text-xs">
        <span className="font-medium text-muted-foreground">Timeline</span>
        <span className="tabular-nums text-muted-foreground">
          {fmt(currentTime)} / {fmt(duration)}
        </span>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5" onClick={onSplit}>
          <Scissors className="w-3.5 h-3.5" /> Cortar
        </Button>
        <div className="flex-1" />
        <span className="text-muted-foreground">{clips.length} clipes</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{captions.length} legendas</span>
        <div className="flex items-center gap-1 ml-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onZoomChange(Math.max(20, zoom - 20))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onZoomChange(Math.min(200, zoom + 20))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Tracks */}
      <div ref={trackRef} className="overflow-x-auto" onClick={handleTrackClick}>
        <div className="relative" style={{ width: totalWidth, minHeight: 160 }}>
          {/* Régua */}
          <div className="h-6 relative border-b border-border/40 bg-background/40">
            {ticks.map((s) => (
              <div
                key={s}
                className="absolute top-0 h-full text-[10px] text-muted-foreground border-l border-border/30 pl-1 select-none"
                style={{ left: s * zoom }}
              >
                {fmt(s)}
              </div>
            ))}
          </div>

          {/* Track Vídeo (waveform + clipes) */}
          <div className="relative h-20 mt-2 mx-1">
            <div className="absolute inset-0 rounded bg-background/40 border border-border/40 overflow-hidden">
              <Waveform peaks={peaks} width={totalWidth - 8} height={80} />
            </div>
            {clips.map((clip) => (
              <ClipBlock
                key={clip.id}
                clip={clip}
                duration={duration}
                zoom={zoom}
                onChange={(patch) => onUpdateClip(clip.id, patch)}
                onDelete={() => onDeleteClip(clip.id)}
              />
            ))}
          </div>

          {/* Track Legendas */}
          <div className="relative h-9 mt-2 mx-1">
            <div className="absolute inset-0 rounded bg-background/40 border border-border/40" />
            {captions.map((cap) => {
              const left = cap.start * zoom;
              const width = Math.max(20, (cap.end - cap.start) * zoom);
              const selected = selectedCaptionId === cap.id;
              return (
                <button
                  key={cap.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCaption(cap.id);
                    onSeek(cap.start);
                  }}
                  className={cn(
                    'absolute top-1 bottom-1 rounded px-2 text-xs truncate text-left transition-colors',
                    selected
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                  )}
                  style={{ left, width }}
                  title={cap.text}
                >
                  {cap.text || '(legenda)'}
                </button>
              );
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-px bg-primary pointer-events-none z-10"
            style={{ left: currentTime * zoom }}
          >
            <div className="absolute -top-1 -left-[5px] w-[11px] h-[11px] rounded-full bg-primary shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Waveform({ peaks, width, height }: { peaks: number[]; width: number; height: number }) {
  if (!peaks.length) {
    return <div className="w-full h-full flex items-center justify-center text-[11px] text-muted-foreground">Carregando waveform…</div>;
  }
  // Desenha barras simples via SVG
  const bars = peaks.length;
  const barW = width / bars;
  return (
    <svg width={width} height={height} className="block">
      <defs>
        <linearGradient id="wfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {peaks.map((p, i) => {
        const h = Math.max(1, p * (height - 4));
        return (
          <rect
            key={i}
            x={i * barW}
            y={(height - h) / 2}
            width={Math.max(1, barW - 0.5)}
            height={h}
            fill="url(#wfGrad)"
            rx={0.5}
          />
        );
      })}
    </svg>
  );
}

function ClipBlock({
  clip,
  duration,
  zoom,
  onChange,
  onDelete,
}: {
  clip: VideoClip;
  duration: number;
  zoom: number;
  onChange: (patch: Partial<VideoClip>) => void;
  onDelete: () => void;
}) {
  const left = clip.start * zoom;
  const width = Math.max(20, (clip.end - clip.start) * zoom);

  const startDrag = (edge: 'left' | 'right') => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const orig = edge === 'left' ? clip.start : clip.end;
    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      if (edge === 'left') {
        const next = Math.max(0, Math.min(clip.end - 0.2, orig + dx));
        onChange({ start: next });
      } else {
        const next = Math.max(clip.start + 0.2, Math.min(duration, orig + dx));
        onChange({ end: next });
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 bottom-0 rounded border-2 border-primary/70 bg-primary/15 group"
      style={{ left, width }}
      title={`${fmt(clip.start)} → ${fmt(clip.end)}`}
    >
      <div
        onMouseDown={startDrag('left')}
        className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary cursor-ew-resize opacity-70 group-hover:opacity-100"
      />
      <div
        onMouseDown={startDrag('right')}
        className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary cursor-ew-resize opacity-70 group-hover:opacity-100"
      />
      <button
        onClick={onDelete}
        className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-destructive/80 text-destructive-foreground"
        title="Remover clipe"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function fmt(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
