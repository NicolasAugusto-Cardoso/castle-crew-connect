import { useState, useEffect } from 'react';
import { Book } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BibleVersionSelector } from '@/components/bible/BibleVersionSelector';
import { BibleBookList } from '@/components/bible/BibleBookList';
import { BibleChapterSelector } from '@/components/bible/BibleChapterSelector';
import { BibleVerseReader } from '@/components/bible/BibleVerseReader';
import { BibleSearch } from '@/components/bible/BibleSearch';
import { useBibleBooks, BibleBook, SearchResult, usePrefetchChapter } from '@/hooks/useBible';
import { BIBLE_BOOKS_FALLBACK } from '@/data/bibleBooks';
import { motion, AnimatePresence } from 'framer-motion';

// Simplified navigation: books -> chapters -> reading (no intermediate verse selector)
type NavigationState = 
  | { step: 'books' }
  | { step: 'chapters'; book: BibleBook }
  | { step: 'reading'; book: BibleBook; chapter: number; highlightVerse?: number };

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

const Bible = () => {
  const [version, setVersion] = useState('nvi');
  const [activeTab, setActiveTab] = useState<'navigate' | 'search'>('navigate');
  const [navState, setNavState] = useState<NavigationState>({ step: 'books' });
  
  const { data: books, isLoading: booksLoading } = useBibleBooks();
  const { prefetchFirstChapters } = usePrefetchChapter();

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
    // Prefetch first chapters when book is selected
    prefetchFirstChapters(version, book.abbrev.pt, Math.min(book.chapters, 3));
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

  const handleSearchResult = (result: SearchResult) => {
    // Find the book from our list or fallback
    const booksList = books || BIBLE_BOOKS_FALLBACK.map(b => ({
      ...b,
      testament: b.testament,
    }));
    const book = booksList.find(b => b.abbrev.pt === result.book.abbrev.pt);
    if (book) {
      setActiveTab('navigate');
      setNavState({ 
        step: 'reading', 
        book: book as BibleBook, 
        chapter: result.chapter, 
        highlightVerse: result.number 
      });
    }
  };

  // Check if we're in fullscreen reading mode
  const isReading = navState.step === 'reading';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      {/* Compact Header - only show when not reading */}
      {!isReading && (
        <div className="bg-gradient-to-r from-[#33C2FF] to-[#2367FF] px-4 py-4 sm:px-6">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-white/20 text-white">
                <Book className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Bíblia</h1>
            </div>
            <BibleVersionSelector value={version} onChange={setVersion} />
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
              />
            </div>
          </div>
        ) : (
          // Navigation/Search view
          <div className="flex-1 flex flex-col min-h-0 px-4 py-4 sm:px-6">
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as 'navigate' | 'search')}
              className="flex flex-col flex-1 min-h-0"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-secondary flex-shrink-0">
                <TabsTrigger 
                  value="navigate"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Navegar
                </TabsTrigger>
                <TabsTrigger 
                  value="search"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Pesquisar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="navigate" className="flex-1 overflow-auto mt-0">
                <AnimatePresence mode="wait">
                  {navState.step === 'books' && (
                    <motion.div
                      key="books"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={pageTransition}
                    >
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
              </TabsContent>

              <TabsContent value="search" className="flex-1 overflow-auto mt-0">
                <BibleSearch
                  version={version}
                  onSelectResult={handleSearchResult}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bible;
