-- Criar tabela de configurações do app
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar todas as configurações
CREATE POLICY "Admins can manage app settings"
ON public.app_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Usuários autenticados podem ler configurações
CREATE POLICY "Authenticated users can read app settings"
ON public.app_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Inserir configuração inicial (doações desabilitadas por padrão)
INSERT INTO public.app_settings (key, value)
VALUES ('donations_enabled', 'false'::jsonb);