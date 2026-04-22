import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { BIBLE_BOOKS_FALLBACK } from '@/data/bibleBooks';
import { supabase } from '@/integrations/supabase/client';
import type { BibleBook, BibleChapter, BibleVerse } from './useBible';

/**
 * useBibleData
 * -----------------------------------------------------------------------------
 * Hook responsável pela leitura da Bíblia diretamente dos arquivos estáticos
 * locais em `/public/bible/{version}/{book}/{chapter}.json`.
 *
 * - Carregamento instantâneo via fetch local (servido pelo Vite/CDN).
 * - Cache via React Query (em memória) — navegação entre capítulos sem delay.
 * - Fallback transparente para a Edge Function (`bible-proxy`) caso o arquivo
 *   local ainda não exista (útil enquanto baixamos todas as traduções).
 * - Persistência da versão/livro/capítulo no `localStorage` para manter o
 *   contexto de leitura entre abas/sessões.
 */

const LOCAL_BIBLE_BASE = '/bible';

// ---------------------------------------------------------------------------
// Local JSON loader
// ---------------------------------------------------------------------------

interface LocalChapterFile {
  v: BibleVerse[];
}

async function fetchLocalChapter(
  version: string,
  abbrev: string,
  chapter: number
): Promise<BibleVerse[] | null> {
  try {
    const res = await fetch(`${LOCAL_BIBLE_BASE}/${version}/${abbrev}/${chapter}.json`, {
      cache: 'force-cache',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as LocalChapterFile;
    if (!data?.v || !Array.isArray(data.v)) return null;
    return data.v;
  } catch {
    return null;
  }
}

async function fetchChapterViaProxyFallback(
  version: string,
  abbrev: string,
  chapter: number
): Promise<BibleVerse[]> {
  const { data, error } = await supabase.functions.invoke('bible-proxy', {
    body: { version, bookAbbrev: abbrev, chapter },
  });
  if (error) throw new Error(error.message || 'Erro ao carregar capítulo');
  if (data?.error) throw new Error(data.error);
  return (data?.verses || []) as BibleVerse[];
}

async function loadChapter(
  version: string,
  abbrev: string,
  chapter: number
): Promise<BibleChapter> {
  const bookInfo = BIBLE_BOOKS_FALLBACK.find(b => b.abbrev.pt === abbrev);

  // 1. Try local JSON first (instantaneous)
  let verses = await fetchLocalChapter(version, abbrev, chapter);

  // 2. Fallback to edge proxy if local file is missing
  if (!verses) {
    verses = await fetchChapterViaProxyFallback(version, abbrev, chapter);
  }

  return {
    book: {
      abbrev: bookInfo?.abbrev || { pt: abbrev, en: abbrev },
      name: bookInfo?.name || abbrev,
      author: bookInfo?.author || '',
      group: bookInfo?.group || '',
      version,
    },
    chapter: {
      number: chapter,
      verses: verses.length,
    },
    verses,
  };
}

// ---------------------------------------------------------------------------
// Books (static fallback list — instantaneous)
// ---------------------------------------------------------------------------

export function useBibleBooksLocal() {
  return useQuery({
    queryKey: ['bible-local', 'books'],
    queryFn: async (): Promise<BibleBook[]> =>
      BIBLE_BOOKS_FALLBACK.map(b => ({
        abbrev: b.abbrev,
        author: b.author,
        chapters: b.chapters,
        group: b.group,
        name: b.name,
        testament: b.testament,
      })),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// ---------------------------------------------------------------------------
// Chapter
// ---------------------------------------------------------------------------

export function useBibleChapterLocal(
  version: string,
  abbrev: string | null,
  chapter: number | null
) {
  return useQuery({
    queryKey: ['bible-local', 'chapter', version, abbrev, chapter],
    queryFn: () => loadChapter(version, abbrev!, chapter!),
    enabled: !!abbrev && !!chapter && chapter > 0,
    staleTime: Infinity, // local files never change
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: prev => prev,
  });
}

// ---------------------------------------------------------------------------
// Prefetch (adjacent chapters)
// ---------------------------------------------------------------------------

export function usePrefetchChapterLocal() {
  const queryClient = useQueryClient();

  const prefetchChapter = useCallback(
    (version: string, abbrev: string, chapter: number) => {
      const key = ['bible-local', 'chapter', version, abbrev, chapter];
      if (queryClient.getQueryData(key)) return;
      queryClient.prefetchQuery({
        queryKey: key,
        queryFn: () => loadChapter(version, abbrev, chapter),
        staleTime: Infinity,
      });
    },
    [queryClient]
  );

  return { prefetchChapter };
}

// ---------------------------------------------------------------------------
// Persistence: last reading position (version / book / chapter)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bible:last-position';

export interface BibleReadingPosition {
  version: string;
  bookAbbrev: string | null;
  chapter: number | null;
}

const DEFAULT_POSITION: BibleReadingPosition = {
  version: 'nvi',
  bookAbbrev: null,
  chapter: null,
};

function readPosition(): BibleReadingPosition {
  if (typeof window === 'undefined') return DEFAULT_POSITION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POSITION;
    const parsed = JSON.parse(raw) as Partial<BibleReadingPosition>;
    return {
      version: parsed.version || DEFAULT_POSITION.version,
      bookAbbrev: parsed.bookAbbrev ?? null,
      chapter: typeof parsed.chapter === 'number' ? parsed.chapter : null,
    };
  } catch {
    return DEFAULT_POSITION;
  }
}

export function useBibleReadingPosition() {
  const [position, setPosition] = useState<BibleReadingPosition>(() => readPosition());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch {
      /* ignore quota errors */
    }
  }, [position]);

  const update = useCallback((patch: Partial<BibleReadingPosition>) => {
    setPosition(prev => ({ ...prev, ...patch }));
  }, []);

  return { position, setPosition, update };
}
