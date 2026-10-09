CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  project_type text NOT NULL DEFAULT 'web',
  budget text,
  details text,
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_date, booking_time)
);
GRANT SELECT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage bookings" ON public.bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users read own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  template text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read email logs" ON public.email_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.email_theme (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  accent_color text NOT NULL DEFAULT '#f97316',
  logo_url text,
  footer_text text NOT NULL DEFAULT 'Bnoy Studios · We turn ideas into real software.',
  from_name text NOT NULL DEFAULT 'Bnoy Studios',
  signup_enabled boolean NOT NULL DEFAULT true,
  booking_enabled boolean NOT NULL DEFAULT true,
  product_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.email_theme TO authenticated;
GRANT ALL ON public.email_theme TO service_role;
ALTER TABLE public.email_theme ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email theme" ON public.email_theme FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.email_theme (id) VALUES (true) ON CONFLICT DO NOTHING;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_email_sent boolean NOT NULL DEFAULT false;