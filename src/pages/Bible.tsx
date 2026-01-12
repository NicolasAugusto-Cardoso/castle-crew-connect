import { useState, useEffect } from 'react';
import { Book } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BibleVersionSelector } from '@/components/bible/BibleVersionSelector';
import { BibleBookList } from '@/components/bible/BibleBookList';
import { BibleChapterSelector } from '@/components/bible/BibleChapterSelector';
import { BibleVerseSelector } from '@/components/bible/BibleVerseSelector';
import { BibleVerseReader } from '@/components/bible/BibleVerseReader';
import { BibleSearch } from '@/components/bible/BibleSearch';
import { useBibleBooks, BibleBook, SearchResult } from '@/hooks/useBible';
import { BIBLE_BOOKS_FALLBACK } from '@/data/bibleBooks';

type NavigationState = 
  | { step: 'books' }
  | { step: 'chapters'; book: BibleBook }
  | { step: 'verses'; book: BibleBook; chapter: number }
  | { step: 'reading'; book: BibleBook; chapter: number; highlightVerse?: number };

const Bible = () => {
  const [version, setVersion] = useState('nvi');
  const [activeTab, setActiveTab] = useState<'navigate' | 'search'>('navigate');
  const [navState, setNavState] = useState<NavigationState>({ step: 'books' });
  
  const { data: books, isLoading: booksLoading } = useBibleBooks();

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
  };

  const handleSelectChapter = (chapter: number) => {
    if (navState.step === 'chapters') {
      // Go to verse selector instead of directly to reading
      setNavState({ step: 'verses', book: navState.book, chapter });
    }
  };

  const handleSelectVerse = (verse: number | null) => {
    if (navState.step === 'verses') {
      // Open reading with optional highlight
      setNavState({ 
        step: 'reading', 
        book: navState.book, 
        chapter: navState.chapter,
        highlightVerse: verse || undefined,
      });
    }
  };

  const handleBackToBooks = () => {
    setNavState({ step: 'books' });
  };

  const handleBackToChapters = () => {
    if (navState.step === 'reading' || navState.step === 'verses') {
      setNavState({ step: 'chapters', book: navState.book });
    }
  };

  const handleBackToVerses = () => {
    if (navState.step === 'reading') {
      setNavState({ step: 'verses', book: navState.book, chapter: navState.chapter });
    }
  };

  const handleChangeChapter = (chapter: number) => {
    if (navState.step === 'reading') {
      setNavState({ step: 'reading', book: navState.book, chapter });
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
                onBack={handleBackToVerses}
                onChangeChapter={handleChangeChapter}
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
                {navState.step === 'books' && (
                  <BibleBookList
                    books={books}
                    isLoading={booksLoading}
                    onSelectBook={handleSelectBook}
                  />
                )}

                {navState.step === 'chapters' && (
                  <BibleChapterSelector
                    book={navState.book}
                    onSelectChapter={handleSelectChapter}
                    onBack={handleBackToBooks}
                  />
                )}

                {navState.step === 'verses' && (
                  <BibleVerseSelector
                    book={navState.book}
                    chapter={navState.chapter}
                    version={version}
                    onSelectVerse={handleSelectVerse}
                    onBack={handleBackToChapters}
                  />
                )}
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