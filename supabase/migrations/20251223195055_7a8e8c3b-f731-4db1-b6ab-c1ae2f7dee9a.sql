-- Drop existing policies
DROP POLICY IF EXISTS "Admins and volunteers can create events" ON public.events;
DROP POLICY IF EXISTS "Admins and volunteers can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Create new policies including social_media
CREATE POLICY "Admins volunteers and social media can create events"
ON public.events FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'volunteer'::app_role) OR 
  has_role(auth.uid(), 'social_media'::app_role)
);

CREATE POLICY "Admins volunteers and social media can update events"
ON public.events FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'volunteer'::app_role) OR 
  has_role(auth.uid(), 'social_media'::app_role)
);

CREATE POLICY "Admins volunteers and social media can delete events"
ON public.events FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'volunteer'::app_role) OR 
  has_role(auth.uid(), 'social_media'::app_role)
);