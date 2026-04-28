import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { BibleBook } from '@/hooks/useBible';
import { useBibleChapterLocal, usePrefetchChapterLocal } from '@/hooks/useBibleData';
import { useBibleNotes, useBibleHighlights, useBibleFocusMarks } from '@/hooks/useBibleAnnotations';
import { BibleVerseCard } from './BibleVerseCard';
import { BibleNoteDialog } from './BibleNoteDialog';
import { toast } from 'sonner';

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
  const { data, isLoading, isFetching, error, refetch } = useBibleChapterLocal(version, book.abbrev.pt, chapter);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const { prefetchChapter } = usePrefetchChapterLocal();

  // Annotations hooks
  const { notes, getNote, upsertNote, deleteNote, isUpserting, isDeleting } = useBibleNotes(version, book.abbrev.pt, chapter);
  const { highlights, getHighlights, addHighlight, removeHighlight, removeHighlightsForVerse, isAdding } = useBibleHighlights(version, book.abbrev.pt, chapter);
  const { focusMarks, hasFocusMark, toggleFocusMark, isToggling } = useBibleFocusMarks(version, book.abbrev.pt, chapter);

  // Note dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedVerseForNote, setSelectedVerseForNote] = useState<number | null>(null);

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

  const handleCopyVerse = useCallback(
    async (verseNumber: number, text: string) => {
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
    },
    [book.name, chapter]
  );

  const handleShareVerse = useCallback(
    async (verseNumber: number, text: string) => {
      const reference = `${book.name} ${chapter}:${verseNumber}`;
      const fullText = `"${text}" - ${reference}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: reference, text: fullText });
        } catch {
          /* user cancelled */
        }
      } else {
        handleCopyVerse(verseNumber, text);
      }
    },
    [book.name, chapter, handleCopyVerse]
  );

  const handleOpenNote = useCallback((verseNumber: number) => {
    setSelectedVerseForNote(verseNumber);
    setNoteDialogOpen(true);
  }, []);

  const handleSaveNote = async (
    contentJson: { text: string; formatting?: { bold?: boolean; underline?: boolean } },
    textColor?: string,
    bgColor?: string
  ) => {
    if (selectedVerseForNote === null) return;

    await upsertNote({
      version,
      bookAbbrev: book.abbrev.pt,
      chapter,
      verse: selectedVerseForNote,
      content_json: contentJson,
      text_color: textColor,
      background_color: bgColor,
    });
  };

  const handleDeleteNote = async () => {
    if (selectedVerseForNote === null) return;
    const note = getNote(selectedVerseForNote);
    if (note) {
      await deleteNote(note.id);
    }
  };

  const handleToggleFocus = useCallback(
    async (verseNumber: number) => {
      try {
        const result = await toggleFocusMark({
          version,
          bookAbbrev: book.abbrev.pt,
          chapter,
          verse: verseNumber,
        });
        toast.success(result.action === 'added' ? 'Destaque ativado' : 'Destaque removido');
      } catch {
        toast.error('Erro ao alternar destaque');
      }
    },
    [toggleFocusMark, version, book.abbrev.pt, chapter]
  );

  const handleAddHighlight = useCallback(
    async (
      verseNumber: number,
      color: string,
      startOffset: number,
      endOffset: number,
      selectedText: string
    ) => {
      await addHighlight({
        version,
        bookAbbrev: book.abbrev.pt,
        chapter,
        verse: verseNumber,
        color,
        start_offset: startOffset,
        end_offset: endOffset,
        highlighted_text: selectedText,
      });
    },
    [addHighlight, version, book.abbrev.pt, chapter]
  );

  const handleRemoveHighlightsForVerse = useCallback(
    async (verseNumber: number) => {
      try {
        await removeHighlightsForVerse({
          version,
          bookAbbrev: book.abbrev.pt,
          chapter,
          verse: verseNumber,
        });
        toast.success('Grifos removidos');
      } catch {
        toast.error('Erro ao remover grifos');
      }
    },
    [removeHighlightsForVerse, version, book.abbrev.pt, chapter]
  );

  const hasPrevChapter = chapter > 1;
  const hasNextChapter = chapter < book.chapters;

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

  const selectedNote = selectedVerseForNote !== null ? getNote(selectedVerseForNote) : undefined;

  return (
    <div className="flex flex-col">
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
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Search/Navigate button - opens book navigation */}
          {onGoToSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-secondary rounded-xl"
              onClick={onGoToSearch}
            >
              <Search className="w-5 h-5" />
            </Button>
          )}

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

      {/* Verses — flow naturally; global <main> handles scrolling */}
      <div className="pt-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
        {/* Show loading state only on first load (no data yet) */}
        {isLoading && !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {data?.verses.map((verse) => {
              const isHighlighted = highlightVerse === verse.number;
              const isFocused = hasFocusMark(verse.number);
              const verseNote = getNote(verse.number);
              const verseHighlights = getHighlights(verse.number);
              
              return (
                <BibleVerseCard
                  key={verse.number}
                  verseNumber={verse.number}
                  text={verse.text}
                  bookName={book.name}
                  chapter={chapter}
                  isHighlighted={isHighlighted}
                  isFocused={isFocused}
                  hasNote={!!verseNote}
                  highlights={verseHighlights}
                  onCopy={() => handleCopyVerse(verse.number, verse.text)}
                  onShare={() => handleShareVerse(verse.number, verse.text)}
                  onOpenNote={() => handleOpenNote(verse.number)}
                  onToggleFocus={() => handleToggleFocus(verse.number)}
                  onAddHighlight={(color, start, end, text) => handleAddHighlight(verse.number, color, start, end, text)}
                  onRemoveHighlight={removeHighlight}
                  onRemoveAllHighlights={() => handleRemoveHighlightsForVerse(verse.number)}
                  copiedVerse={copiedVerse}
                  highlightRef={isHighlighted ? highlightRef : undefined}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Note Dialog */}
      <BibleNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        bookName={book.name}
        chapter={chapter}
        verse={selectedVerseForNote || 1}
        existingNote={selectedNote}
        onSave={handleSaveNote}
        onDelete={selectedNote ? handleDeleteNote : undefined}
        isSaving={isUpserting}
        isDeleting={isDeleting}
      />
    </div>
  );
};
