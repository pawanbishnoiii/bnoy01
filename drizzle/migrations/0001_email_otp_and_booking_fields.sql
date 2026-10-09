CREATE TABLE IF NOT EXISTS public.email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_otps TO service_role;
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS email_otps_user_idx ON public.email_otps(user_id, created_at DESC);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS preferred_contact text;