-- Adicionar campo de idade na tabela de perfis de colaboradores
ALTER TABLE public.collaborator_profiles
ADD COLUMN age integer;

-- Comentário explicativo
COMMENT ON COLUMN public.collaborator_profiles.age IS 'Idade do colaborador em anos';