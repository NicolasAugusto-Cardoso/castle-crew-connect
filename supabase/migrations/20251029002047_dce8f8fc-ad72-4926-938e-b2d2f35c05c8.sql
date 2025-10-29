-- 1. ATIVAR PROTEÇÃO CONTRA SENHAS VAZADAS
-- Esta configuração será aplicada automaticamente pelo Supabase
-- Nenhuma alteração SQL necessária aqui

-- 2. RESTRINGIR ACESSO À TABELA PROFILES
-- Apenas usuários autenticados podem ver perfis
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 3. RESTRINGIR ACESSO À TABELA COLLABORATOR_PROFILES
-- Apenas usuários autenticados podem ver perfis de colaboradores
DROP POLICY IF EXISTS "Collaborator profiles viewable by authenticated users" ON public.collaborator_profiles;

CREATE POLICY "Authenticated users can view collaborator profiles"
ON public.collaborator_profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 4. ADICIONAR POLÍTICA DELETE PARA CONTACT_MESSAGES
-- Apenas admins podem deletar mensagens de contato
CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. PERMITIR COLABORADORES REGISTRAREM CONTATOS DE DISCIPULADO
-- Colaboradores podem inserir contatos que eles mesmos registraram
CREATE POLICY "Collaborators can register discipleship contacts"
ON public.discipleship_contacts
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'collaborator'::app_role) 
  AND registered_by = auth.uid()
);

-- ADICIONAR POLÍTICAS DE SEGURANÇA EXTRAS

-- Garantir que usuários só podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Garantir que as tabelas críticas têm RLS habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;