-- Criar RLS policies para voluntário

-- Voluntário pode ver todos os contatos de discipulado
CREATE POLICY "volunteer can view discipleship contacts"
ON public.discipleship_contacts
FOR SELECT
USING (has_role(auth.uid(), 'volunteer'));

-- Voluntário pode criar contatos de discipulado
CREATE POLICY "volunteer can insert discipleship contacts"
ON public.discipleship_contacts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'volunteer') AND registered_by = auth.uid());

-- Voluntário pode atualizar contatos de discipulado
CREATE POLICY "volunteer can update discipleship contacts"
ON public.discipleship_contacts
FOR UPDATE
USING (has_role(auth.uid(), 'volunteer'));