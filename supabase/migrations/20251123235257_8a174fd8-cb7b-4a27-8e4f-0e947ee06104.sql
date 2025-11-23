-- Permitir que usuários deletem suas próprias mensagens
CREATE POLICY "Users can delete own messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);