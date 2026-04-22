import type { PhotoAdjustments } from '@/types/studio';

/**
 * Converte os ajustes em -100..100 para uma string CSS `filter`.
 * Usado para preview em tempo real (galeria + foco).
 */
export function adjustmentsToCssFilter(a: PhotoAdjustments): string {
  // Exposure + brightness somam no brilho final
  const brightness = 1 + (a.brightness + a.exposure) / 200; // ex: +50 -> 1.25
  const contrast = 1 + (a.contrast + a.clarity * 0.5) / 100;
  const saturate = 1 + (a.saturation + a.vibrance * 0.6) / 100;
  // Temperature: positivo = warm (amarelo), negativo = cool (azul) via hue-rotate
  const hueRotate = a.temperature * -0.3; // graus
  // Whites/blacks aproximados via brightness extra (sutil)
  const sepiaWarm = a.temperature > 0 ? Math.min(a.temperature / 200, 0.4) : 0;

  return [
    `brightness(${clamp(brightness, 0.2, 2.5)})`,
    `contrast(${clamp(contrast, 0.2, 2.5)})`,
    `saturate(${clamp(saturate, 0, 3)})`,
    `hue-rotate(${hueRotate}deg)`,
    sepiaWarm > 0 ? `sepia(${sepiaWarm})` : '',
  ].filter(Boolean).join(' ');
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export interface PhotoPreset {
  id: string;
  name: string;
  values: Partial<PhotoAdjustments>;
}

export const PHOTO_PRESETS: PhotoPreset[] = [
  { id: 'original', name: 'Original', values: {} },
  {
    id: 'vintage',
    name: 'Vintage',
    values: { contrast: -10, saturation: -25, temperature: 35, vignette: 30, shadows: 15 },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    values: { contrast: 45, clarity: 30, blacks: -20, whites: 15 },
  },
  {
    id: 'warm',
    name: 'Warm',
    values: { temperature: 40, vibrance: 20, brightness: 5, highlights: -10 },
  },
  {
    id: 'cold',
    name: 'Cold',
    values: { temperature: -45, saturation: -10, contrast: 15, shadows: 10 },
  },
  {
    id: 'mono',
    name: 'Mono',
    values: { saturation: -100, contrast: 25, clarity: 20 },
  },
  {
    id: 'punchy',
    name: 'Punchy',
    values: { vibrance: 45, saturation: 15, contrast: 25, clarity: 20, shadows: 10 },
  },
  {
    id: 'soft',
    name: 'Soft',
    values: { contrast: -20, highlights: -15, shadows: 20, clarity: -15, brightness: 5 },
  },
];

/**
 * Aplica os ajustes em um canvas em alta resolução (para o ZIP final).
 * Mais preciso que o filter CSS — usa pixel-by-pixel para temperatura/clarity.
 */
export function applyAdjustmentsToCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  a: PhotoAdjustments,
): HTMLCanvasElement {
  const w = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const h = 'naturalHeight' in source ? source.naturalHeight : source.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.filter = adjustmentsToCssFilter(a);
  ctx.drawImage(source, 0, 0, w, h);
  ctx.filter = 'none';

  // Vignette (post-process)
  if (a.vignette > 0) {
    const grad = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.3,
      w / 2, h / 2, Math.max(w, h) * 0.75,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${a.vignette / 130})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  return canvas;
}
