import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BibleBook, usePrefetchChapter } from '@/hooks/useBible';

interface BibleChapterSelectorProps {
  book: BibleBook;
  version: string;
  onSelectChapter: (chapter: number) => void;
  onBack: () => void;
}

export const BibleChapterSelector = ({ 
  book, 
  version,
  onSelectChapter, 
  onBack 
}: BibleChapterSelectorProps) => {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const { prefetchChapter } = usePrefetchChapter();

  // Prefetch on hover (desktop) or pointer down (mobile)
  const handlePrefetch = (chapter: number) => {
    prefetchChapter(version, book.abbrev.pt, chapter);
  };

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
          <h3 className="font-semibold text-lg">{book.name}</h3>
          <p className="text-sm text-muted-foreground">
            {book.chapters} capítulo{book.chapters > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2 max-h-[400px] overflow-y-auto pr-1">
        {chapters.map((chapter) => (
          <Button
            key={chapter}
            variant="outline"
            className="aspect-square p-0 text-sm font-medium bg-card hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={() => onSelectChapter(chapter)}
            onMouseEnter={() => handlePrefetch(chapter)}
            onPointerDown={() => handlePrefetch(chapter)}
          >
            {chapter}
          </Button>
        ))}
      </div>
    </div>
  );
};
