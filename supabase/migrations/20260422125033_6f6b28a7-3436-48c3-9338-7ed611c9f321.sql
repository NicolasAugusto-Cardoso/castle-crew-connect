-- Enum de status
CREATE TYPE public.task_status AS ENUM ('pending', 'in_production', 'completed');

-- Tabela principal
CREATE TABLE public.social_media_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  instructions TEXT,
  reference_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_date TIMESTAMPTZ,
  status public.task_status NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  assigned_to UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_social_media_tasks_status ON public.social_media_tasks(status);
CREATE INDEX idx_social_media_tasks_assigned_to ON public.social_media_tasks(assigned_to);
CREATE INDEX idx_social_media_tasks_created_by ON public.social_media_tasks(created_by);

ALTER TABLE public.social_media_tasks ENABLE ROW LEVEL SECURITY;

-- Admins veem tudo
CREATE POLICY "Admins manage all tasks"
ON public.social_media_tasks
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Volunteers podem criar/editar/excluir
CREATE POLICY "Volunteers can create tasks"
ON public.social_media_tasks
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'volunteer') AND created_by = auth.uid());

CREATE POLICY "Volunteers can view tasks they created"
ON public.social_media_tasks
FOR SELECT
USING (public.has_role(auth.uid(), 'volunteer'));

CREATE POLICY "Volunteers can update their tasks"
ON public.social_media_tasks
FOR UPDATE
USING (public.has_role(auth.uid(), 'volunteer') AND created_by = auth.uid());

CREATE POLICY "Volunteers can delete their tasks"
ON public.social_media_tasks
FOR DELETE
USING (public.has_role(auth.uid(), 'volunteer') AND created_by = auth.uid());

-- Social media vê tarefas atribuídas (ou sem atribuição) e pode atualizar status
CREATE POLICY "Social media views assigned tasks"
ON public.social_media_tasks
FOR SELECT
USING (
  public.has_role(auth.uid(), 'social_media')
  AND (assigned_to = auth.uid() OR assigned_to IS NULL)
);

CREATE POLICY "Social media updates assigned tasks"
ON public.social_media_tasks
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'social_media')
  AND (assigned_to = auth.uid() OR assigned_to IS NULL)
);

-- Trigger updated_at
CREATE TRIGGER update_social_media_tasks_updated_at
BEFORE UPDATE ON public.social_media_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para referências
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-references', 'task-references', true);

-- Storage policies
CREATE POLICY "Task references publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-references');

CREATE POLICY "Admin and volunteer can upload task references"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-references'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'volunteer'))
);

CREATE POLICY "Admin and volunteer can delete task references"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-references'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'volunteer'))
);