import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { BIBLE_BOOKS_FALLBACK, BibleBookFallback } from '@/data/bibleBooks';
import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = 'https://www.abibliadigital.com.br/api';

export interface BibleBook {
  abbrev: {
    pt: string;
    en: string;
  };
  author: string;
  chapters: number;
  group: string;
  name: string;
  testament: string;
}

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  book: {
    abbrev: {
      pt: string;
      en: string;
    };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: {
    number: number;
    verses: number;
  };
  verses: BibleVerse[];
  source?: 'abibliadigital' | 'backup_api' | 'cache';
}

export interface SearchResult {
  book: {
    abbrev: {
      pt: string;
      en: string;
    };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: number;
  number: number;
  text: string;
}

export interface SearchResponse {
  occurrence: number;
  version: string;
  verses: SearchResult[];
}

export const BIBLE_VERSIONS = [
  { value: 'nvi', label: 'NVI - Nova Versão Internacional' },
  { value: 'ara', label: 'ARA - Almeida Revista e Atualizada' },
  { value: 'acf', label: 'ACF - Almeida Corrigida Fiel' },
  { value: 'kjv', label: 'KJV - King James Version' },
  { value: 'bbe', label: 'BBE - Bible in Basic English' },
  { value: 'rvr', label: 'RVR - Reina Valera' },
  { value: 'apee', label: 'APEE - Almeida Padrão Evangélico' },
];

// Convert fallback data to API format
function convertFallbackToApiFormat(fallback: BibleBookFallback[]): BibleBook[] {
  return fallback.map(book => ({
    abbrev: book.abbrev,
    author: book.author,
    chapters: book.chapters,
    group: book.group,
    name: book.name,
    testament: book.testament,
  }));
}

// Fetch all books with fallback - always returns data
async function fetchBooks(): Promise<BibleBook[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${API_BASE_URL}/books`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('[Bible] API failed, using fallback books list', error);
    return convertFallbackToApiFormat(BIBLE_BOOKS_FALLBACK);
  }
}

// Fetch chapter via Edge Function proxy (with cache)
async function fetchChapterViaProxy(
  version: string,
  abbrev: string,
  chapter: number
): Promise<BibleChapter> {
  const { data, error } = await supabase.functions.invoke('bible-proxy', {
    body: { version, bookAbbrev: abbrev, chapter },
  });

  if (error) {
    console.error('[Bible] Edge function error:', error);
    throw new Error('Erro ao conectar com o servidor');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  // Find book info from fallback for complete response
  const bookInfo = BIBLE_BOOKS_FALLBACK.find(b => b.abbrev.pt === abbrev);

  // Convert proxy response to BibleChapter format
  return {
    book: {
      abbrev: bookInfo?.abbrev || { pt: abbrev, en: abbrev },
      name: data.bookName || bookInfo?.name || abbrev,
      author: bookInfo?.author || '',
      group: bookInfo?.group || '',
      version: version,
    },
    chapter: {
      number: chapter,
      verses: data.verses.length,
    },
    verses: data.verses,
    source: data.source,
  };
}

// Fallback: Try direct API call if Edge Function fails
async function fetchChapterDirect(
  version: string,
  abbrev: string,
  chapter: number
): Promise<BibleChapter> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const response = await fetch(`${API_BASE_URL}/verses/${version}/${abbrev}/${chapter}`, {
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Muitas requisições. Aguarde um momento...');
    }
    throw new Error('API indisponível');
  }
  
  const data = await response.json();
  return { ...data, source: 'abibliadigital' as const };
}

// Try local cache (Supabase) as last resort
async function fetchChapterFromCache(
  version: string,
  abbrev: string,
  chapter: number
): Promise<BibleChapter | null> {
  try {
    const { data: cachedData, error } = await supabase
      .from('bible_chapter_cache')
      .select('*')
      .eq('version', version)
      .eq('book_abbrev', abbrev)
      .eq('chapter', chapter)
      .single();

    if (error || !cachedData) return null;

    const bookInfo = BIBLE_BOOKS_FALLBACK.find(b => b.abbrev.pt === abbrev);
    const verses = cachedData.verses as unknown as BibleVerse[];

    return {
      book: {
        abbrev: bookInfo?.abbrev || { pt: abbrev, en: abbrev },
        name: bookInfo?.name || abbrev,
        author: bookInfo?.author || '',
        group: bookInfo?.group || '',
        version: version,
      },
      chapter: {
        number: chapter,
        verses: verses.length,
      },
      verses,
      source: 'cache',
    };
  } catch (error) {
    console.warn('[Bible] Cache lookup failed:', error);
    return null;
  }
}

// Main fetch function with multiple fallbacks
async function fetchChapter(
  version: string,
  abbrev: string,
  chapter: number
): Promise<BibleChapter> {
  // 1. Try Edge Function (which has its own cache + API retry)
  try {
    return await fetchChapterViaProxy(version, abbrev, chapter);
  } catch (proxyError) {
    console.warn('[Bible] Proxy failed, trying direct API:', proxyError);
  }

  // 2. Try direct API call
  try {
    return await fetchChapterDirect(version, abbrev, chapter);
  } catch (directError) {
    console.warn('[Bible] Direct API failed, checking cache:', directError);
  }

  // 3. Try local cache as last resort
  const cached = await fetchChapterFromCache(version, abbrev, chapter);
  if (cached) {
    console.log('[Bible] Loaded from local cache');
    return cached;
  }

  // All failed
  throw new Error('Não foi possível carregar este capítulo. Tente novamente mais tarde.');
}

// Search verses
async function searchVerses(version: string, query: string): Promise<SearchResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(`${API_BASE_URL}/verses/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      search: query,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Muitas requisições. Aguarde um momento...');
    }
    throw new Error('Pesquisa indisponível no momento');
  }
  return response.json();
}

