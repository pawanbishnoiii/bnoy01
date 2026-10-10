ALTER TABLE public.bookings ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN public.truecaller_settings.app_domain IS
  'One or more HTTPS root domains, separated by newlines. Each domain must also be registered in the Truecaller developer console.';
