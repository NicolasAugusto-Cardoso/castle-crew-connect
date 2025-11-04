-- Adicionar campos de endereço e geolocalização a collaborator_profiles
ALTER TABLE public.collaborator_profiles
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS street_number TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS accepting_new BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Adicionar campos de geolocalização a discipleship_contacts
ALTER TABLE public.discipleship_contacts
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS street_number TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS distance_km DOUBLE PRECISION;

-- Função para calcular distância Haversine entre dois pontos (em km)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  r DOUBLE PRECISION := 6371; -- Raio da Terra em km
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$$;

-- Atualizar função de busca do colaborador mais próximo usando geolocalização
CREATE OR REPLACE FUNCTION public.find_nearest_collaborator_geo(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS TABLE(collaborator_id UUID, distance_km DOUBLE PRECISION)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se temos coordenadas válidas, usar cálculo de distância
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      cp.user_id,
      calculate_distance(p_latitude, p_longitude, cp.latitude, cp.longitude) as dist
    FROM collaborator_profiles cp
    INNER JOIN user_roles ur ON ur.user_id = cp.user_id AND ur.role = 'collaborator'
    WHERE cp.latitude IS NOT NULL 
      AND cp.longitude IS NOT NULL
      AND cp.accepting_new = true
    ORDER BY dist ASC
    LIMIT 1;
    
    -- Se encontrou colaborador com geolocalização, retornar
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- Fallback: usar lógica antiga de bairro/cidade
  RETURN QUERY
  SELECT 
    cp.user_id,
    NULL::DOUBLE PRECISION as dist
  FROM collaborator_profiles cp
  INNER JOIN user_roles ur ON ur.user_id = cp.user_id AND ur.role = 'collaborator'
  WHERE (p_neighborhood IS NOT NULL AND LOWER(TRIM(cp.neighborhood)) = LOWER(TRIM(p_neighborhood))
         AND p_city IS NOT NULL AND LOWER(TRIM(cp.city)) = LOWER(TRIM(p_city)))
     OR (p_city IS NOT NULL AND LOWER(TRIM(cp.city)) = LOWER(TRIM(p_city)))
  ORDER BY (
    SELECT COUNT(*)
    FROM discipleship_contacts dc
    WHERE dc.assigned_collaborator_id = cp.user_id
  ) ASC
  LIMIT 1;
END;
$$;

-- Atualizar trigger de atribuição automática para usar geolocalização
CREATE OR REPLACE FUNCTION public.auto_assign_collaborator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Se já foi atribuído manualmente, não fazer nada
  IF NEW.assigned_collaborator_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar colaborador mais próximo usando geolocalização
  SELECT * INTO v_result
  FROM public.find_nearest_collaborator_geo(
    NEW.latitude,
    NEW.longitude,
    NEW.neighborhood,
    NEW.city
  );
  
  -- Atribuir colaborador e distância se encontrado
  IF v_result.collaborator_id IS NOT NULL THEN
    NEW.assigned_collaborator_id := v_result.collaborator_id;
    NEW.assigned_at := now();
    NEW.assigned_by := auth.uid();
    NEW.distance_km := v_result.distance_km;
    NEW.status := 'not_contacted';
  ELSE
    -- Nenhum colaborador disponível
    NEW.assigned_collaborator_id := NULL;
    NEW.status := 'not_contacted';
    NEW.distance_km := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Adicionar índices para melhorar performance de consultas geográficas
CREATE INDEX IF NOT EXISTS idx_collaborator_profiles_geo ON public.collaborator_profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discipleship_contacts_geo ON public.discipleship_contacts(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;