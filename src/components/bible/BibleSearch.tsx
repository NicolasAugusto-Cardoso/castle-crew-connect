import { useState } from 'react';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useBibleSearch, SearchResult } from '@/hooks/useBible';

interface BibleSearchProps {
  version: string;
  onSelectResult: (result: SearchResult) => void;
}

export const BibleSearch = ({ version, onSelectResult }: BibleSearchProps) => {
  const [query, setQuery] = useState('');
  const { data, isLoading, error, isFetching } = useBibleSearch(version, query);

  const showLoading = (isLoading || isFetching) && query.length >= 3;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar na Bíblia... (mínimo 3 caracteres)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 bg-card border-border"
        />
        {showLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {query.length > 0 && query.length < 3 && (
          <p className="text-center text-muted-foreground py-4 text-sm">
            Digite pelo menos 3 caracteres para pesquisar
          </p>
        )}

        {error && (
          <div className="text-center py-6">
            <p className="text-destructive">{error.message}</p>
          </div>
        )}

        {data && data.verses.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum resultado encontrado
          </p>
        )}

        {data && data.occurrence > 0 && (
          <p className="text-sm text-muted-foreground mb-3">
            {data.occurrence} resultado{data.occurrence > 1 ? 's' : ''} encontrado{data.occurrence > 1 ? 's' : ''}
          </p>
        )}

        {data?.verses.map((result, index) => (
          <button
            key={`${result.book.abbrev.pt}-${result.chapter}-${result.number}-${index}`}
            onClick={() => onSelectResult(result)}
            className="w-full text-left p-4 rounded-lg bg-card hover:bg-secondary transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary">
                  {result.book.name} {result.chapter}:{result.number}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {result.text}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
