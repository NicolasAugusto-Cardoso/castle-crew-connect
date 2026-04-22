import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RotateCcw } from 'lucide-react';
import type { PhotoAdjustments } from '@/types/studio';
import { DEFAULT_ADJUSTMENTS } from '@/types/studio';

interface Props {
  values: PhotoAdjustments;
  onChange: (key: keyof PhotoAdjustments, value: number) => void;
  onReset: () => void;
  syncToAll: boolean;
  onSyncChange: (v: boolean) => void;
}

const GROUPS: { title: string; keys: { k: keyof PhotoAdjustments; label: string; min?: number; max?: number }[] }[] = [
  {
    title: 'Luz',
    keys: [
      { k: 'exposure', label: 'Exposição' },
      { k: 'brightness', label: 'Iluminação' },
      { k: 'contrast', label: 'Contraste' },
      { k: 'highlights', label: 'Realces' },
      { k: 'shadows', label: 'Sombras' },
      { k: 'whites', label: 'Brancos' },
      { k: 'blacks', label: 'Pretos' },
      { k: 'clarity', label: 'Claridade' },
    ],
  },
  {
    title: 'Cor',
    keys: [
      { k: 'saturation', label: 'Saturação' },
      { k: 'vibrance', label: 'Vibração' },
      { k: 'temperature', label: 'Temperatura' },
    ],
  },
  {
    title: 'Efeitos',
    keys: [{ k: 'vignette', label: 'Vinheta', min: 0, max: 100 }],
  },
];

export function AdjustmentSliders({ values, onChange, onReset, syncToAll, onSyncChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch id="sync" checked={syncToAll} onCheckedChange={onSyncChange} />
          <Label htmlFor="sync" className="text-xs cursor-pointer">
            Sincronizar com todas
          </Label>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1 text-xs">
          <RotateCcw className="w-3 h-3" /> Resetar
        </Button>
      </div>

      {GROUPS.map((group) => (
        <div key={group.title} className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </h4>
          {group.keys.map(({ k, label, min, max }) => {
            const val = values[k] as number;
            const lo = min ?? -100;
            const hi = max ?? 100;
            const def = DEFAULT_ADJUSTMENTS[k] as number;
            const isDirty = val !== def;
            return (
              <div key={k} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDirty ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                    {label}
                  </span>
                  <button
                    onDoubleClick={() => onChange(k, def)}
                    className="font-mono tabular-nums text-muted-foreground hover:text-foreground"
                    title="Duplo clique para resetar"
                  >
                    {val > 0 ? `+${val}` : val}
                  </button>
                </div>
                <Slider
                  min={lo}
                  max={hi}
                  step={1}
                  value={[val]}
                  onValueChange={(v) => onChange(k, v[0])}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
