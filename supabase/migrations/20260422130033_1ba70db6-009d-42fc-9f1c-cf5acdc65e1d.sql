-- 1. Tabela media_projects
CREATE TABLE public.media_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.social_media_tasks(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
  title TEXT NOT NULL DEFAULT 'Projeto sem título',
  thumbnail_url TEXT,
  source_url TEXT,
  output_url TEXT,
  project_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_projects_user ON public.media_projects(user_id);
CREATE INDEX idx_media_projects_task ON public.media_projects(task_id);

ALTER TABLE public.media_projects ENABLE ROW LEVEL SECURITY;

-- RLS: dono gerencia seus projetos
CREATE POLICY "Users manage own projects"
  ON public.media_projects
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS: admin vê tudo
CREATE POLICY "Admins manage all projects"
  ON public.media_projects
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_media_projects_updated_at
  BEFORE UPDATE ON public.media_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Bucket de armazenamento (200 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('media-projects', 'media-projects', true, 209715200)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 209715200, public = true;

-- Storage policies: pasta {user_id}/...
CREATE POLICY "Media projects are publicly viewable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media-projects');

CREATE POLICY "Users upload to own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'media-projects'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'media-projects'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'media-projects'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );