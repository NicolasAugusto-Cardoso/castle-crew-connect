-- Allow author_name to be nullable for anonymous testimonials
ALTER TABLE public.testimonials 
ALTER COLUMN author_name DROP NOT NULL;

-- Update RLS policies to allow all authenticated users to create testimonials
DROP POLICY IF EXISTS "Admins and social media can create testimonials" ON public.testimonials;

CREATE POLICY "Authenticated users can create testimonials" 
ON public.testimonials 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Keep other policies for managing testimonials
-- Admins and social media can still update and view drafts