-- Corrigir políticas RLS da tabela contact_messages para permitir envio por usuários autenticados

-- Remover a política antiga de INSERT
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;

-- Criar nova política de INSERT que permite usuários autenticados
CREATE POLICY "Authenticated users can create contact messages"
ON public.contact_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar função para verificar rate limit de mensagens (máximo 3 por hora)
CREATE OR REPLACE FUNCTION public.check_contact_message_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  message_count INTEGER;
BEGIN
  -- Contar mensagens enviadas na última hora
  SELECT COUNT(*)
  INTO message_count
  FROM public.contact_messages
  WHERE created_at > NOW() - INTERVAL '1 hour';
  
  -- Se já enviou 3 ou mais mensagens na última hora, bloquear
  IF message_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. You can only send 3 messages per hour.'
      USING ERRCODE = 'PGRST116';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para aplicar rate limiting
DROP TRIGGER IF EXISTS enforce_contact_message_rate_limit ON public.contact_messages;

CREATE TRIGGER enforce_contact_message_rate_limit
BEFORE INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.check_contact_message_rate_limit();

-- Garantir que a política de SELECT permanece restrita a admins e social_media
-- (não fazemos alterações, apenas confirmamos que está correta)