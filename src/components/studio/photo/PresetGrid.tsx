import { PHOTO_PRESETS } from '@/lib/photoFilters';
import { adjustmentsToCssFilter } from '@/lib/photoFilters';
import type { PhotoAdjustments } from '@/types/studio';
import { DEFAULT_ADJUSTMENTS } from '@/types/studio';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CopyCheck } from 'lucide-react';

interface Props {
  thumbnailSrc?: string; // miniatura para preview do preset
  activePresetId?: string;
  onApply: (presetId: string, applyToAll: boolean) => void;
}

export function PresetGrid({ thumbnailSrc, activePresetId, onApply }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {PHOTO_PRESETS.map((p) => {
          const merged: PhotoAdjustments = { ...DEFAULT_ADJUSTMENTS, ...p.values };
          const filter = adjustmentsToCssFilter(merged);
          const active = activePresetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onApply(p.id, false)}
              className={cn(
                'group flex flex-col gap-1 rounded-md border bg-muted/40 overflow-hidden transition-all text-left',
                active ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary/60',
              )}
            >
              <div className="aspect-square w-full overflow-hidden bg-muted">
                {thumbnailSrc ? (
                  <img
                    src={thumbnailSrc}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    style={{ filter }}
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--muted)), hsl(var(--accent)))', filter }}
                  />
                )}
              </div>
              <span className="text-[11px] font-medium px-1.5 pb-1 truncate">{p.name}</span>
            </button>
          );
        })}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        disabled={!activePresetId || activePresetId === 'original'}
        onClick={() => activePresetId && onApply(activePresetId, true)}
      >
        <CopyCheck className="w-4 h-4" /> Aplicar a todas
      </Button>
    </div>
  );
}
