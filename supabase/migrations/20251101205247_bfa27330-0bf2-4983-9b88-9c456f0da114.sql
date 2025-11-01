-- 1. Adicionar coluna user_id para rastrear quem enviou a mensagem
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Remover política antiga de INSERT
DROP POLICY IF EXISTS "Authenticated users can create contact messages" ON public.contact_messages;

-- 3. Criar nova política de INSERT mais robusta
CREATE POLICY "Authenticated users can create contact messages"
ON public.contact_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- 4. Remover função e trigger antigos se existirem
DROP TRIGGER IF EXISTS enforce_contact_message_rate_limit ON public.contact_messages;
DROP FUNCTION IF EXISTS public.check_contact_message_rate_limit();

-- 5. Criar função de rate limiting POR USUÁRIO (não global)
CREATE OR REPLACE FUNCTION public.check_contact_message_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  message_count INTEGER;
  current_user_id UUID;
BEGIN
  -- Obter o user_id do contexto atual
  current_user_id := auth.uid();
  
  -- Se não houver user_id, bloquear
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;
  
  -- Definir user_id automaticamente
  NEW.user_id := current_user_id;
  
  -- Contar mensagens deste usuário na última hora
  SELECT COUNT(*)
  INTO message_count
  FROM public.contact_messages
  WHERE user_id = current_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Se já enviou 3 ou mais mensagens na última hora, bloquear
  IF message_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. You can only send 3 messages per hour.'
      USING ERRCODE = 'PGRST116';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Criar trigger BEFORE INSERT
CREATE TRIGGER enforce_contact_message_rate_limit
BEFORE INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.check_contact_message_rate_limit();

-- 7. Atualizar política de SELECT para incluir visualização das próprias mensagens
DROP POLICY IF EXISTS "Contact messages viewable by admins and social media" ON public.contact_messages;

CREATE POLICY "Contact messages viewable by admins and social media"
ON public.contact_messages
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'social_media'::app_role)
  OR user_id = auth.uid()
);