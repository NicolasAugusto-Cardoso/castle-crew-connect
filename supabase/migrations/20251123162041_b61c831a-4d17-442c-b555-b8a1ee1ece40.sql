-- Adicionar coluna collaborator_id na tabela contact_messages
ALTER TABLE public.contact_messages
ADD COLUMN collaborator_id UUID REFERENCES public.collaborator_profiles(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX idx_contact_messages_collaborator ON public.contact_messages(collaborator_id);

-- Comentário explicativo
COMMENT ON COLUMN public.contact_messages.collaborator_id IS 'ID do colaborador relacionado à mensagem. NULL = mensagem para administração geral';