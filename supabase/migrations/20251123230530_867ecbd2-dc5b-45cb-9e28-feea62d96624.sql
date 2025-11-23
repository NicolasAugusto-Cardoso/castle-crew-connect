-- Remover a foreign key duplicada que está causando ambiguidade
-- Manter apenas a foreign key com nome padrão do Supabase

-- Verificar e remover a foreign key extra se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_contact_messages_collaborator'
    ) THEN
        ALTER TABLE public.contact_messages
        DROP CONSTRAINT fk_contact_messages_collaborator;
    END IF;
END $$;

-- Verificar e remover a foreign key extra no collaborator_profiles se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_collaborator_profiles_user'
    ) THEN
        ALTER TABLE public.collaborator_profiles
        DROP CONSTRAINT fk_collaborator_profiles_user;
    END IF;
END $$;