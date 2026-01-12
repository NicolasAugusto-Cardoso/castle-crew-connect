import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Check, Share2, Search, Hash, Loader2 } from 'lucide-react';
import { BibleBook, useBibleChapter, usePrefetchChapter } from '@/hooks/useBible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BibleVerseReaderProps {
  book: BibleBook;
  chapter: number;
  version: string;
  onBack: () => void;
  onChangeChapter: (chapter: number) => void;
  onGoToVerse?: (verse: number) => void;
  highlightVerse?: number;
  onGoToSearch?: () => void;
}

export const BibleVerseReader = ({ 
  book, 
  chapter, 
  version, 
  onBack, 
  onChangeChapter,
  onGoToVerse,
  highlightVerse,
  onGoToSearch,
}: BibleVerseReaderProps) => {
  const { data, isLoading, isFetching, error, refetch } = useBibleChapter(version, book.abbrev.pt, chapter);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
  const [versePopoverOpen, setVersePopoverOpen] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);
  const { prefetchChapter } = usePrefetchChapter();

  // Prefetch adjacent chapters
  useEffect(() => {
    if (chapter > 1) {
      prefetchChapter(version, book.abbrev.pt, chapter - 1);
    }
    if (chapter < book.chapters) {
      prefetchChapter(version, book.abbrev.pt, chapter + 1);
    }
  }, [chapter, version, book, prefetchChapter]);

  // Scroll to highlighted verse after render
  useEffect(() => {
    if (highlightVerse && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [highlightVerse, data]);

  const handleCopyVerse = async (verseNumber: number, text: string) => {
    const reference = `${book.name} ${chapter}:${verseNumber}`;
    const fullText = `"${text}" - ${reference}`;
    
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedVerse(verseNumber);
      toast.success('Versículo copiado!');
      setTimeout(() => setCopiedVerse(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleShareVerse = async (verseNumber: number, text: string) => {
    const reference = `${book.name} ${chapter}:${verseNumber}`;
    const fullText = `"${text}" - ${reference}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: reference,
          text: fullText,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyVerse(verseNumber, text);
    }
  };

  const handleSelectVerse = (verse: number) => {
    setVersePopoverOpen(false);
    if (onGoToVerse) {
      onGoToVerse(verse);
    }
    // Scroll to verse
    setTimeout(() => {
      const element = document.getElementById(`verse-${verse}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const hasPrevChapter = chapter > 1;
  const hasNextChapter = chapter < book.chapters;
  const verseCount = data?.verses.length || 0;

  // Error state
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-destructive/10 rounded-lg p-6 max-w-md">
          <p className="text-destructive font-medium mb-2">
            Não foi possível carregar este capítulo
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            {error.message.includes('Muitas requisições') 
              ? 'Muitas buscas em pouco tempo. Aguarde um momento.'
              : 'A API está temporariamente indisponível. Tente novamente.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={onBack} variant="outline">
              Voltar
            </Button>
            <Button onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky Header - Clean white with subtle border */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-secondary flex-shrink-0 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-lg truncate text-foreground">
              {book.name} {chapter}
            </h3>
            {/* Loading indicator - small and discrete */}
            {(isLoading || isFetching) && (
              <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
            )}
            {data?.source === 'cache' && !isFetching && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                💾
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Search/Navigate button - opens book navigation */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary rounded-xl"
            onClick={onGoToSearch}
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Go to verse popover */}
          <Popover open={versePopoverOpen} onOpenChange={setVersePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-secondary rounded-xl"
                disabled={!data}
              >
                <Hash className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 rounded-xl" align="end">
              <p className="text-sm font-medium mb-2 text-muted-foreground">
                Ir para versículo
              </p>
              <ScrollArea className="max-h-48">
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: verseCount }, (_, i) => i + 1).map((verse) => (
                    <Button
                      key={verse}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 text-xs font-medium rounded-lg",
                        highlightVerse === verse && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleSelectVerse(verse)}
                    >
                      {verse}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Chapter Navigation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChangeChapter(chapter - 1)}
            disabled={!hasPrevChapter}
            className="hover:bg-secondary rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChangeChapter(chapter + 1)}
            disabled={!hasNextChapter}
            className="hover:bg-secondary rounded-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Fullscreen Verses - Scrollable area */}
      <div className="flex-1 overflow-y-auto pt-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
        {/* Show loading state only on first load (no data yet) */}
        {isLoading && !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {data?.verses.map((verse) => {
              const isHighlighted = highlightVerse === verse.number;
              
              return (
                <div
                  key={verse.number}
                  ref={isHighlighted ? highlightRef : undefined}
                  id={`verse-${verse.number}`}
                  className={cn(
                    "group p-4 rounded-xl transition-all duration-300",
                    isHighlighted
                      ? "bg-primary/10 ring-2 ring-primary/50"
                      : "hover:bg-secondary/50"
                  )}
                >
                  <div className="flex gap-3">
                    <span className="text-primary font-bold text-base flex-shrink-0 w-8 text-right">
                      {verse.number}
                    </span>
                    <p className="text-foreground leading-relaxed text-base sm:text-lg flex-1">
                      {verse.text}
                    </p>
                  </div>
                  
                  {/* Actions on hover/tap */}
                  <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground rounded-lg"
                      onClick={() => handleCopyVerse(verse.number, verse.text)}
                    >
                      {copiedVerse === verse.number ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground rounded-lg"
                      onClick={() => handleShareVerse(verse.number, verse.text)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
