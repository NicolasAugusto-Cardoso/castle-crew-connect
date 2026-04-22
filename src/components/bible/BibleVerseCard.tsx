import { Fragment, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BibleHighlight } from '@/hooks/useBibleAnnotations';
import { BibleVerseToolbar } from './BibleVerseToolbar';

interface BibleVerseCardProps {
  verseNumber: number;
  text: string;
  bookName: string;
  chapter: number;
  isHighlighted?: boolean; // navigation highlight (came from "saved" / search)
  isFocused?: boolean; // user-set focus mark
  hasNote?: boolean;
  highlights?: BibleHighlight[];
  onCopy: () => void;
  onShare: () => void;
  onOpenNote: () => void;
  onToggleFocus: () => void;
  /** Apply highlight to the entire verse text. */
  onAddHighlight: (
    color: string,
    startOffset: number,
    endOffset: number,
    selectedText: string
  ) => Promise<void>;
  onRemoveHighlight: (highlightId: string) => Promise<void>;
  onRemoveAllHighlights: () => Promise<void>;
  copiedVerse?: number | null;
  highlightRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Immersive verse component (Apple Books / YouVersion style).
 *
 * Interaction model:
 *  - Single tap: select verse → soft background highlight + floating toolbar.
 *  - Toolbar color tap: apply highlight to the whole verse instantly.
 *  - Double tap: toggle focus mark.
 *  - Tap on existing colored span: remove that highlight (with confirm).
 *
 * No yellow card, no "Selecione o texto" tooltip — the verse text is never
 * covered.
 */
export function BibleVerseCard({
  verseNumber,
  text,
  isHighlighted,
  isFocused,
  hasNote,
  highlights = [],
  onCopy,
  onShare,
  onOpenNote,
  onToggleFocus,
  onAddHighlight,
  onRemoveAllHighlights,
  onRemoveHighlight,
  highlightRef,
}: BibleVerseCardProps) {
  const [selected, setSelected] = useState(false);
  const [applying, setApplying] = useState(false);
  const verseRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap → focus toggle
      lastTapRef.current = 0;
      setSelected(false);
      onToggleFocus();
      return;
    }
    lastTapRef.current = now;
    setSelected(prev => !prev);
  }, [onToggleFocus]);

  const handlePickColor = async (color: string) => {
    setApplying(true);
    try {
      await onAddHighlight(color, 0, text.length, text);
    } finally {
      setApplying(false);
      setSelected(false);
    }
  };

  const handleClearHighlights = async () => {
    await onRemoveAllHighlights();
    setSelected(false);
  };

  // Render text, painting saved highlight ranges inline.
  const renderText = () => {
    if (highlights.length === 0) return text;

    const sorted = [...highlights].sort((a, b) => a.start_offset - b.start_offset);
    const out: React.ReactNode[] = [];
    let cursor = 0;

    sorted.forEach((h, i) => {
      if (h.start_offset < 0 || h.end_offset > text.length || h.start_offset >= h.end_offset) {
        return;
      }
      if (h.start_offset > cursor) {
        out.push(<Fragment key={`t-${i}`}>{text.slice(cursor, h.start_offset)}</Fragment>);
      }
      out.push(
        <span
          key={`h-${h.id}`}
          className="rounded-sm px-0.5 transition-opacity hover:opacity-80"
          style={{ backgroundColor: h.color }}
          onClick={e => {
            e.stopPropagation();
            if (window.confirm('Remover este grifo?')) {
              onRemoveHighlight(h.id);
            }
          }}
          role="button"
          tabIndex={0}
          title="Toque para remover este grifo"
        >
          {text.slice(h.start_offset, h.end_offset)}
        </span>
      );
      cursor = h.end_offset;
    });

    if (cursor < text.length) {
      out.push(<Fragment key="t-end">{text.slice(cursor)}</Fragment>);
    }
    return out;
  };

  return (
    <>
      <div
        ref={highlightRef}
        id={`verse-${verseNumber}`}
        className={cn(
          'group relative rounded-lg px-2 py-1.5 transition-colors duration-200 cursor-pointer select-none',
          isHighlighted && 'bg-primary/10 ring-1 ring-primary/30',
          isFocused && !isHighlighted && 'bg-primary/5',
          selected && !isHighlighted && 'bg-secondary'
        )}
        onClick={handleTap}
      >
        {hasNote && (
          <span
            aria-label="Versículo possui anotação"
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary"
          />
        )}

        <div ref={verseRef} className="leading-relaxed text-base sm:text-lg text-foreground">
          <sup className="mr-1.5 text-xs font-bold text-primary align-baseline">
            {verseNumber}
          </sup>
          {renderText()}
        </div>
      </div>

      {selected && (
        <BibleVerseToolbar
          anchor={verseRef.current}
          hasHighlights={highlights.length > 0}
          hasNote={!!hasNote}
          isApplying={applying}
          onPickColor={handlePickColor}
          onCopy={() => {
            onCopy();
            setSelected(false);
          }}
          onShare={() => {
            onShare();
            setSelected(false);
          }}
          onOpenNote={() => {
            onOpenNote();
            setSelected(false);
          }}
          onClearHighlights={handleClearHighlights}
          onClose={() => setSelected(false)}
        />
      )}
    </>
  );
}
