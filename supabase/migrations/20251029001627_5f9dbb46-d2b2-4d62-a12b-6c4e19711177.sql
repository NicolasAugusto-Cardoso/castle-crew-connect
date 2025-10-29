-- Atualizar tipos de mídia existentes para MIME types corretos
UPDATE gallery_media
SET type = 'image/jpeg'
WHERE type = 'image' OR type NOT LIKE '%/%';

UPDATE gallery_media
SET type = 'video/mp4'
WHERE type = 'video' OR (type LIKE 'video%' AND type NOT LIKE 'video/mp4');