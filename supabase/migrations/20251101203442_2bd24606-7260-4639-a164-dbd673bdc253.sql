-- Drop existing unique constraint that allows multiple reactions per user per post
ALTER TABLE public.post_reactions 
DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_emoji_type_key;

-- Add new unique constraint: one reaction per user per post
ALTER TABLE public.post_reactions 
ADD CONSTRAINT post_reactions_post_id_user_id_key UNIQUE(post_id, user_id);