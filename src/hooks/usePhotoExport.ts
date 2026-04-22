import { useCallback, useState } from 'react';
import JSZip from 'jszip';
import { applyAdjustmentsToCanvas } from '@/lib/photoFilters';
import type { PhotoItem } from '@/components/studio/photo/PhotoGallery';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob falhou'))), type, quality);
  });
}

function safeName(name: string) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[^\w\-_. ]+/g, '_').slice(0, 60);
  return `${base || 'foto'}.jpg`;
}

export function usePhotoExport() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportZip = useCallback(async (items: PhotoItem[], zipName = 'fotos-editadas.zip') => {
    if (items.length === 0) return;
    setExporting(true);
    setProgress(0);
    try {
      const zip = new JSZip();
      let done = 0;
      for (const item of items) {
        try {
          const img = await loadImage(item.src);
          const canvas = applyAdjustmentsToCanvas(img, item.adjustments);
          const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
          zip.file(safeName(item.name), blob);
        } catch (err) {
          console.error('Falha ao processar', item.name, err);
        }
        done += 1;
        setProgress(Math.round((done / items.length) * 100));
      }

      const content = await zip.generateAsync({ type: 'blob' }, (meta) => {
        // Compressão final: usa a fase de zip como progresso ~últimos 5%
        if (meta.percent < 100) {
          setProgress(95 + Math.round(meta.percent * 0.05));
        }
      });

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setProgress(100);
    } finally {
      setTimeout(() => {
        setExporting(false);
        setProgress(0);
      }, 600);
    }
  }, []);

  return { exporting, progress, exportZip };
}
