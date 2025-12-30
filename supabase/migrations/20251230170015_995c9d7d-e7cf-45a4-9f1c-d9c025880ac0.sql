-- Create donation payment settings table
CREATE TABLE public.donation_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_name text NOT NULL,
  pix_key text NOT NULL,
  pix_key_type text CHECK (
    pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')
  ) NOT NULL,
  description text,
  qr_code_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create audit table for payment settings
CREATE TABLE public.donation_payment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.donation_payment_settings(id) ON DELETE CASCADE,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donation_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_payment_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donation_payment_settings
CREATE POLICY "Admins can manage payment settings"
ON public.donation_payment_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active payment settings"
ON public.donation_payment_settings
FOR SELECT
USING (is_active = true);

-- RLS Policies for audit table
CREATE POLICY "Admins can view audit logs"
ON public.donation_payment_audit
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit logs"
ON public.donation_payment_audit
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_donation_payment_settings_updated_at
BEFORE UPDATE ON public.donation_payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();