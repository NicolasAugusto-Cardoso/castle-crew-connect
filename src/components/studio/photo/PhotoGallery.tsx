import { useEffect, useState } from 'react';
import { adjustmentsToCssFilter } from '@/lib/photoFilters';
import type { PhotoAdjustments } from '@/types/studio';
import { cn } from '@/lib/utils';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PhotoItem {
  id: string;
  name: string;
  src: string;          // object URL ou remote
  uploadedUrl?: string; // remote (após upload)
  width?: number;
  height?: number;
  adjustments: PhotoAdjustments;
  status: 'idle' | 'uploading' | 'ready' | 'error';
}

interface Props {
  items: PhotoItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function PhotoGallery({ items, selectedId, onSelect, onRemove }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map((it) => (
        <Thumb
          key={it.id}
          item={it}
          selected={it.id === selectedId}
          onSelect={() => onSelect(it.id)}
          onRemove={() => onRemove(it.id)}
        />
      ))}
    </div>
  );
}

function Thumb({
  item, selected, onSelect, onRemove,
}: { item: PhotoItem; selected: boolean; onSelect: () => void; onRemove: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const filter = adjustmentsToCssFilter(item.adjustments);

  // Reset loaded if src changes
  useEffect(() => { setLoaded(false); }, [item.src]);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg border-2 cursor-pointer transition-all',
        'bg-muted/40',
        selected ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary/50',
      )}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}
      <img
        src={item.src}
        alt={item.name}
        onLoad={() => setLoaded(true)}
        className="w-full h-full object-cover transition-opacity"
        style={{ filter, opacity: loaded ? 1 : 0 }}
        draggable={false}
      />
      {selected && (
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full p-1 shadow">
          <Check className="w-3 h-3" />
        </div>
      )}
      {item.status === 'uploading' && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}
      <Button
        size="icon"
        variant="destructive"
        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >
        <X className="w-3 h-3" />
      </Button>
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-[10px] text-white truncate">
        {item.name}
      </div>
    </div>
  );
}
