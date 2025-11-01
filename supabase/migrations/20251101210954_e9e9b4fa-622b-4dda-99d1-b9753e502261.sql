-- Adicionar campo is_read na tabela contact_replies
ALTER TABLE public.contact_replies
ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Criar índice para melhor performance nas queries de mensagens não lidas
CREATE INDEX idx_contact_replies_is_read ON public.contact_replies(sender_id, is_read) WHERE is_read = false;

-- Adicionar policy para permitir usuários marcarem suas mensagens como lidas
CREATE POLICY "Users can update their own replies read status"
ON public.contact_replies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM contact_messages
    WHERE contact_messages.id = contact_replies.message_id
    AND contact_messages.user_id = auth.uid()
  )
);

-- Adicionar policy para admins marcarem mensagens como lidas
CREATE POLICY "Admins can update replies read status"
ON public.contact_replies
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'social_media'::app_role)
);