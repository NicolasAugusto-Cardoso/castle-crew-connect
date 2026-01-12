import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Check, Share2 } from 'lucide-react';
import { BibleBook, BibleChapter, useBibleChapter } from '@/hooks/useBible';
import { toast } from 'sonner';

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
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-3">
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
          <Button onClick={() => refetch()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">
              {book.name} {chapter}
            </h3>
            {data?.source === 'cache' && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                💾 cache
              </span>
            )}
          </div>
        </div>
        
        {/* Chapter Navigation */}
        <div className="flex items-center gap-1">
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

      {/* Verses */}
      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
        {data?.verses.map((verse) => (
          <div
            key={verse.number}
            id={`verse-${verse.number}`}
            className={`group p-3 rounded-lg transition-all ${
              highlightVerse === verse.number
                ? 'bg-primary/20 ring-2 ring-primary'
                : 'bg-card hover:bg-secondary'
            }`}
          >
            <div className="flex gap-3">
              <span className="text-primary font-bold text-sm flex-shrink-0 w-8">
                {verse.number}
              </span>
              <p className="text-foreground leading-relaxed flex-1">
                {verse.text}
              </p>
            </div>
            
            {/* Actions */}
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
        ))}
      </div>
    </div>
  );
};
