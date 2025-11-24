-- 1. Criar política RLS para colaboradores verem mensagens enviadas para eles
CREATE POLICY "Collaborators can view messages sent to them"
ON public.contact_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collaborator_profiles cp
    WHERE cp.user_id = auth.uid()
    AND cp.id = contact_messages.collaborator_id
  )
);

-- 2. Criar tabela para tokens de push notification
CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  platform text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Habilitar RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem gerenciar seus próprios tokens
CREATE POLICY "Users can manage own push tokens"
ON public.push_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Função para enviar notificação quando nova mensagem for criada
CREATE OR REPLACE FUNCTION public.notify_new_contact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Determinar quem deve receber a notificação
  IF NEW.collaborator_id IS NOT NULL THEN
    -- Mensagem para colaborador específico
    SELECT user_id INTO target_user_id
    FROM collaborator_profiles
    WHERE id = NEW.collaborator_id;
  ELSE
    -- Mensagem para admins (não enviamos push para todos admins, apenas marcamos)
    target_user_id := NULL;
  END IF;

  -- Se encontrou um usuário específico, invocar edge function
  IF target_user_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'user_id', target_user_id,
        'title', 'Nova mensagem',
        'body', 'Você recebeu uma nova mensagem de ' || NEW.name,
        'data', jsonb_build_object('message_id', NEW.id)
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para chamar função após INSERT em contact_messages
CREATE TRIGGER trigger_notify_new_contact_message
AFTER INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_contact_message();