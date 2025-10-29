-- Update storage bucket to support more file types and increase size limit
UPDATE storage.buckets
SET 
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'video/quicktime']
WHERE id = 'gallery';