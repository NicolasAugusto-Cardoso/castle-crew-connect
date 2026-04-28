import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Highlighter, BookOpen, Loader2 } from 'lucide-react';
import { useAllBibleNotes, useAllBibleHighlights, BibleNote, BibleHighlight } from '@/hooks/useBibleAnnotations';
import { BIBLE_BOOKS_FALLBACK } from '@/data/bibleBooks';
import { cn } from '@/lib/utils';

interface BibleSavedSectionProps {
  onNavigateToVerse: (bookAbbrev: string, chapter: number, verse: number) => void;
}

// Helper to get book name from abbreviation
function getBookName(abbrev: string): string {
  const book = BIBLE_BOOKS_FALLBACK.find(b => b.abbrev.pt === abbrev);
  return book?.name || abbrev;
}

// Note item component
function NoteItem({ note, onNavigate }: { note: BibleNote; onNavigate: () => void }) {
  const bookName = getBookName(note.book_abbrev);
  const preview = note.content_json.text?.slice(0, 60) || '';

  return (
    <button
      onClick={onNavigate}
      className="w-full text-left p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-border"
    >
      <div className="flex items-start gap-2">
        <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">
            {bookName} {note.chapter}:{note.verse}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {preview}...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {note.version.toUpperCase()}
          </p>
        </div>
      </div>
    </button>
  );
}

// Highlight item component
function HighlightItem({ highlight, onNavigate }: { highlight: BibleHighlight; onNavigate: () => void }) {
  const bookName = getBookName(highlight.book_abbrev);

  return (
    <button
      onClick={onNavigate}
      className="w-full text-left p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-border"
    >
      <div className="flex items-start gap-2">
        <span
          className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: highlight.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">
            {bookName} {highlight.chapter}:{highlight.verse}
          </p>
          {highlight.highlighted_text && (
            <p 
              className="text-xs mt-0.5 truncate px-1 rounded"
              style={{ backgroundColor: highlight.color + '40' }}
            >
              "{highlight.highlighted_text}"
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {highlight.version.toUpperCase()}
          </p>
        </div>
      </div>
    </button>
  );
}

export function BibleSavedSection({ onNavigateToVerse }: BibleSavedSectionProps) {
  const { data: notes = [], isLoading: notesLoading } = useAllBibleNotes();
  const { data: highlights = [], isLoading: highlightsLoading } = useAllBibleHighlights();

  const isLoading = notesLoading || highlightsLoading;
  const hasContent = notes.length > 0 || highlights.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="text-center py-8 px-4">
        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground text-sm">
          Suas anotações e grifos aparecerão aqui
        </p>
        <p className="text-muted-foreground/70 text-xs mt-1">
          Use o ícone de lápis em cada versículo para anotar ou grifar
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--neon-card))] rounded-xl border border-[hsl(var(--page-primary,var(--neon-white))/0.45)] shadow-[0_0_10px_-8px_hsl(var(--page-primary,var(--neon-white))/0.30)] overflow-hidden">
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="w-full grid grid-cols-2 gap-1 h-auto p-1">
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="w-4 h-4" />
            Anotações
            {notes.length > 0 && (
              <span className="text-xs bg-[hsl(var(--page-primary,var(--neon-white))/0.15)] text-[hsl(var(--page-primary,var(--neon-white)))] px-1.5 rounded-full">
                {notes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="highlights" className="gap-2">
            <Highlighter className="w-4 h-4" />
            Grifos
            {highlights.length > 0 && (
              <span className="text-xs bg-[hsl(var(--page-primary,var(--neon-white))/0.15)] text-[hsl(var(--page-primary,var(--neon-white)))] px-1.5 rounded-full">
                {highlights.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="m-0">
          <ScrollArea className="h-[200px]">
            <div className="p-3 space-y-2">
              {notes.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Nenhuma anotação ainda
                </p>
              ) : (
                notes.map(note => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onNavigate={() => onNavigateToVerse(note.book_abbrev, note.chapter, note.verse)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="highlights" className="m-0">
          <ScrollArea className="h-[200px]">
            <div className="p-3 space-y-2">
              {highlights.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Nenhum grifo ainda
                </p>
              ) : (
                highlights.map(highlight => (
                  <HighlightItem
                    key={highlight.id}
                    highlight={highlight}
                    onNavigate={() => onNavigateToVerse(highlight.book_abbrev, highlight.chapter, highlight.verse)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
