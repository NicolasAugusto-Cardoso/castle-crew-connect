-- Permitir que usuários deletem respostas em conversas que eles criaram
CREATE POLICY "Users can delete replies on their own messages"
ON public.contact_replies
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM contact_messages
    WHERE contact_messages.id = contact_replies.message_id
    AND contact_messages.user_id = auth.uid()
  )
);