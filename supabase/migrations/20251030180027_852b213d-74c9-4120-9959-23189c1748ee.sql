-- Criar bucket para imagens de postagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para o bucket posts
CREATE POLICY "Posts images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Admins and social media can upload post images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'posts' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'social_media'::app_role)
  )
);

CREATE POLICY "Admins and social media can update post images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'posts' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'social_media'::app_role)
  )
);

CREATE POLICY "Admins can delete post images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'posts' 
  AND has_role(auth.uid(), 'admin'::app_role)
);