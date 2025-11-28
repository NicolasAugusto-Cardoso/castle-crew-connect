-- Corrigir usuários órfãos sem roles e profiles

-- Inserir role 'user' para usuários sem role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- Inserir profile para usuários sem profile
INSERT INTO public.profiles (id, name, avatar_url)
SELECT 
  u.id, 
  COALESCE(u.raw_user_meta_data->>'name', 'Usuário'),
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;