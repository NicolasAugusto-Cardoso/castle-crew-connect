-- Add language column to cache and clean Spanish entries
ALTER TABLE public.bible_chapter_cache 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR';

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS idx_bible_cache_language 
ON public.bible_chapter_cache (language);

-- Delete any cached entries that contain Spanish text (Santiago = Tiago in Spanish)
DELETE FROM public.bible_chapter_cache 
WHERE verses::text ILIKE '%Santiago%'
   OR verses::text ILIKE '%Espíritu Santo%'
   OR verses::text ILIKE '%Señor%'
   OR provider = 'bolls_life';