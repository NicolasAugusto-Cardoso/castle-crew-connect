-- Remove policy allowing admins and social media to update testimonials
DROP POLICY IF EXISTS "Admins and social media can update testimonials" ON public.testimonials;

-- Users should only be able to update their own draft testimonials
CREATE POLICY "Users can update own draft testimonials"
ON public.testimonials
FOR UPDATE
USING (
  auth.uid() = created_by 
  AND status = 'draft'
)
WITH CHECK (
  auth.uid() = created_by 
  AND status = 'draft'
);