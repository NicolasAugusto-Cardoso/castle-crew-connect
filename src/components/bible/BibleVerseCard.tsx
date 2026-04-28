import { Fragment, memo, useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BibleHighlight } from '@/hooks/useBibleAnnotations';
import { BibleVerseToolbar } from './BibleVerseToolbar';

interface BibleVerseCardProps {
  verseNumber: number;
  text: string;
  bookName: string;
  chapter: number;
  isHighlighted?: boolean;
  isFocused?: boolean;
  hasNote?: boolean;
  highlights?: BibleHighlight[];
  onCopy: () => void;
  onShare: () => void;
  onOpenNote: () => void;
  onToggleFocus: () => void;
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

function BibleVerseCardImpl({
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
  const [readingMode, setReadingMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      lastTapRef.current = 0;
      setSelected(false);
      onToggleFocus();
      return;
    }
    lastTapRef.current = now;
    setSelected(prev => !prev);
  }, [onToggleFocus]);

  const handlePickColor = useCallback(
    async (color: string) => {
      setApplying(true);
      try {
        await onAddHighlight(color, 0, text.length, text);
      } finally {
        setApplying(false);
        setSelected(false);
      }
    },
    [onAddHighlight, text]
  );

  const handleClearHighlights = useCallback(async () => {
    await onRemoveAllHighlights();
    setSelected(false);
  }, [onRemoveAllHighlights]);

  const toggleReadingMode = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    setReadingMode(prev => !prev);
  }, []);

  // Reading mode is independent per verse — toggled only by the Eye button,
  // so multiple verses can be in reading mode at the same time.

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
          style={{
            backgroundColor: h.color,
            color: readingMode ? '#000000' : undefined,
          }}
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
        ref={node => {
          containerRef.current = node;
          if (highlightRef) {
            (highlightRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        id={`verse-${verseNumber}`}
        className={cn(
          'group relative rounded-lg pl-2 pr-12 py-1.5 cursor-pointer select-none',
          !readingMode && 'transition-colors duration-200',
          !readingMode && isHighlighted && 'bg-primary/10 ring-1 ring-primary/30',
          !readingMode && isFocused && !isHighlighted && 'bg-primary/5',
          !readingMode && selected && !isHighlighted && 'bg-secondary'
        )}
        style={
          readingMode
            ? { backgroundColor: '#FFFFFF', color: '#000000' }
            : undefined
        }
        onClick={handleTap}
      >
        {hasNote && (
          <span
            aria-label="Versículo possui anotação"
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary"
          />
        )}

        {/* Reading-mode toggle — 44x44 hit area, always visible on mobile */}
        <button
          type="button"
          aria-label={readingMode ? 'Desativar modo de leitura' : 'Ativar modo de leitura'}
          aria-pressed={readingMode}
          onClick={toggleReadingMode}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-lg',
            'text-foreground/60 hover:text-foreground hover:bg-secondary active:scale-95'
          )}
          style={readingMode ? { color: '#000000' } : undefined}
        >
          {readingMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>

        <div
          ref={verseRef}
          className={cn(
            'leading-relaxed text-base sm:text-lg',
            !readingMode && 'text-foreground'
          )}
        >
          <sup
            className={cn(
              'mr-1.5 text-xs font-bold align-baseline',
              !readingMode && 'text-primary'
            )}
            style={readingMode ? { color: '#000000' } : undefined}
          >
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

export const BibleVerseCard = memo(BibleVerseCardImpl);
