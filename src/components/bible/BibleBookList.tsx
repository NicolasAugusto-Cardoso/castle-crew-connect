import { useState, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BibleBook, separateBooksByTestament } from '@/hooks/useBible';

interface BibleBookListProps {
  books: BibleBook[] | undefined;
  isLoading: boolean;
  onSelectBook: (book: BibleBook) => void;
}

export const BibleBookList = ({ books, isLoading, onSelectBook }: BibleBookListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [testament, setTestament] = useState<'old' | 'new'>('old');

  const { oldTestament, newTestament } = useMemo(() => {
    if (!books) return { oldTestament: [], newTestament: [] };
    return separateBooksByTestament(books);
  }, [books]);

  const filteredBooks = useMemo(() => {
    const currentBooks = testament === 'old' ? oldTestament : newTestament;
    if (!searchQuery.trim()) return currentBooks;
    
    const query = searchQuery.toLowerCase();
    return currentBooks.filter(
      book => book.name.toLowerCase().includes(query) || 
              book.abbrev.pt.toLowerCase().includes(query)
    );
  }, [testament, oldTestament, newTestament, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Testament Tabs */}
      <Tabs value={testament} onValueChange={(v) => setTestament(v as 'old' | 'new')}>
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="old" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Antigo Testamento
          </TabsTrigger>
          <TabsTrigger value="new" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Novo Testamento
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Books */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar livro..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
        {filteredBooks.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">
            Nenhum livro encontrado
          </p>
        ) : (
          filteredBooks.map((book) => (
            <Button
              key={book.abbrev.pt}
              variant="outline"
              className="justify-between h-auto py-3 px-4 bg-card hover:bg-primary hover:text-primary-foreground transition-all group"
              onClick={() => onSelectBook(book)}
            >
              <span className="text-left truncate">{book.name}</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Button>
          ))
        )}
      </div>
    </div>
  );
};
