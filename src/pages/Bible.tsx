import { useState, useEffect } from 'react';
import { Book } from 'lucide-react';
import { BibleVersionSelector } from '@/components/bible/BibleVersionSelector';
import { BibleBookList } from '@/components/bible/BibleBookList';
import { BibleChapterSelector } from '@/components/bible/BibleChapterSelector';
import { BibleVerseReader } from '@/components/bible/BibleVerseReader';
import { BibleSavedSection } from '@/components/bible/BibleSavedSection';
import { BibleBook } from '@/hooks/useBible';
import { SectionHeading } from '@/components/ui/section-heading';
import {
  useBibleBooksLocal,
  usePrefetchChapterLocal,
  useBibleReadingPosition,
} from '@/hooks/useBibleData';
import { BIBLE_BOOKS_FALLBACK } from '@/data/bibleBooks';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

type NavigationState =
  | { step: 'books' }
  | { step: 'chapters'; book: BibleBook }
  | { step: 'reading'; book: BibleBook; chapter: number; highlightVerse?: number };

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

const Bible = () => {
  const { position, update } = useBibleReadingPosition();
  const [version, setVersion] = useState(position.version);
  const { user } = useAuth();

  const { data: books, isLoading: booksLoading } = useBibleBooksLocal();
  const { prefetchChapter } = usePrefetchChapterLocal();

  // Restore last reading position from localStorage on mount
  const [navState, setNavState] = useState<NavigationState>(() => {
    if (position.bookAbbrev && position.chapter) {
      const book = BIBLE_BOOKS_FALLBACK.find(b => b.abbrev.pt === position.bookAbbrev);
      if (book) {
        return {
          step: 'reading',
          book: {
            abbrev: book.abbrev,
            author: book.author,
            chapters: book.chapters,
            group: book.group,
            name: book.name,
            testament: book.testament,
          },
          chapter: position.chapter,
        };
      }
    }
    return { step: 'books' };
  });

  // Persist version + current reading position
  useEffect(() => {
    update({ version });
  }, [version, update]);

  useEffect(() => {
    if (navState.step === 'reading') {
      update({ bookAbbrev: navState.book.abbrev.pt, chapter: navState.chapter });
    }
  }, [navState, update]);

  // Scroll to highlighted verse when in reading mode
  useEffect(() => {
    if (navState.step === 'reading' && navState.highlightVerse) {
      setTimeout(() => {
        const element = document.getElementById(`verse-${navState.highlightVerse}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [navState]);

  const handleSelectBook = (book: BibleBook) => {
    setNavState({ step: 'chapters', book });
    // Prefetch first chapters for instant reading
    const max = Math.min(book.chapters, 3);
    for (let i = 1; i <= max; i++) prefetchChapter(version, book.abbrev.pt, i);
  };

  const handleSelectChapter = (chapter: number) => {
    if (navState.step === 'chapters') {
      // Go directly to reading - no intermediate step!
      setNavState({ step: 'reading', book: navState.book, chapter });
    }
  };

  const handleBackToBooks = () => {
    setNavState({ step: 'books' });
  };

  const handleBackToChapters = () => {
    if (navState.step === 'reading') {
      setNavState({ step: 'chapters', book: navState.book });
    }
  };

  const handleChangeChapter = (chapter: number) => {
    if (navState.step === 'reading') {
      setNavState({ step: 'reading', book: navState.book, chapter });
    }
  };

  const handleGoToVerse = (verse: number) => {
    if (navState.step === 'reading') {
      setNavState({ 
        step: 'reading', 
        book: navState.book, 
        chapter: navState.chapter,
        highlightVerse: verse,
      });
    }
  };

  const handleGoToSearch = () => {
    setNavState({ step: 'books' });
  };

  // Navigate to a verse from saved section
  const handleNavigateToVerse = (bookAbbrev: string, chapter: number, verse: number) => {
    // Find book from fallback data
    const book = BIBLE_BOOKS_FALLBACK.find(b => b.abbrev.pt === bookAbbrev);
    if (!book) return;

    // Convert to BibleBook format
    const bibleBook: BibleBook = {
      abbrev: book.abbrev,
      author: book.author,
      chapters: book.chapters,
      group: book.group,
      name: book.name,
      testament: book.testament,
    };

    setNavState({
      step: 'reading',
      book: bibleBook,
      chapter,
      highlightVerse: verse,
    });
  };

  // Check if we're in fullscreen reading mode
  const isReading = navState.step === 'reading';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      {/* Header — Tema branco unificado */}
      {!isReading && (
        <div className="bg-background border-b border-[hsl(var(--neon-white)/0.30)] px-4 py-4 sm:px-6">
          <div className="container mx-auto">
            <div className="mb-4">
              <SectionHeading
                as="h1"
                colorTheme="white"
                icon={<Book className="w-6 h-6" />}
              >
                Bíblia
              </SectionHeading>
            </div>
            {/* Version selector */}
            <div className="bg-[hsl(var(--neon-card))] rounded-xl p-3 border border-[hsl(var(--neon-white)/0.45)] shadow-[0_0_10px_-8px_hsl(var(--neon-white)/0.30)]">
              <BibleVersionSelector value={version} onChange={setVersion} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-0 ${isReading ? '' : 'container mx-auto'}`}>
        {isReading ? (
          // Fullscreen reading view
          <div className="flex-1 flex flex-col min-h-0 bg-background">
            <div className="flex-1 overflow-hidden px-4 py-4 sm:px-6">
              <BibleVerseReader
                book={navState.book}
                chapter={navState.chapter}
                version={version}
                onBack={handleBackToChapters}
                onChangeChapter={handleChangeChapter}
                onGoToVerse={handleGoToVerse}
                highlightVerse={navState.highlightVerse}
                onGoToSearch={handleGoToSearch}
              />
            </div>
          </div>
        ) : (
          // Navigation view - no tabs, direct book list
          <div className="flex-1 flex flex-col min-h-0 px-4 py-4 sm:px-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {navState.step === 'books' && (
                <motion.div
                  key="books"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={pageTransition}
                  className="flex-1"
                >
                  {/* Saved Section - only show if user is logged in */}
                  {user && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-3 text-neon-white">Salvos</h2>
                      <BibleSavedSection onNavigateToVerse={handleNavigateToVerse} />
                    </div>
                  )}

                  <h2 className="text-lg font-semibold mb-3 text-neon-red">Navegar</h2>
                  <BibleBookList
                    books={books}
                    isLoading={booksLoading}
                    onSelectBook={handleSelectBook}
                  />
                </motion.div>
              )}

              {navState.step === 'chapters' && (
                <motion.div
                  key="chapters"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={pageTransition}
                >
                  <BibleChapterSelector
                    book={navState.book}
                    version={version}
                    onSelectChapter={handleSelectChapter}
                    onBack={handleBackToBooks}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bible;
