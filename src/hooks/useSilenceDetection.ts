import { useCallback, useState } from 'react';
import type { VideoClip } from '@/types/studio';

interface DetectOptions {
  thresholdDb?: number;   // default -40
  minSilenceS?: number;   // default 0.8
  windowMs?: number;      // default 50
}

/**
 * Decodifica o áudio da URL fornecida e devolve a lista de clips "ativos"
 * (intervalos não silenciosos). Tudo client-side via AudioContext.
 */
export function useSilenceDetection() {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const analyze = useCallback(
    async (sourceUrl: string, opts: DetectOptions = {}): Promise<VideoClip[]> => {
      const thresholdDb = opts.thresholdDb ?? -40;
      const minSilenceS = opts.minSilenceS ?? 0.8;
      const windowMs = opts.windowMs ?? 50;

      setAnalyzing(true);
      setProgress(5);
      try {
        const resp = await fetch(sourceUrl);
        const arrayBuf = await resp.arrayBuffer();
        setProgress(30);

        type Win = typeof window & { webkitAudioContext?: typeof AudioContext };
        const Ctx: typeof AudioContext = window.AudioContext || (window as Win).webkitAudioContext!;
        const ctx = new Ctx();
        const audio = await ctx.decodeAudioData(arrayBuf.slice(0));
        setProgress(60);

        const sampleRate = audio.sampleRate;
        const channelData = audio.getChannelData(0);
        const totalDuration = audio.duration;
        const windowSize = Math.max(1, Math.floor((windowMs / 1000) * sampleRate));
        const thresholdLinear = Math.pow(10, thresholdDb / 20);

        // Calcula RMS por janela
        const silentWindows: boolean[] = [];
        for (let i = 0; i < channelData.length; i += windowSize) {
          let sum = 0;
          const end = Math.min(channelData.length, i + windowSize);
          for (let j = i; j < end; j++) sum += channelData[j] * channelData[j];
          const rms = Math.sqrt(sum / (end - i));
          silentWindows.push(rms < thresholdLinear);
        }
        setProgress(85);

        // Agrupa em intervalos de silêncio prolongado
        const winDurationS = windowSize / sampleRate;
        const silentRanges: Array<[number, number]> = [];
        let runStart: number | null = null;
        for (let w = 0; w < silentWindows.length; w++) {
          if (silentWindows[w]) {
            if (runStart === null) runStart = w * winDurationS;
          } else if (runStart !== null) {
            const runEnd = w * winDurationS;
            if (runEnd - runStart >= minSilenceS) silentRanges.push([runStart, runEnd]);
            runStart = null;
          }
        }
        if (runStart !== null) {
          const runEnd = silentWindows.length * winDurationS;
          if (runEnd - runStart >= minSilenceS) silentRanges.push([runStart, runEnd]);
        }

        // Inverte: clips ativos = trechos fora dos silêncios
        const clips: VideoClip[] = [];
        let cursor = 0;
        for (const [s, e] of silentRanges) {
          if (s > cursor + 0.05) {
            clips.push({ id: crypto.randomUUID(), start: cursor, end: s });
          }
          cursor = e;
        }
        if (cursor < totalDuration - 0.05) {
          clips.push({ id: crypto.randomUUID(), start: cursor, end: totalDuration });
        }
        if (clips.length === 0) {
          clips.push({ id: crypto.randomUUID(), start: 0, end: totalDuration });
        }

        await ctx.close();
        setProgress(100);
        return clips;
      } finally {
        setAnalyzing(false);
        setTimeout(() => setProgress(0), 600);
      }
    },
    [],
  );

  return { analyze, analyzing, progress };
}
