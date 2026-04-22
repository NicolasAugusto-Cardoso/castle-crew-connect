import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { VideoCaption } from '@/types/studio';

interface Props {
  caption: VideoCaption | null;
  onChange: (patch: Partial<VideoCaption>) => void;
  onDelete: () => void;
}

const FONT_FAMILIES = ['Inter, sans-serif', 'Georgia, serif', 'Courier New, monospace', 'Impact, sans-serif'];

export function CaptionPropertiesPanel({ caption, onChange, onDelete }: Props) {
  if (!caption) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Selecione uma legenda na timeline para editar suas propriedades.
      </div>
    );
  }
  const style = caption.style || {};
  const setStyle = (patch: Partial<NonNullable<VideoCaption['style']>>) =>
    onChange({ style: { ...style, ...patch } });

  return (
    <div className="p-4 space-y-4 text-sm">
      <div>
        <Label className="text-xs">Texto</Label>
        <Input
          value={caption.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Início (s)</Label>
          <Input
            type="number"
            step="0.1"
            value={caption.start.toFixed(2)}
            onChange={(e) => onChange({ start: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Fim (s)</Label>
          <Input
            type="number"
            step="0.1"
            value={caption.end.toFixed(2)}
            onChange={(e) => onChange({ end: Math.max(caption.start + 0.1, parseFloat(e.target.value) || 0) })}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Fonte</Label>
        <select
          className="mt-1 w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={style.fontFamily || FONT_FAMILIES[0]}
          onChange={(e) => setStyle({ fontFamily: e.target.value })}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f.split(',')[0]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label className="text-xs">Tamanho ({style.fontSize ?? 22}px)</Label>
        <Slider
          min={12}
          max={64}
          step={1}
          value={[style.fontSize ?? 22]}
          onValueChange={([v]) => setStyle({ fontSize: v })}
          className="mt-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Cor texto</Label>
          <Input
            type="color"
            value={style.color || '#ffffff'}
            onChange={(e) => setStyle({ color: e.target.value })}
            className="mt-1 h-9 p-1"
          />
        </div>
        <div>
          <Label className="text-xs">Fundo</Label>
          <Input
            value={style.background || 'rgba(0,0,0,0.55)'}
            onChange={(e) => setStyle({ background: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Posição vertical ({Math.round((style.y ?? 0.12) * 100)}%)</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[Math.round((style.y ?? 0.12) * 100)]}
          onValueChange={([v]) => setStyle({ y: v / 100 })}
          className="mt-2"
        />
      </div>
      <Button variant="destructive" size="sm" className="w-full gap-2" onClick={onDelete}>
        <Trash2 className="w-4 h-4" /> Remover legenda
      </Button>
    </div>
  );
}
