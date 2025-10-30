-- Remover política antiga
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;

-- Criar política simples permitindo inserção pública
CREATE POLICY "Public can create contact messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (true);