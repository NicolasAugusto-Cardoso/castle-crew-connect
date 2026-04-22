import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Captions as CaptionsIcon, Video as VideoIcon, Palette, Wand2 } from 'lucide-react';
import { CaptionPropertiesPanel } from './CaptionPropertiesPanel';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { VideoCaption } from '@/types/studio';

export interface VideoVisualSettings {
  brightness: number; // 0-200
  contrast: number;   // 0-200
  saturate: number;   // 0-200
  hue: number;        // -180-180
  scale: number;      // 0.5-2
  opacity: number;    // 0-1
}

export const DEFAULT_VISUAL: VideoVisualSettings = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hue: 0,
  scale: 1,
  opacity: 1,
};

interface Props {
  caption: VideoCaption | null;
  onCaptionChange: (patch: Partial<VideoCaption>) => void;
  onCaptionDelete: () => void;
  visual: VideoVisualSettings;
  onVisualChange: (patch: Partial<VideoVisualSettings>) => void;
  onResetVisual: () => void;
}

export function PropertiesPanel({
  caption,
  onCaptionChange,
  onCaptionDelete,
  visual,
  onVisualChange,
  onResetVisual,
}: Props) {
  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" /> Propriedades
        </h3>
        <p className="text-[11px] text-muted-foreground">Ajuste o que está selecionado</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={['caption', 'video']} className="px-2">
          <AccordionItem value="caption">
            <AccordionTrigger className="text-sm py-3">
              <span className="flex items-center gap-2">
                <CaptionsIcon className="w-4 h-4" /> Legendas
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <CaptionPropertiesPanel
                caption={caption}
                onChange={onCaptionChange}
                onDelete={onCaptionDelete}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="video">
            <AccordionTrigger className="text-sm py-3">
              <span className="flex items-center gap-2">
                <VideoIcon className="w-4 h-4" /> Vídeo
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="px-3 space-y-4 text-sm">
                <SliderRow
                  label="Escala"
                  value={visual.scale}
                  min={0.5}
                  max={2}
                  step={0.05}
                  format={(v) => `${v.toFixed(2)}x`}
                  onChange={(v) => onVisualChange({ scale: v })}
                />
                <SliderRow
                  label="Opacidade"
                  value={visual.opacity}
                  min={0}
                  max={1}
                  step={0.05}
                  format={(v) => `${Math.round(v * 100)}%`}
                  onChange={(v) => onVisualChange({ opacity: v })}
                />
                <Button variant="outline" size="sm" className="w-full" onClick={onResetVisual}>
                  Restaurar padrão
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="colors">
            <AccordionTrigger className="text-sm py-3">
              <span className="flex items-center gap-2">
                <Palette className="w-4 h-4" /> Cores e filtros
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="px-3 space-y-4 text-sm">
                <SliderRow
                  label="Brilho"
                  value={visual.brightness}
                  min={0}
                  max={200}
                  step={1}
                  format={(v) => `${v}`}
                  onChange={(v) => onVisualChange({ brightness: v })}
                />
                <SliderRow
                  label="Contraste"
                  value={visual.contrast}
                  min={0}
                  max={200}
                  step={1}
                  format={(v) => `${v}`}
                  onChange={(v) => onVisualChange({ contrast: v })}
                />
                <SliderRow
                  label="Saturação"
                  value={visual.saturate}
                  min={0}
                  max={200}
                  step={1}
                  format={(v) => `${v}`}
                  onChange={(v) => onVisualChange({ saturate: v })}
                />
                <SliderRow
                  label="Matiz"
                  value={visual.hue}
                  min={-180}
                  max={180}
                  step={1}
                  format={(v) => `${v}°`}
                  onChange={(v) => onVisualChange({ hue: v })}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{format(value)}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
