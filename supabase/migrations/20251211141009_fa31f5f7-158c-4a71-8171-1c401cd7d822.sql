-- Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  event_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  max_participants integer,
  cover_image_url text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create event_registrations table
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  registered_at timestamp with time zone DEFAULT now(),
  checked_in boolean DEFAULT false,
  checked_in_at timestamp with time zone,
  checked_in_by uuid,
  UNIQUE(event_id, user_id)
);

-- Create event_reminders table
CREATE TABLE public.event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reminder_time timestamp with time zone NOT NULL,
  sent boolean DEFAULT false,
  sent_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Events viewable by authenticated" ON public.events
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and volunteers can create events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'volunteer'));

CREATE POLICY "Admins and volunteers can update events" ON public.events
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'volunteer'));

CREATE POLICY "Admins can delete events" ON public.events
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Event registrations policies
CREATE POLICY "Users can register themselves" ON public.event_registrations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view registrations" ON public.event_registrations
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'volunteer'));

CREATE POLICY "Users can cancel own registration" ON public.event_registrations
FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins and volunteers can check-in" ON public.event_registrations
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'volunteer'));

-- Event reminders policies (managed by system)
CREATE POLICY "Admins can manage reminders" ON public.event_reminders
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view reminders for their registered events" ON public.event_reminders
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.event_registrations er
  WHERE er.event_id = event_reminders.event_id
  AND er.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);

-- Storage policies for events bucket
CREATE POLICY "Event images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'events');

CREATE POLICY "Admins and volunteers can upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'events' AND 
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'volunteer'))
);

CREATE POLICY "Admins and volunteers can update event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'events' AND 
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'volunteer'))
);

CREATE POLICY "Admins can delete event images" ON storage.objects
FOR DELETE USING (bucket_id = 'events' AND has_role(auth.uid(), 'admin'));