-- Adicionar constraint de cascata para exclusão de mídias quando pasta for deletada
ALTER TABLE gallery_media 
DROP CONSTRAINT IF EXISTS gallery_media_folder_id_fkey;

ALTER TABLE gallery_media
ADD CONSTRAINT gallery_media_folder_id_fkey 
FOREIGN KEY (folder_id) 
REFERENCES gallery_folders(id) 
ON DELETE CASCADE;