import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { BibleBook, useBibleChapter } from '@/hooks/useBible';
import { cn } from '@/lib/utils';

interface BibleVerseSelectorProps {
  book: BibleBook;
  chapter: number;
  version: string;
  onSelectVerse: (verse: number | null) => void;
  onBack: () => void;
}

export const BibleVerseSelector = ({ 
  book, 
  chapter, 
  version,
  onSelectVerse,
  onBack,
}: BibleVerseSelectorProps) => {
  // Fetch chapter to know how many verses exist
  const { data, isLoading, error, refetch } = useBibleChapter(version, book.abbrev.pt, chapter);
  
  const verseCount = data?.verses.length || 0;
  const verses = Array.from({ length: verseCount }, (_, i) => i + 1);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="font-semibold text-lg">{book.name} {chapter}</h3>
            <p className="text-sm text-muted-foreground">Carregando versículos...</p>
          </div>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
          {[...Array(20)].map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
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
            Não foi possível carregar os versículos
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            {error.message}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={onBack} variant="outline">
              Voltar
            </Button>
            <Button onClick={() => refetch()} variant="default">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hover:bg-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="font-semibold text-lg">{book.name} {chapter}</h3>
          <p className="text-sm text-muted-foreground">
            {verseCount} versículo{verseCount > 1 ? 's' : ''} • Selecione para destacar
          </p>
        </div>
      </div>

      {/* Read full chapter button */}
      <Button 
        className="w-full gap-2" 
        size="lg"
        onClick={() => onSelectVerse(null)}
      >
        <BookOpen className="w-5 h-5" />
        Ler capítulo inteiro
      </Button>

      {/* Verse grid */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Ou escolha um versículo:</p>
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2 max-h-[350px] overflow-y-auto pr-1">
          {verses.map((verse) => (
            <Button
              key={verse}
              variant="outline"
              className={cn(
                "aspect-square p-0 text-sm font-medium",
                "bg-card hover:bg-primary hover:text-primary-foreground transition-all"
              )}
              onClick={() => onSelectVerse(verse)}
            >
              {verse}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};