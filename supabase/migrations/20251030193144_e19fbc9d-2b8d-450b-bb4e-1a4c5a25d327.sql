-- Remover política antiga que não funciona para usuários autenticados
DROP POLICY IF EXISTS "Public can create contact messages" ON public.contact_messages;

-- Criar política que funciona para usuários autenticados e anônimos
CREATE POLICY "Anyone can create contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);