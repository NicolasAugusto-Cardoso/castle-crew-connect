import { useEffect, useRef } from 'react';
import { Copy, Share2, FileText, Highlighter, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

const HIGHLIGHT_COLORS = [
  { value: '#FDE047', label: 'Amarelo' },
  { value: '#86EFAC', label: 'Verde' },
  { value: '#93C5FD', label: 'Azul' },
  { value: '#F9A8D4', label: 'Rosa' },
  { value: '#FED7AA', label: 'Laranja' },
];

interface BibleVerseToolbarProps {
  /**
   * Anchor element (the verse <p>). The toolbar positions itself directly
   * above (or below if not enough space) the verse — never overlapping it.
   */
  anchor: HTMLElement | null;
  hasHighlights: boolean;
  hasNote: boolean;
  isApplying?: boolean;
  onPickColor: (color: string) => void;
  onCopy: () => void;
  onShare: () => void;
  onOpenNote: () => void;
  onClearHighlights: () => void;
  onClose: () => void;
}

/**
 * Floating, immersive selection toolbar — Apple Books / YouVersion style.
 * - Positioned relative to the selected verse's bounding box.
 * - Tapping a color applies the highlight immediately (single tap).
 * - Never covers the verse text: opens above when room exists, else below.
 */
export function BibleVerseToolbar({
  anchor,
  hasHighlights,
  hasNote,
  isApplying,
  onPickColor,
  onCopy,
  onShare,
  onOpenNote,
  onClearHighlights,
  onClose,
}: BibleVerseToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / scroll / escape
  useEffect(() => {
    const handlePointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (anchor?.contains(target)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Use a small timeout so the same tap that opened the toolbar doesn't close it.
    const t = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointer, true);
    }, 0);
    document.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('pointerdown', handlePointer, true);
      document.removeEventListener('keydown', handleKey);
    };
  }, [anchor, onClose]);

  // Position calculation — toolbar centered horizontally on viewport,
  // placed above or below the verse so it never covers the text.
  const rect = anchor?.getBoundingClientRect();
  const TOOLBAR_HEIGHT = 56;
  const GAP = 12;
  let top = 0;
  let placeAbove = true;
  let arrowOffsetPx = 0; // horizontal offset (px) of the arrow from toolbar center

  if (rect) {
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    placeAbove = spaceAbove > TOOLBAR_HEIGHT + GAP + 16 || spaceAbove > spaceBelow;
    top = placeAbove
      ? Math.max(8, rect.top - TOOLBAR_HEIGHT - GAP)
      : Math.min(window.innerHeight - TOOLBAR_HEIGHT - 8, rect.bottom + GAP);

    // Toolbar is centered on viewport; arrow points to the verse center.
    const verseCenterX = rect.left + rect.width / 2;
    const viewportCenterX = window.innerWidth / 2;
    // Clamp so the arrow stays within a reasonable toolbar width range.
    arrowOffsetPx = Math.max(-120, Math.min(120, verseCenterX - viewportCenterX));
  }

  if (!rect) return null;

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Ações do versículo"
      className={cn(
        'fixed z-50 flex items-center gap-1 rounded-2xl border border-border/60 bg-popover/95 px-2 py-1.5 shadow-xl backdrop-blur-md',
        'animate-in fade-in zoom-in-95 duration-200 ease-out'
      )}
      style={{
        top,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: isApplying ? 'none' : 'auto',
        opacity: isApplying ? 0.7 : 1,
      }}
    >
      {/* Color swatches — tap = apply immediately */}
      {HIGHLIGHT_COLORS.map(c => (
        <button
          key={c.value}
          type="button"
          onClick={() => onPickColor(c.value)}
          aria-label={`Grifar em ${c.label}`}
          title={c.label}
          className="h-7 w-7 rounded-full border border-border/60 transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: c.value }}
        />
      ))}

      <span className="mx-1 h-6 w-px bg-border/70" aria-hidden />

      <ToolbarIconButton label="Copiar" onClick={onCopy}>
        <Copy className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton label="Compartilhar" onClick={onShare}>
        <Share2 className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton label={hasNote ? 'Editar anotação' : 'Anotar'} onClick={onOpenNote}>
        <FileText className={cn('h-4 w-4', hasNote && 'text-primary')} />
      </ToolbarIconButton>
      {hasHighlights && (
        <ToolbarIconButton label="Limpar grifos" onClick={onClearHighlights}>
          <Eraser className="h-4 w-4" />
        </ToolbarIconButton>
      )}

      {/* Pointer arrow */}
      <span
        aria-hidden
        className={cn(
          'absolute left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-popover border-border/60',
          placeAbove ? '-bottom-1 border-b border-r' : '-top-1 border-t border-l'
        )}
      />
    </div>
  );
}

function ToolbarIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
    >
      {children}
    </button>
  );
}

export { HIGHLIGHT_COLORS };
