-- Create post_reactions table
CREATE TABLE public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  emoji_type TEXT NOT NULL CHECK (emoji_type IN ('fire', 'heart', 'hands')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji_type)
);

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view reactions
CREATE POLICY "Post reactions viewable by everyone"
ON public.post_reactions
FOR SELECT
TO authenticated, anon
USING (true);

-- Policy: Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reactions"
ON public.post_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON public.post_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX idx_post_reactions_user_id ON public.post_reactions(user_id);