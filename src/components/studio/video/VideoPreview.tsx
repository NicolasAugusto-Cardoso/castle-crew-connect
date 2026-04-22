import { forwardRef, useEffect, useRef } from 'react';
import type { VideoCaption, VideoClip } from '@/types/studio';

interface VideoPreviewProps {
  src: string;
  clips: VideoClip[];
  captions: VideoCaption[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (t: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onPlayPauseChange: (playing: boolean) => void;
}

/**
 * Preview do vídeo com overlay de legendas.
 * Pula automaticamente os intervalos fora dos clips ativos (ex: silêncio cortado).
 */
export const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ src, clips, captions, currentTime, onTimeUpdate, onLoadedMetadata, onPlayPauseChange }, ref) => {
    const internalRef = useRef<HTMLVideoElement | null>(null);

    const setRefs = (el: HTMLVideoElement | null) => {
      internalRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    };

    // Pular silêncios: ao reproduzir, se o tempo atual cair fora de um clip ativo, salta para o próximo.
    useEffect(() => {
      const v = internalRef.current;
      if (!v || clips.length === 0) return;
      const inside = clips.find((c) => currentTime >= c.start && currentTime <= c.end);
      if (!inside) {
        const next = clips.find((c) => c.start > currentTime);
        if (next) v.currentTime = next.start;
        else if (clips.length > 0) v.currentTime = clips[clips.length - 1].end;
      }
    }, [currentTime, clips]);

    const activeCaption = captions.find((c) => currentTime >= c.start && currentTime <= c.end);

    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={setRefs}
          src={src}
          className="max-w-full max-h-full"
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => onLoadedMetadata(e.currentTarget.duration)}
          onPlay={() => onPlayPauseChange(true)}
          onPause={() => onPlayPauseChange(false)}
          playsInline
        />
        {activeCaption && (
          <div
            className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-md text-center pointer-events-none max-w-[90%]"
            style={{
              bottom: `${(1 - (activeCaption.style?.y ?? 0.12)) * 100 - 8}%`,
              fontFamily: activeCaption.style?.fontFamily || 'Inter, sans-serif',
              fontSize: `${activeCaption.style?.fontSize ?? 22}px`,
              color: activeCaption.style?.color || '#ffffff',
              background: activeCaption.style?.background || 'rgba(0,0,0,0.55)',
              fontWeight: 600,
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            }}
          >
            {activeCaption.text}
          </div>
        )}
      </div>
    );
  },
);
VideoPreview.displayName = 'VideoPreview';
