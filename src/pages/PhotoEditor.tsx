import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Upload, Download, Trash2, Loader2, ImagePlus, Sliders, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

import { useMediaProject, useUpdateMediaProject } from '@/hooks/useMediaProjects';
import { useStickyState } from '@/hooks/useStickyState';
import { usePhotoExport } from '@/hooks/usePhotoExport';
import { adjustmentsToCssFilter, PHOTO_PRESETS } from '@/lib/photoFilters';
import type { PhotoAdjustments } from '@/types/studio';
import { DEFAULT_ADJUSTMENTS } from '@/types/studio';

import { PhotoGallery, type PhotoItem } from '@/components/studio/photo/PhotoGallery';
import { PresetGrid } from '@/components/studio/photo/PresetGrid';
import { AdjustmentSliders } from '@/components/studio/photo/AdjustmentSliders';

const MAX_PHOTOS = 10;

interface StoredItem {
  id: string;
  name: string;
  dataUrl: string;
  adjustments: PhotoAdjustments;
}

export default function PhotoEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: project } = useMediaProject(projectId);
  const updateProject = useUpdateMediaProject();

  // Persistência por projeto: items são salvos como dataURLs no localStorage para sobreviver a refresh
  const storageKey = projectId ? `studio:photo:${projectId}` : null;
  const [stored, setStored] = useStickyState<StoredItem[]>(storageKey, []);

  const [items, setItems] = useState<PhotoItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | undefined>();
  const [syncToAll, setSyncToAll] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());
  const { exporting, progress, exportZip } = usePhotoExport();

  // Hidrata items a partir do storage (uma vez por projeto)
  useEffect(() => {
    if (!storageKey) return;
    setHydrated(false);
    if (stored.length === 0 && project?.source_url) {
      // primeira foto = source_url do projeto
      setItems([{
        id: crypto.randomUUID(),
        name: project.title || 'foto.jpg',
        src: project.source_url,
        adjustments: DEFAULT_ADJUSTMENTS,
        status: 'ready',
      }]);
    } else {
      setItems(stored.map((s) => ({
        id: s.id,
        name: s.name,
        src: s.dataUrl,
        adjustments: s.adjustments,
        status: 'ready',
      })));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, project?.source_url]);

  // Persiste sempre que items mudam (somente itens que não são URLs remotas grandes)
  useEffect(() => {
    if (!hydrated || !storageKey) return;
    const toStore: StoredItem[] = items
      .filter((i) => i.src.startsWith('data:') || i.src.startsWith('blob:') || i.src.startsWith('http'))
      .map((i) => ({
        id: i.id,
        name: i.name,
        // se for blob:, não persistimos o bytes (apenas dataUrl será gerado on demand)
        dataUrl: i.src.startsWith('blob:') ? '' : i.src,
        adjustments: i.adjustments,
      }))
      .filter((i) => i.dataUrl); // descarta blob sem dataUrl
    setStored(toStore);
  }, [items, hydrated, storageKey, setStored]);

  // Cleanup object URLs ao desmontar
  useEffect(() => {
    return () => {
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrls.current.clear();
    };
  }, []);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) || items[0] || null,
    [items, selectedId],
  );

  // Garante seleção
  useEffect(() => {
    if (!selectedId && items.length > 0) setSelectedId(items[0].id);
    if (selectedId && !items.some((i) => i.id === selectedId)) {
      setSelectedId(items[0]?.id ?? null);
    }
  }, [items, selectedId]);

  // Helpers
  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) {
      toast.error('Selecione arquivos de imagem');
      return;
    }
    const remaining = MAX_PHOTOS - items.length;
    if (remaining <= 0) {
      toast.error(`Limite de ${MAX_PHOTOS} fotos atingido`);
      return;
    }
    const slice = arr.slice(0, remaining);
    if (arr.length > remaining) {
      toast.warning(`Apenas as primeiras ${remaining} fotos foram adicionadas (limite ${MAX_PHOTOS})`);
    }

    const news: PhotoItem[] = await Promise.all(
      slice.map(async (file) => {
        const dataUrl = await fileToDataUrl(file);
        return {
          id: crypto.randomUUID(),
          name: file.name,
          src: dataUrl,
          adjustments: { ...DEFAULT_ADJUSTMENTS },
          status: 'ready' as const,
        };
      }),
    );
    setItems((prev) => [...prev, ...news]);
    if (!selectedId && news[0]) setSelectedId(news[0].id);
    toast.success(`${news.length} foto${news.length > 1 ? 's' : ''} adicionada${news.length > 1 ? 's' : ''}`);
  }, [items.length, selectedId]);

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item && item.src.startsWith('blob:')) {
        URL.revokeObjectURL(item.src);
        objectUrls.current.delete(item.src);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((i) => {
      if (i.src.startsWith('blob:')) URL.revokeObjectURL(i.src);
    });
    objectUrls.current.clear();
    setItems([]);
    setSelectedId(null);
    setActivePreset(undefined);
  };

  // Aplicar slider
  const handleSliderChange = (key: keyof PhotoAdjustments, value: number) => {
    setActivePreset(undefined);
    setItems((prev) =>
      prev.map((i) => {
        if (syncToAll || i.id === selected?.id) {
          return { ...i, adjustments: { ...i.adjustments, [key]: value, preset: undefined } };
        }
        return i;
      }),
    );
  };

  // Aplicar preset
  const applyPreset = (presetId: string, applyToAll: boolean) => {
    const preset = PHOTO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    const adj: PhotoAdjustments = { ...DEFAULT_ADJUSTMENTS, ...preset.values, preset: presetId };
    setItems((prev) =>
      prev.map((i) => {
        if (applyToAll || syncToAll || i.id === selected?.id) {
          return { ...i, adjustments: adj };
        }
        return i;
      }),
    );
    toast.success(applyToAll ? `Preset "${preset.name}" aplicado a todas` : `Preset "${preset.name}" aplicado`);
  };

  const resetSelected = () => {
    if (!selected) return;
    setActivePreset(undefined);
    setItems((prev) =>
      prev.map((i) => {
        if (syncToAll || i.id === selected.id) {
          return { ...i, adjustments: { ...DEFAULT_ADJUSTMENTS } };
        }
        return i;
      }),
    );
  };

  // Salvar ajuste no projeto (apenas o do destaque, debounced)
  useEffect(() => {
    if (!project || !selected) return;
    const t = setTimeout(() => {
      updateProject.mutate({
        id: project.id,
        project_data: { adjustments: selected.adjustments } as never,
      });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.adjustments]);

  const handleExport = async () => {
    if (items.length === 0) {
      toast.error('Nenhuma foto para exportar');
      return;
    }
    try {
      await exportZip(items, `${project?.title || 'fotos'}-editadas.zip`);
      toast.success('Download iniciado');
    } catch (e: any) {
      toast.error('Falha ao exportar', { description: e?.message });
    }
  };

  // Drag overlay
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="h-screen flex flex-col bg-background text-foreground"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b bg-card/40 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/studio')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Estúdio
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold truncate max-w-[40ch]">
              {project?.title || 'Editor de fotos'}
            </h1>
          </div>
          <span className="text-xs text-muted-foreground">
            {items.length}/{MAX_PHOTOS} fotos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={items.length >= MAX_PHOTOS}
          >
            <ImagePlus className="w-4 h-4" /> Adicionar
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Center */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Foco */}
          <section className="flex-1 min-h-0 bg-muted/20 flex items-center justify-center p-6 relative">
            {items.length === 0 ? (
              <EmptyDropzone onPickClick={() => fileInputRef.current?.click()} />
            ) : selected ? (
              <FocusView item={selected} />
            ) : null}
          </section>

          {/* Galeria */}
          <section className="border-t bg-card/30 p-3 max-h-[34vh] overflow-y-auto shrink-0">
            {items.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">
                Arraste imagens em qualquer lugar da tela ou clique em <strong>Adicionar</strong>
              </p>
            ) : (
              <PhotoGallery
                items={items}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
                onRemove={removeItem}
              />
            )}
          </section>

          {/* Footer */}
          <footer className="border-t bg-card/50 px-4 py-2.5 flex items-center justify-between shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={items.length === 0 || exporting}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" /> Limpar fila
            </Button>
            <div className="flex items-center gap-3">
              {exporting && (
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
                </div>
              )}
              <Button
                size="sm"
                onClick={handleExport}
                disabled={items.length === 0 || exporting}
                className="gap-2"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Baixar todas (ZIP)
              </Button>
            </div>
          </footer>
        </main>

        {/* Sidebar direita */}
        <aside className="w-[340px] border-l bg-card/30 flex flex-col shrink-0">
          <Tabs defaultValue="presets" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-2 mx-3 mt-3">
              <TabsTrigger value="presets" className="gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Presets
              </TabsTrigger>
              <TabsTrigger value="adjust" className="gap-2">
                <Sliders className="w-3.5 h-3.5" /> Ajustes
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 min-h-0">
              <TabsContent value="presets" className="m-0 p-4">
                <PresetGrid
                  thumbnailSrc={selected?.src}
                  activePresetId={activePreset || selected?.adjustments.preset}
                  onApply={applyPreset}
                />
              </TabsContent>
              <TabsContent value="adjust" className="m-0 p-4">
                {selected ? (
                  <AdjustmentSliders
                    values={selected.adjustments}
                    onChange={handleSliderChange}
                    onReset={resetSelected}
                    syncToAll={syncToAll}
                    onSyncChange={setSyncToAll}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Adicione fotos para começar
                  </p>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </aside>
      </div>

      {/* Drag overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <div className="bg-card px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <Upload className="w-6 h-6 text-primary" />
            <span className="font-semibold">Solte as imagens aqui</span>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyDropzone({ onPickClick }: { onPickClick: () => void }) {
  return (
    <button
      onClick={onPickClick}
      className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl px-12 py-16 text-center transition-colors group"
    >
      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <h2 className="text-lg font-semibold mb-1">Arraste até 10 imagens</h2>
      <p className="text-sm text-muted-foreground mb-3">ou clique para selecionar do dispositivo</p>
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP</p>
    </button>
  );
}

function FocusView({ item }: { item: PhotoItem }) {
  const filter = adjustmentsToCssFilter(item.adjustments);
  return (
    <div className="relative max-h-full max-w-full flex items-center justify-center">
      <img
        src={item.src}
        alt={item.name}
        className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl"
        style={{ filter }}
        draggable={false}
      />
      {item.adjustments.vignette > 0 && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${item.adjustments.vignette / 130}) 100%)`,
          }}
        />
      )}
    </div>
  );
}
