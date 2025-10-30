-- Etapa 1: Corrigir política RLS da tabela profiles para permitir inserts do trigger
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Enable insert for service role and authenticated users"
ON public.profiles FOR INSERT
WITH CHECK (
  auth.uid() = id OR           -- usuário autenticado
  auth.role() = 'service_role' -- trigger com SECURITY DEFINER
);

-- Etapa 2: Melhorar trigger com tratamento de erro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir profile
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Atribuir role 'user' padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar profile/role para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;