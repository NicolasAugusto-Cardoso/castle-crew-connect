-- Tabela de cache de capítulos da Bíblia
CREATE TABLE IF NOT EXISTS public.bible_chapter_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL, -- 'abibliadigital' | 'apibible' | 'other'
  version text NOT NULL,  -- 'nvi' | 'ara' | 'acf' etc
  book_abbrev text NOT NULL,
  chapter integer NOT NULL,
  verses jsonb NOT NULL,  -- array de versículos normalizado
  fetched_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (version, book_abbrev, chapter)
);

-- Índice para buscas rápidas
CREATE INDEX IF NOT EXISTS bible_chapter_cache_lookup
ON public.bible_chapter_cache (version, book_abbrev, chapter);

-- RLS: leitura pública (Bíblia é conteúdo público)
ALTER TABLE public.bible_chapter_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bible cache is publicly readable"
ON public.bible_chapter_cache
FOR SELECT
USING (true);

-- Insert apenas via service role (Edge Function)
CREATE POLICY "Only service role can insert cache"
ON public.bible_chapter_cache
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only service role can update cache"
ON public.bible_chapter_cache
FOR UPDATE
USING (false);