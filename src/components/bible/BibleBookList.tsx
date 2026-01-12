import { useState, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BibleBook, separateBooksByTestament } from '@/hooks/useBible';
import { cn } from '@/lib/utils';

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
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Testament Pills - Rounded */}
      <div className="flex gap-2 p-1 bg-secondary rounded-2xl">
        <button
          onClick={() => setTestament('old')}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
            testament === 'old'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary-foreground/5"
          )}
        >
          Antigo Testamento
        </button>
        <button
          onClick={() => setTestament('new')}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
            testament === 'new'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary-foreground/5"
          )}
        >
          Novo Testamento
        </button>
      </div>

      {/* Search Books - Single search field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar livro..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border rounded-xl"
        />
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1 pb-24">
        {filteredBooks.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">
            Nenhum livro encontrado
          </p>
        ) : (
          filteredBooks.map((book) => (
            <Button
              key={book.abbrev.pt}
              variant="outline"
              className="justify-between h-auto py-3 px-4 bg-card hover:bg-primary hover:text-primary-foreground transition-all group rounded-xl border-border"
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