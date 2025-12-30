-- Enum para tipos de cesta
CREATE TYPE public.basket_type AS ENUM ('P', 'M', 'G');

-- Enum para status de doação
CREATE TYPE public.donation_status AS ENUM ('pending', 'reviewing', 'confirmed', 'rejected');

-- Tabela de modelos de cesta
CREATE TABLE public.basket_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type basket_type NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de campanhas de doação
CREATE TABLE public.donation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  goal_amount DECIMAL(10,2),
  goal_baskets INTEGER,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de doações
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  basket_type basket_type NOT NULL,
  campaign_id UUID REFERENCES public.donation_campaigns(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  status donation_status DEFAULT 'pending',
  anonymous BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference_code TEXT UNIQUE NOT NULL,
  receipt_url TEXT,
  donor_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Habilitar RLS
ALTER TABLE public.basket_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS para basket_models
CREATE POLICY "Basket models viewable by everyone"
ON public.basket_models FOR SELECT
USING (true);

CREATE POLICY "Admins can manage basket models"
ON public.basket_models FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS para donation_campaigns
CREATE POLICY "Campaigns viewable by everyone"
ON public.donation_campaigns FOR SELECT
USING (true);

CREATE POLICY "Admins can manage campaigns"
ON public.donation_campaigns FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS para donations
CREATE POLICY "Users can create donations"
ON public.donations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own donations"
ON public.donations FOR SELECT
USING (user_id = auth.uid() OR anonymous = false);

CREATE POLICY "Users can update own pending donations"
ON public.donations FOR UPDATE
USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins and volunteers can view all donations"
ON public.donations FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'volunteer'));

CREATE POLICY "Admins and volunteers can update donations"
ON public.donations FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'volunteer'));

CREATE POLICY "Admins can delete donations"
ON public.donations FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_basket_models_updated_at
BEFORE UPDATE ON public.basket_models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donation_campaigns_updated_at
BEFORE UPDATE ON public.donation_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir modelos padrão
INSERT INTO public.basket_models (type, title, description, price) VALUES
('P', 'Cesta Pequena', 'Cesta básica com itens essenciais para uma família pequena', 50.00),
('M', 'Cesta Média', 'Cesta básica completa com itens essenciais para uma família média', 100.00),
('G', 'Cesta Grande', 'Cesta básica completa com itens essenciais para uma família grande', 150.00);