-- Adicionar foreign keys para garantir integridade dos dados
-- e permitir joins automáticos no Supabase

-- Foreign key: contact_messages.collaborator_id → collaborator_profiles.id
ALTER TABLE public.contact_messages
ADD CONSTRAINT fk_contact_messages_collaborator
FOREIGN KEY (collaborator_id) 
REFERENCES public.collaborator_profiles(id) 
ON DELETE CASCADE;

-- Foreign key: collaborator_profiles.user_id → profiles.id  
ALTER TABLE public.collaborator_profiles
ADD CONSTRAINT fk_collaborator_profiles_user
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Índices para melhorar performance de queries com joins
CREATE INDEX IF NOT EXISTS idx_contact_messages_collaborator 
ON public.contact_messages(collaborator_id);

CREATE INDEX IF NOT EXISTS idx_collaborator_profiles_user
ON public.collaborator_profiles(user_id);