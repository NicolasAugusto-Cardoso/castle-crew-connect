import { useState, useCallback, useRef, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Copy, Check, Share2, Pencil, Eye, EyeOff, FileText, Highlighter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BibleHighlight } from '@/hooks/useBibleAnnotations';
import { BibleHighlightPopover, HIGHLIGHT_COLORS } from './BibleHighlightPopover';
import { toast } from 'sonner';

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
  onAddHighlight: (color: string, startOffset: number, endOffset: number, selectedText: string) => Promise<void>;
  onRemoveHighlight: (highlightId: string) => Promise<void>;
  onRemoveAllHighlights: () => Promise<void>;
  copiedVerse?: number | null;
  highlightRef?: React.RefObject<HTMLDivElement>;
}

export function BibleVerseCard({
  verseNumber,
  text,
  bookName,
  chapter,
  isHighlighted,
  isFocused,
  hasNote,
  highlights = [],
  onCopy,
  onShare,
  onOpenNote,
  onToggleFocus,
  onAddHighlight,
  onRemoveHighlight,
  onRemoveAllHighlights,
  copiedVerse,
  highlightRef,
}: BibleVerseCardProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number; text: string } | null>(null);
  const [highlightPopoverPosition, setHighlightPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAddingHighlight, setIsAddingHighlight] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Handle double tap/click for focus mode
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      onToggleFocus();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onToggleFocus]);

  // Handle text selection for highlighting
  const handleTextSelection = useCallback(() => {
    if (!highlightMode) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !textRef.current) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (!selectedText || selectedText.length === 0) return;

    // Calculate offsets relative to the text content
    const textContent = text;
    const startOffset = textContent.indexOf(selectedText);
    const endOffset = startOffset + selectedText.length;

    if (startOffset === -1) return;

    // Get position for popover
    const rect = range.getBoundingClientRect();
    setHighlightPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10,
    });

    setSelectedRange({ start: startOffset, end: endOffset, text: selectedText });
  }, [highlightMode, text]);

  // Apply highlight
  const handleApplyHighlight = async (color: string) => {
    if (!selectedRange) return;

    setIsAddingHighlight(true);
    try {
      await onAddHighlight(color, selectedRange.start, selectedRange.end, selectedRange.text);
      toast.success('Grifo aplicado!');
    } catch (error) {
      toast.error('Erro ao aplicar grifo');
    } finally {
      setIsAddingHighlight(false);
      setSelectedRange(null);
      setHighlightPopoverPosition(null);
      setHighlightMode(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  // Render text with highlights
  const renderHighlightedText = () => {
    if (highlights.length === 0) return text;

    // Sort highlights by start offset
    const sortedHighlights = [...highlights].sort((a, b) => a.start_offset - b.start_offset);
    
    const result: React.ReactNode[] = [];
    let lastEnd = 0;

    sortedHighlights.forEach((highlight, index) => {
      // Validate offsets
      if (highlight.start_offset < 0 || highlight.end_offset > text.length || highlight.start_offset >= highlight.end_offset) {
        return;
      }

      // Add text before this highlight
      if (highlight.start_offset > lastEnd) {
        result.push(
          <Fragment key={`text-${index}`}>
            {text.slice(lastEnd, highlight.start_offset)}
          </Fragment>
        );
      }

      // Add highlighted text with click to remove
      const highlightedPart = text.slice(highlight.start_offset, highlight.end_offset);
      result.push(
        <span
          key={`highlight-${highlight.id}`}
          className="px-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: highlight.color }}
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Remover este grifo?')) {
              onRemoveHighlight(highlight.id);
            }
          }}
          title="Clique para remover"
        >
          {highlightedPart}
        </span>
      );

      lastEnd = highlight.end_offset;
    });

    // Add remaining text
    if (lastEnd < text.length) {
      result.push(
        <Fragment key="text-end">
          {text.slice(lastEnd)}
        </Fragment>
      );
    }

    return result;
  };

  return (
    <div
      ref={highlightRef}
      id={`verse-${verseNumber}`}
      className={cn(
        "group p-4 rounded-xl transition-all duration-300 relative",
        isHighlighted
          ? "bg-primary/10 ring-2 ring-primary/50"
          : isFocused
          ? "bg-primary text-primary-foreground"
          : "hover:bg-secondary/50",
        highlightMode && "ring-2 ring-yellow-400/50"
      )}
      onClick={handleDoubleTap}
      onMouseUp={handleTextSelection}
      onTouchEnd={handleTextSelection}
    >
      {/* Note indicator */}
      {hasNote && (
        <div className="absolute top-2 right-2">
          <span
            className="w-2.5 h-2.5 bg-primary rounded-full block cursor-pointer animate-pulse"
            onClick={(e) => {
              e.stopPropagation();
              onOpenNote();
            }}
            title="Ver anotação"
          />
        </div>
      )}

      {/* Highlight mode indicator */}
      {highlightMode && (
        <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
          <Highlighter className="w-3 h-3" />
          <span>Selecione o texto</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHighlightMode(false);
            }}
            className="ml-1 hover:text-yellow-800"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <span className={cn(
          "font-bold text-base flex-shrink-0 w-8 text-right",
          isFocused ? "text-primary-foreground" : "text-primary"
        )}>
          {verseNumber}
        </span>
        <p
          ref={textRef}
          className={cn(
            "leading-relaxed text-base sm:text-lg flex-1",
            isFocused ? "text-primary-foreground" : "text-foreground",
            highlightMode && "select-text cursor-text"
          )}
        >
          {renderHighlightedText()}
        </p>
      </div>

      {/* Actions on hover/tap */}
      <div className={cn(
        "flex justify-end gap-1 mt-2 transition-opacity",
        "opacity-0 group-hover:opacity-100",
        (actionsOpen || highlightMode) && "opacity-100"
      )}>
        {/* Copy */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 rounded-lg",
            isFocused ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
        >
          {copiedVerse === verseNumber ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 rounded-lg",
            isFocused ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
        >
          <Share2 className="w-4 h-4" />
        </Button>

        {/* Focus mode toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 rounded-lg",
            isFocused ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFocus();
          }}
          title={isFocused ? "Desativar destaque" : "Ativar destaque"}
        >
          {isFocused ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>

        {/* Actions menu (note + highlight) */}
        <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 rounded-lg",
                isFocused ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9"
                onClick={() => {
                  setActionsOpen(false);
                  onOpenNote();
                }}
              >
                <FileText className="w-4 h-4" />
                {hasNote ? 'Ver/Editar Anotação' : 'Anotar'}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9"
                onClick={() => {
                  setActionsOpen(false);
                  setHighlightMode(true);
                }}
              >
                <Highlighter className="w-4 h-4" />
                Grifar
              </Button>
              {highlights.length > 0 && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-9 text-destructive hover:text-destructive"
                  onClick={() => {
                    setActionsOpen(false);
                    if (confirm('Remover todos os grifos deste versículo?')) {
                      onRemoveAllHighlights();
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                  Limpar grifos
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Highlight color selection popover */}
      {selectedRange && highlightPopoverPosition && (
        <BibleHighlightPopover
          selectedText={selectedRange.text}
          onApply={handleApplyHighlight}
          onClose={() => {
            setSelectedRange(null);
            setHighlightPopoverPosition(null);
          }}
          isApplying={isAddingHighlight}
          position={highlightPopoverPosition}
        />
      )}
    </div>
  );
}
