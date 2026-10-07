ALTER TABLE public.truecaller_settings ADD COLUMN app_key text NOT NULL DEFAULT '', ADD COLUMN enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN phone text, ADD COLUMN country_code text, ADD COLUMN first_name text, ADD COLUMN last_name text, ADD COLUMN gender text, ADD COLUMN city text, ADD COLUMN company text, ADD COLUMN job_title text, ADD COLUMN verified_name boolean NOT NULL DEFAULT false, ADD COLUMN truecaller_last_seen timestamptz, ADD COLUMN email_verified boolean NOT NULL DEFAULT false, ADD COLUMN phone_verified boolean NOT NULL DEFAULT false;
UPDATE public.profiles SET email = NULLIF(lower(trim(email)), '');
CREATE UNIQUE INDEX profiles_email_normalized_unique ON public.profiles (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL;
CREATE OR REPLACE FUNCTION public.validate_profile_identity() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 NEW.email := NULLIF(lower(trim(NEW.email)), '');
 IF NEW.phone IS NOT NULL AND NEW.phone !~ '^\+[1-9][0-9]{6,14}$' THEN RAISE EXCEPTION 'Phone must use E.164 format'; END IF;
 IF current_user = 'authenticated' THEN
  IF TG_OP = 'INSERT' AND (NEW.phone IS NOT NULL OR NEW.email IS NOT NULL OR NEW.phone_verified OR NEW.email_verified OR NEW.verified_name) THEN RAISE EXCEPTION 'Identity must be verified by the server'; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.phone IS DISTINCT FROM OLD.phone OR NEW.email IS DISTINCT FROM OLD.email OR NEW.phone_verified IS DISTINCT FROM OLD.phone_verified OR NEW.email_verified IS DISTINCT FROM OLD.email_verified OR NEW.verified_name IS DISTINCT FROM OLD.verified_name) THEN RAISE EXCEPTION 'Identity must be verified by the server'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER profiles_identity_validation BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_profile_identity();
CREATE TABLE public.truecaller_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 proof_hash text NOT NULL,
 user_id uuid,
 status text NOT NULL DEFAULT 'pending',
 verified_profile jsonb,
 error text,
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.truecaller_requests TO service_role;
ALTER TABLE public.truecaller_requests ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_login_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id),
 login_method text NOT NULL,
 ip_address text, city text, state text, country text, timezone text, isp text,
 device_type text, device_name text, browser text, os text, screen_size text,
 login_at timestamptz NOT NULL DEFAULT now(),
 is_suspicious boolean NOT NULL DEFAULT false,
 session_key text NOT NULL,
 UNIQUE (user_id, session_key)
);
GRANT SELECT ON public.user_login_logs TO authenticated;
GRANT ALL ON public.user_login_logs TO service_role;
ALTER TABLE public.user_login_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own and admin login logs" ON public.user_login_logs FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.checkout_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id),
 project_id uuid NOT NULL REFERENCES public.projects(id),
 amount integer NOT NULL,
 provider_order_id text UNIQUE,
 status text NOT NULL DEFAULT 'pending',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.checkout_orders TO authenticated;
GRANT ALL ON public.checkout_orders TO service_role;
ALTER TABLE public.checkout_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own and admin checkout orders" ON public.checkout_orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
REVOKE INSERT, UPDATE, DELETE ON public.purchases FROM authenticated;
