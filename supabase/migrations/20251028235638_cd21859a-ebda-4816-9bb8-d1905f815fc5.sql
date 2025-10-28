-- Create storage bucket for gallery media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'video/mp4']
);

-- Create storage policies for gallery bucket
CREATE POLICY "Admins and social media can upload to gallery"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery' AND
  (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'social_media')
    )
  )
);

CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'gallery');

CREATE POLICY "Admins and social media can update gallery files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'social_media')
  )
);

CREATE POLICY "Admins can delete gallery files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);