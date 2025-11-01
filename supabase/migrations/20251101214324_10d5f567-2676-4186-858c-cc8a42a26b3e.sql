-- Adicionar campos para rastreamento de atribuição automática
ALTER TABLE public.discipleship_contacts
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id);

-- Criar função para encontrar colaborador mais próximo
CREATE OR REPLACE FUNCTION public.find_nearest_collaborator(
  p_neighborhood text,
  p_city text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collaborator_id uuid;
  v_count integer;
BEGIN
  -- Primeiro: buscar colaborador no mesmo bairro e cidade
  SELECT cp.user_id INTO v_collaborator_id
  FROM collaborator_profiles cp
  INNER JOIN user_roles ur ON ur.user_id = cp.user_id AND ur.role = 'collaborator'
  WHERE LOWER(TRIM(cp.neighborhood)) = LOWER(TRIM(p_neighborhood))
    AND LOWER(TRIM(cp.city)) = LOWER(TRIM(p_city))
  ORDER BY (
    SELECT COUNT(*)
    FROM discipleship_contacts dc
    WHERE dc.assigned_collaborator_id = cp.user_id
  ) ASC
  LIMIT 1;
  
  IF v_collaborator_id IS NOT NULL THEN
    RETURN v_collaborator_id;
  END IF;
  
  -- Segundo: buscar colaborador na mesma cidade
  SELECT cp.user_id INTO v_collaborator_id
  FROM collaborator_profiles cp
  INNER JOIN user_roles ur ON ur.user_id = cp.user_id AND ur.role = 'collaborator'
  WHERE LOWER(TRIM(cp.city)) = LOWER(TRIM(p_city))
  ORDER BY (
    SELECT COUNT(*)
    FROM discipleship_contacts dc
    WHERE dc.assigned_collaborator_id = cp.user_id
  ) ASC
  LIMIT 1;
  
  IF v_collaborator_id IS NOT NULL THEN
    RETURN v_collaborator_id;
  END IF;
  
  -- Terceiro: buscar colaborador na mesma região
  SELECT cp.user_id INTO v_collaborator_id
  FROM collaborator_profiles cp
  INNER JOIN user_roles ur ON ur.user_id = cp.user_id AND ur.role = 'collaborator'
  WHERE cp.region IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM collaborator_profiles cp2 
      WHERE LOWER(TRIM(cp2.city)) = LOWER(TRIM(p_city))
        AND LOWER(TRIM(cp2.region)) = LOWER(TRIM(cp.region))
    )
  ORDER BY (
    SELECT COUNT(*)
    FROM discipleship_contacts dc
    WHERE dc.assigned_collaborator_id = cp.user_id
  ) ASC
  LIMIT 1;
  
  IF v_collaborator_id IS NOT NULL THEN
    RETURN v_collaborator_id;
  END IF;
  
  -- Quarto: balancear entre todos os colaboradores (fallback)
  SELECT cp.user_id INTO v_collaborator_id
  FROM collaborator_profiles cp
  INNER JOIN user_roles ur ON ur.user_id = cp.user_id AND ur.role = 'collaborator'
  ORDER BY (
    SELECT COUNT(*)
    FROM discipleship_contacts dc
    WHERE dc.assigned_collaborator_id = cp.user_id
  ) ASC
  LIMIT 1;
  
  RETURN v_collaborator_id;
END;
$$;

-- Criar trigger para atribuição automática
CREATE OR REPLACE FUNCTION public.auto_assign_collaborator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assigned_collaborator uuid;
BEGIN
  -- Se já foi atribuído manualmente, não fazer nada
  IF NEW.assigned_collaborator_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar colaborador mais próximo
  v_assigned_collaborator := public.find_nearest_collaborator(
    NEW.neighborhood,
    NEW.city
  );
  
  -- Atribuir colaborador se encontrado
  IF v_assigned_collaborator IS NOT NULL THEN
    NEW.assigned_collaborator_id := v_assigned_collaborator;
    NEW.assigned_at := now();
    NEW.assigned_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger antes de inserir
DROP TRIGGER IF EXISTS trigger_auto_assign_collaborator ON public.discipleship_contacts;
CREATE TRIGGER trigger_auto_assign_collaborator
  BEFORE INSERT ON public.discipleship_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_collaborator();

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.discipleship_contacts;