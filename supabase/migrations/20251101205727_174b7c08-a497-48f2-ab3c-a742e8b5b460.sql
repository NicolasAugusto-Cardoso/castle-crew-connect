-- Criar tabela para respostas/replies do chat de contato
CREATE TABLE IF NOT EXISTS public.contact_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contact_replies_message_id ON public.contact_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_contact_replies_created_at ON public.contact_replies(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.contact_replies ENABLE ROW LEVEL SECURITY;

-- Política: Admins e social_media podem inserir respostas
CREATE POLICY "Admins and social media can create replies"
ON public.contact_replies
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'social_media'::app_role)
);

-- Política: Usuários podem inserir respostas nas suas próprias mensagens
CREATE POLICY "Users can reply to their own messages"
ON public.contact_replies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contact_messages
    WHERE id = message_id AND user_id = auth.uid()
  )
);

-- Política: Admins, social_media e donos da mensagem podem ver replies
CREATE POLICY "Can view replies to accessible messages"
ON public.contact_replies
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'social_media'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.contact_messages
    WHERE id = message_id AND user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contact_replies_updated_at
BEFORE UPDATE ON public.contact_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Realtime para a tabela
ALTER TABLE public.contact_replies REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_replies;

-- Também habilitar realtime para contact_messages (para status updates)
ALTER TABLE public.contact_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;