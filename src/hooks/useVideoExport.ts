import { useCallback, useRef, useState } from 'react';
import type { VideoCaption, VideoClip } from '@/types/studio';

interface ExportOptions {
  source: HTMLVideoElement;
  clips: VideoClip[];
  captions: VideoCaption[];
  width?: number;
  height?: number;
  fps?: number;
  onProgress?: (pct: number) => void;
}

/**
 * Exporta o vídeo final usando MediaRecorder + canvas.captureStream.
 * Renderiza cada clip ativo sequencialmente, desenha legendas overlay
 * e gera um Blob webm pronto para upload.
 */
export function useVideoExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);

  const cancel = () => {
    cancelRef.current = true;
  };

  const exportVideo = useCallback(async (opts: ExportOptions): Promise<Blob> => {
    const { source, clips, captions, onProgress } = opts;
    const width = opts.width || source.videoWidth || 1280;
    const height = opts.height || source.videoHeight || 720;
    const fps = opts.fps || 30;

    setIsExporting(true);
    setProgress(0);
    cancelRef.current = false;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Pegar áudio do <video> via captureStream
    type VideoWithCapture = HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const v = source as VideoWithCapture;
    const sourceStream =
      v.captureStream?.() || v.mozCaptureStream?.() || null;
    const audioTracks = sourceStream?.getAudioTracks() || [];

    const canvasStream = canvas.captureStream(fps);
    audioTracks.forEach((t) => canvasStream.addTrack(t));

    const mimeType =
      ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) =>
        MediaRecorder.isTypeSupported(m),
      ) || 'video/webm';

    const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 4_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const stopped = new Promise<void>((res) => {
      recorder.onstop = () => res();
    });

    recorder.start(250);

    const orderedClips = clips.length
      ? [...clips].sort((a, b) => a.start - b.start)
      : [{ id: 'full', start: 0, end: source.duration }];
    const totalDuration = orderedClips.reduce((acc, c) => acc + (c.end - c.start), 0);
    let elapsed = 0;

    const wasPaused = source.paused;
    const originalTime = source.currentTime;
    source.muted = false;

    try {
      for (const clip of orderedClips) {
        if (cancelRef.current) break;
        source.currentTime = clip.start;
        await waitForSeek(source);
        await source.play().catch(() => {});

        // Espera até atingir clip.end ou cancelar
        await new Promise<void>((resolve) => {
          let raf = 0;
          const draw = () => {
            ctx.drawImage(source, 0, 0, width, height);

            // Overlay legendas
            const t = source.currentTime;
            const cap = captions.find((c) => t >= c.start && t <= c.end);
            if (cap) drawCaption(ctx, cap, width, height);

            const localElapsed = source.currentTime - clip.start;
            const pct = Math.min(100, ((elapsed + Math.max(0, localElapsed)) / totalDuration) * 100);
            setProgress(pct);
            onProgress?.(pct);

            if (cancelRef.current || source.currentTime >= clip.end || source.ended) {
              cancelAnimationFrame(raf);
              resolve();
            } else {
              raf = requestAnimationFrame(draw);
            }
          };
          raf = requestAnimationFrame(draw);
        });

        source.pause();
        elapsed += clip.end - clip.start;
      }
    } finally {
      recorder.stop();
      await stopped;
      source.currentTime = originalTime;
      if (wasPaused) source.pause();
      setIsExporting(false);
      setProgress(100);
    }

    return new Blob(chunks, { type: mimeType });
  }, []);

  return { exportVideo, isExporting, progress, cancel };
}

function waitForSeek(v: HTMLVideoElement): Promise<void> {
  return new Promise((res) => {
    if (v.readyState >= 2 && Math.abs(v.currentTime - v.currentTime) < 0.01) {
      res();
      return;
    }
    const handler = () => {
      v.removeEventListener('seeked', handler);
      res();
    };
    v.addEventListener('seeked', handler);
  });
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  cap: VideoCaption,
  w: number,
  h: number,
) {
  const fontSize = (cap.style?.fontSize ?? 22) * (w / 720);
  const family = cap.style?.fontFamily || 'Inter, sans-serif';
  ctx.font = `600 ${fontSize}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = cap.text;
  const padX = fontSize * 0.7;
  const padY = fontSize * 0.4;
  const metrics = ctx.measureText(text);
  const tw = Math.min(metrics.width + padX * 2, w * 0.9);
  const th = fontSize + padY * 2;
  const yPos = h * (1 - (cap.style?.y ?? 0.12));

  ctx.fillStyle = cap.style?.background || 'rgba(0,0,0,0.55)';
  roundRect(ctx, w / 2 - tw / 2, yPos - th / 2, tw, th, 8);
  ctx.fill();

  ctx.fillStyle = cap.style?.color || '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 2;
  ctx.fillText(text, w / 2, yPos);
  ctx.shadowBlur = 0;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
