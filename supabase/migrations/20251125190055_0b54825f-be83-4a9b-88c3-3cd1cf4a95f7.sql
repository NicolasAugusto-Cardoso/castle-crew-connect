-- Tornar o campo title opcional para permitir posts apenas com legenda
ALTER TABLE posts ALTER COLUMN title DROP NOT NULL;