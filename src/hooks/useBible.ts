import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { BIBLE_BOOKS_FALLBACK, BibleBookFallback } from '@/data/bibleBooks';

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

// Fetch all books with fallback
async function fetchBooks(): Promise<BibleBook[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/books`);
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

// Fetch chapter verses
async function fetchChapter(version: string, abbrev: string, chapter: number): Promise<BibleChapter> {
  const response = await fetch(`${API_BASE_URL}/verses/${version}/${abbrev}/${chapter}`);
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Muitas requisições. Aguarde um momento...');
    }
    throw new Error('Failed to fetch chapter');
  }
  return response.json();
}

// Search verses
async function searchVerses(version: string, query: string): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/verses/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      search: query,
    }),
  });
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Muitas requisições. Aguarde um momento...');
    }
    throw new Error('Failed to search verses');
  }
  return response.json();
}

// Hook to fetch all books with caching
export function useBibleBooks() {
  return useQuery({
    queryKey: ['bible', 'books'],
    queryFn: fetchBooks,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    retry: 1, // Only retry once since we have fallback
  });
}

// Hook to fetch a specific chapter
export function useBibleChapter(version: string, abbrev: string | null, chapter: number | null) {
  return useQuery({
    queryKey: ['bible', 'chapter', version, abbrev, chapter],
    queryFn: () => fetchChapter(version, abbrev!, chapter!),
    enabled: !!abbrev && !!chapter && chapter > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: (failureCount, error) => {
      // Don't retry on rate limit
      if (error.message.includes('Muitas requisições')) return false;
      return failureCount < 2;
    },
  });
}

// Hook for debounced search
export function useBibleSearch(version: string, query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['bible', 'search', version, debouncedQuery],
    queryFn: () => searchVerses(version, debouncedQuery),
    enabled: debouncedQuery.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error.message.includes('Muitas requisições')) return false;
      return failureCount < 1;
    },
  });
}

// Helper to separate books by testament
export function separateBooksByTestament(books: BibleBook[]) {
  const oldTestament = books.filter(book => book.testament === 'VT');
  const newTestament = books.filter(book => book.testament === 'NT');
  return { oldTestament, newTestament };
}
