-- Remover a constraint que limita tipos para apenas 'image' ou 'video'
ALTER TABLE gallery_media DROP CONSTRAINT IF EXISTS gallery_media_type_check;

-- Adicionar constraint flexível que aceita tipos MIME completos
ALTER TABLE gallery_media ADD CONSTRAINT gallery_media_type_check 
CHECK (type ~ '^(image|video)/.+$');