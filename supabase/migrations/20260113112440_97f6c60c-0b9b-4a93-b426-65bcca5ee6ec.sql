-- Table for Bible notes (annotations)
CREATE TABLE IF NOT EXISTS public.bible_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version text NOT NULL,
  book_abbrev text NOT NULL,
  chapter int NOT NULL,
  verse int NOT NULL,
  content_json jsonb NOT NULL,
  text_color text NULL,
  background_color text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, version, book_abbrev, chapter, verse)
);

-- Table for Bible highlights (text selections with color)
CREATE TABLE IF NOT EXISTS public.bible_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version text NOT NULL,
  book_abbrev text NOT NULL,
  chapter int NOT NULL,
  verse int NOT NULL,
  color text NOT NULL,
  start_offset int NOT NULL,
  end_offset int NOT NULL,
  highlighted_text text NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bible_highlights_lookup
ON public.bible_highlights(user_id, version, book_abbrev, chapter, verse);

-- Table for Bible focus marks (reading mode)
CREATE TABLE IF NOT EXISTS public.bible_focus_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version text NOT NULL,
  book_abbrev text NOT NULL,
  chapter int NOT NULL,
  verse int NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, version, book_abbrev, chapter, verse)
);

-- Enable RLS on all tables
ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_focus_marks ENABLE ROW LEVEL SECURITY;

-- RLS policies for bible_notes
CREATE POLICY "Users can view own bible notes"
ON public.bible_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bible notes"
ON public.bible_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bible notes"
ON public.bible_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bible notes"
ON public.bible_notes FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for bible_highlights
CREATE POLICY "Users can view own bible highlights"
ON public.bible_highlights FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bible highlights"
ON public.bible_highlights FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bible highlights"
ON public.bible_highlights FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bible highlights"
ON public.bible_highlights FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for bible_focus_marks
CREATE POLICY "Users can view own bible focus marks"
ON public.bible_focus_marks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bible focus marks"
ON public.bible_focus_marks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bible focus marks"
ON public.bible_focus_marks FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at on bible_notes
CREATE TRIGGER update_bible_notes_updated_at
BEFORE UPDATE ON public.bible_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();