import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const HIGHLIGHT_COLORS = [
  { value: '#FDE047', label: 'Amarelo' },
  { value: '#86EFAC', label: 'Verde' },
  { value: '#93C5FD', label: 'Azul' },
  { value: '#F9A8D4', label: 'Rosa' },
  { value: '#FED7AA', label: 'Laranja' },
];

interface BibleHighlightPopoverProps {
  selectedText: string;
  onApply: (color: string) => Promise<void>;
  onClose: () => void;
  isApplying?: boolean;
  position?: { x: number; y: number };
}

export function BibleHighlightPopover({
  selectedText,
  onApply,
  onClose,
  isApplying,
  position,
}: BibleHighlightPopoverProps) {
  const handleApply = async (color: string) => {
    await onApply(color);
    onClose();
  };

  return (
    <div
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-3"
      style={
        position
          ? { left: position.x, top: position.y, transform: 'translateX(-50%)' }
          : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground max-w-[200px] truncate">
          "{selectedText}"
        </p>
        
        <div className="flex gap-2">
          {HIGHLIGHT_COLORS.map(color => (
            <button
              key={color.value}
              onClick={() => handleApply(color.value)}
              disabled={isApplying}
              className="w-8 h-8 rounded-full border-2 border-transparent hover:border-foreground transition-all hover:scale-110"
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isApplying}
            className="flex-1"
          >
            Cancelar
          </Button>
          {isApplying && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}

export { HIGHLIGHT_COLORS };