// Hook to fetch all books with caching (always works via fallback)
export function useBibleBooks() {
  return useQuery({
    queryKey: ['bible', 'books'],
    queryFn: fetchBooks,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// Hook to fetch a specific chapter with resilient fallbacks
export function useBibleChapter(version: string, abbrev: string | null, chapter: number | null) {
  return useQuery({
    queryKey: ['bible', 'chapter', version, abbrev, chapter],
    queryFn: () => fetchChapter(version, abbrev!, chapter!),
    enabled: !!abbrev && !!chapter && chapter > 0,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

// Hook for prefetching chapters
export function usePrefetchChapter() {
  const queryClient = useQueryClient();

  const prefetchChapter = useCallback(
    (version: string, abbrev: string, chapter: number) => {
      // Don't prefetch if already in cache
      const cached = queryClient.getQueryData(['bible', 'chapter', version, abbrev, chapter]);
      if (cached) return;

      queryClient.prefetchQuery({
        queryKey: ['bible', 'chapter', version, abbrev, chapter],
        queryFn: () => fetchChapter(version, abbrev, chapter),
        staleTime: 12 * 60 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const prefetchFirstChapters = useCallback(
    (version: string, abbrev: string, maxChapters: number = 3) => {
      const chaptersToFetch = Math.min(maxChapters, 3);
      for (let i = 1; i <= chaptersToFetch; i++) {
        prefetchChapter(version, abbrev, i);
      }
    },
    [prefetchChapter]
  );

  return { prefetchChapter, prefetchFirstChapters };
}

// Hook for debounced search
export function useBibleSearch(version: string, query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['bible', 'search', version, debouncedQuery],
    queryFn: () => searchVerses(version, debouncedQuery),
    enabled: debouncedQuery.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Helper to separate books by testament
export function separateBooksByTestament(books: BibleBook[]) {
  const oldTestament = books.filter(book => book.testament === 'VT');
  const newTestament = books.filter(book => book.testament === 'NT');
  return { oldTestament, newTestament };
}
