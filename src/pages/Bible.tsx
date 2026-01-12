import { useState, useEffect } from 'react';
import { Book } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BibleVersionSelector } from '@/components/bible/BibleVersionSelector';
import { BibleBookList } from '@/components/bible/BibleBookList';
import { BibleChapterSelector } from '@/components/bible/BibleChapterSelector';
import { BibleVerseReader } from '@/components/bible/BibleVerseReader';
import { BibleSearch } from '@/components/bible/BibleSearch';
import { useBibleBooks, BibleBook, SearchResult } from '@/hooks/useBible';
import { BIBLE_BOOKS_FALLBACK } from '@/data/bibleBooks';

type NavigationState = 
  | { step: 'books' }
  | { step: 'chapters'; book: BibleBook }
  | { step: 'reading'; book: BibleBook; chapter: number; highlightVerse?: number };

const Bible = () => {
  const [version, setVersion] = useState('nvi');
  const [activeTab, setActiveTab] = useState<'navigate' | 'search'>('navigate');
  const [navState, setNavState] = useState<NavigationState>({ step: 'books' });
  
  const { data: books, isLoading: booksLoading, error: booksError, refetch: refetchBooks } = useBibleBooks();

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

  return (
    <div className="container mx-auto px-4 py-4 space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#33C2FF] to-[#2367FF] border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 text-white">
              <Book className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-white">Bíblia</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <BibleVersionSelector value={version} onChange={setVersion} />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="bg-card shadow-xl">
        <CardContent className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'navigate' | 'search')}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary">
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

            <TabsContent value="navigate" className="mt-0">
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

              {navState.step === 'reading' && (
                <BibleVerseReader
                  book={navState.book}
                  chapter={navState.chapter}
                  version={version}
                  onBack={handleBackToChapters}
                  onChangeChapter={handleChangeChapter}
                  highlightVerse={navState.highlightVerse}
                />
              )}
            </TabsContent>

            <TabsContent value="search" className="mt-0">
              <BibleSearch
                version={version}
                onSelectResult={handleSearchResult}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bible;
