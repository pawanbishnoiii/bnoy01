ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_type text NOT NULL DEFAULT 'personal';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz;
CREATE INDEX IF NOT EXISTS bookings_status_date_idx ON public.bookings(status, booking_date);
