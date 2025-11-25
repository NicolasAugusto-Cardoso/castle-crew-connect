-- Criar tabela post_images para múltiplas imagens por post
CREATE TABLE IF NOT EXISTS public.post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index para performance nas consultas por post
CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON public.post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_order ON public.post_images(post_id, display_order);

-- Habilitar RLS
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Leitura pública
CREATE POLICY "Post images viewable by everyone"
ON public.post_images
FOR SELECT
USING (true);

-- Políticas RLS: Admins e social media podem criar imagens
CREATE POLICY "Admins and social media can create post images"
ON public.post_images
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'social_media'::app_role)
);

-- Políticas RLS: Admins e social media podem atualizar imagens
CREATE POLICY "Admins and social media can update post images"
ON public.post_images
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'social_media'::app_role)
);

-- Políticas RLS: Admins podem deletar imagens
CREATE POLICY "Admins can delete post images"
ON public.post_images
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));