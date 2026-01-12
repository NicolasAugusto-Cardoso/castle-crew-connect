import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Check, Share2 } from 'lucide-react';
import { BibleBook, useBibleChapter } from '@/hooks/useBible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BibleVerseReaderProps {
  book: BibleBook;
  chapter: number;
  version: string;
  onBack: () => void;
  onChangeChapter: (chapter: number) => void;
  highlightVerse?: number;
}

export const BibleVerseReader = ({ 
  book, 
  chapter, 
  version, 
  onBack, 
  onChangeChapter,
  highlightVerse 
}: BibleVerseReaderProps) => {
  const { data, isLoading, error, refetch } = useBibleChapter(version, book.abbrev.pt, chapter);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

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

  const hasPrevChapter = chapter > 1;
  const hasNextChapter = chapter < book.chapters;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-3 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="flex-1 space-y-3 pt-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
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
      {/* Sticky Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-secondary flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {book.name} {chapter}
            </h3>
            {data?.source === 'cache' && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex-shrink-0">
                💾
              </span>
            )}
          </div>
        </div>
        
        {/* Chapter Navigation */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChangeChapter(chapter - 1)}
            disabled={!hasPrevChapter}
            className="hover:bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChangeChapter(chapter + 1)}
            disabled={!hasNextChapter}
            className="hover:bg-secondary"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Fullscreen Verses - Scrollable area */}
      <div className="flex-1 overflow-y-auto pt-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="space-y-4 pb-8">
          {data?.verses.map((verse) => {
            const isHighlighted = highlightVerse === verse.number;
            
            return (
              <div
                key={verse.number}
                ref={isHighlighted ? highlightRef : undefined}
                id={`verse-${verse.number}`}
                className={cn(
                  "group p-4 rounded-lg transition-all",
                  isHighlighted
                    ? "bg-primary/15 ring-2 ring-primary animate-pulse"
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
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
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
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => handleShareVerse(verse.number, verse.text)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};