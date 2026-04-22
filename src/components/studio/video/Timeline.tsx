import { useRef } from 'react';
import type { VideoCaption, VideoClip } from '@/types/studio';
import { cn } from '@/lib/utils';

interface TimelineProps {
  duration: number;
  currentTime: number;
  clips: VideoClip[];
  captions: VideoCaption[];
  selectedCaptionId: string | null;
  onSeek: (t: number) => void;
  onSelectCaption: (id: string | null) => void;
  onUpdateClip: (id: string, patch: Partial<VideoClip>) => void;
  onDeleteClip: (id: string) => void;
}

const PX_PER_SECOND = 60;

export function Timeline({
  duration,
  currentTime,
  clips,
  captions,
  selectedCaptionId,
  onSeek,
  onSelectCaption,
  onUpdateClip,
  onDeleteClip,
}: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const totalWidth = Math.max(duration * PX_PER_SECOND, 600);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + trackRef.current.scrollLeft;
    onSeek(Math.max(0, Math.min(duration, x / PX_PER_SECOND)));
  };

  const ticks: number[] = [];
  for (let s = 0; s <= duration; s += Math.max(1, Math.round(duration / 20))) ticks.push(s);

  return (
    <div className="border-t border-border bg-muted/30">
      <div ref={trackRef} className="overflow-x-auto" onClick={handleTrackClick}>
        <div className="relative" style={{ width: totalWidth, minHeight: 140 }}>
          {/* Régua */}
          <div className="h-6 relative border-b border-border/60">
            {ticks.map((s) => (
              <div
                key={s}
                className="absolute top-0 h-full text-[10px] text-muted-foreground border-l border-border/40 pl-1"
                style={{ left: s * PX_PER_SECOND }}
              >
                {formatTime(s)}
              </div>
            ))}
          </div>

          {/* Track V1 - clips */}
          <div className="relative h-12 mt-2 mx-1">
            <div className="absolute inset-0 rounded bg-background/40 border border-border/40" />
            {clips.map((clip) => (
              <ClipBlock
                key={clip.id}
                clip={clip}
                duration={duration}
                onChange={(patch) => onUpdateClip(clip.id, patch)}
                onDelete={() => onDeleteClip(clip.id)}
              />
            ))}
          </div>

          {/* Track T1 - legendas */}
          <div className="relative h-10 mt-2 mx-1">
            <div className="absolute inset-0 rounded bg-background/40 border border-border/40" />
            {captions.map((cap) => {
              const left = cap.start * PX_PER_SECOND;
              const width = Math.max(20, (cap.end - cap.start) * PX_PER_SECOND);
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
            className="absolute top-0 bottom-0 w-px bg-primary pointer-events-none"
            style={{ left: currentTime * PX_PER_SECOND }}
          >
            <div className="absolute -top-1 -left-[5px] w-[11px] h-[11px] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ClipBlock({
  clip,
  duration,
  onChange,
  onDelete,
}: {
  clip: VideoClip;
  duration: number;
  onChange: (patch: Partial<VideoClip>) => void;
  onDelete: () => void;
}) {
  const left = clip.start * PX_PER_SECOND;
  const width = Math.max(20, (clip.end - clip.start) * PX_PER_SECOND);

  const startDrag = (edge: 'left' | 'right') => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const orig = edge === 'left' ? clip.start : clip.end;
    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / PX_PER_SECOND;
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
      onDoubleClick={onDelete}
      className="absolute top-1 bottom-1 rounded bg-primary/30 border border-primary/60 group"
      style={{ left, width }}
      title={`${formatTime(clip.start)} → ${formatTime(clip.end)} (duplo clique remove)`}
    >
      <div
        onMouseDown={startDrag('left')}
        className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary cursor-ew-resize opacity-60 group-hover:opacity-100"
      />
      <div
        onMouseDown={startDrag('right')}
        className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary cursor-ew-resize opacity-60 group-hover:opacity-100"
      />
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
