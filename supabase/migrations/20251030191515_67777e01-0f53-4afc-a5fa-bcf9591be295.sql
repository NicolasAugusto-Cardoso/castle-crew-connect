-- Permitir que usuários com role 'user' possam visualizar todos os contatos de discipulado
CREATE POLICY "Users can view all discipleship contacts"
ON public.discipleship_contacts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'user'::app_role));