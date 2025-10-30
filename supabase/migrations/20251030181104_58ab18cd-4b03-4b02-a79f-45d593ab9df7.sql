-- Allow author_name to be nullable for anonymous testimonials
ALTER TABLE public.testimonials 
ALTER COLUMN author_name DROP NOT NULL;

-- Update RLS policy to allow all authenticated users to create testimonials
DROP POLICY IF EXISTS "Admins and social media can create testimonials" ON public.testimonials;