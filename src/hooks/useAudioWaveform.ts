import { useEffect, useState } from 'react';

/**
 * Decodifica o áudio da URL e calcula picos normalizados (0–1) para
 * desenhar uma waveform compacta. Usa AudioContext.
 */
export function useAudioWaveform(url: string | undefined, samples = 400) {
  const [peaks, setPeaks] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!url) return;
    setLoading(true);

    (async () => {
      try {
        const resp = await fetch(url);
        const buf = await resp.arrayBuffer();
        type Win = typeof window & { webkitAudioContext?: typeof AudioContext };
        const Ctx: typeof AudioContext = window.AudioContext || (window as Win).webkitAudioContext!;
        const ctx = new Ctx();
        const decoded = await ctx.decodeAudioData(buf.slice(0));
        const channel = decoded.getChannelData(0);
        const blockSize = Math.max(1, Math.floor(channel.length / samples));
        const out: number[] = [];
        let max = 0;
        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          const end = Math.min(channel.length, start + blockSize);
          let peak = 0;
          for (let j = start; j < end; j++) {
            const v = Math.abs(channel[j]);
            if (v > peak) peak = v;
          }
          out.push(peak);
          if (peak > max) max = peak;
        }
        if (max > 0) for (let i = 0; i < out.length; i++) out[i] /= max;
        await ctx.close();
        if (!cancelled) setPeaks(out);
      } catch (e) {
        console.error('Waveform error', e);
        if (!cancelled) setPeaks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, samples]);

  return { peaks, loading };
}
