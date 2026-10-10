ALTER TABLE public.bookings ALTER COLUMN email DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.get_taken_booking_slots(requested_date date)
RETURNS TABLE (booking_time text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bookings.booking_time
  FROM public.bookings
  WHERE bookings.booking_date = requested_date
    AND bookings.status NOT IN ('cancelled');
$$;

CREATE OR REPLACE FUNCTION public.submit_booking(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_id uuid := gen_random_uuid();
  contact_identity text := lower(coalesce(nullif(payload->>'email', ''), nullif(payload->>'phone', ''), nullif(payload->>'whatsapp', '')));
  requested_date date;
  requested_time time;
BEGIN
  IF length(trim(coalesce(payload->>'name', ''))) NOT BETWEEN 2 AND 80 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;
  IF coalesce(payload->>'project_type', '') NOT IN ('web', 'app', 'automation', 'software', 'windows', 'other') THEN
    RAISE EXCEPTION 'Invalid project type';
  END IF;
  IF coalesce(payload->>'preferred_contact', '') NOT IN ('call', 'whatsapp', 'email') THEN
    RAISE EXCEPTION 'Invalid contact type';
  END IF;
  IF coalesce(payload->>'booking_date', '') !~ '^\d{4}-\d{2}-\d{2}$'
     OR coalesce(payload->>'booking_time', '') !~ '^([01]\d|2[0-3]):[0-5]\d$' THEN
    RAISE EXCEPTION 'Invalid appointment time';
  END IF;

  requested_date := (payload->>'booking_date')::date;
  requested_time := (payload->>'booking_time')::time;
  IF extract(isodow FROM requested_date) = 7
     OR (requested_date + requested_time) AT TIME ZONE 'Asia/Kolkata' <= now() THEN
    RAISE EXCEPTION 'Appointment must be in the future';
  END IF;
  IF contact_identity IS NULL THEN RAISE EXCEPTION 'Contact is required'; END IF;
  IF (SELECT count(*) FROM public.bookings
      WHERE created_at >= now() - interval '1 hour'
        AND lower(coalesce(nullif(email, ''), nullif(phone, ''), nullif(whatsapp, ''))) = contact_identity) >= 3 THEN
    RAISE EXCEPTION 'Too many booking requests';
  END IF;

  INSERT INTO public.bookings (
    id, name, email, phone, whatsapp, age, gender, address, city, pincode,
    customer_type, company, preferred_contact, project_type, budget, details,
    booking_date, booking_time, status
  ) VALUES (
    booking_id,
    trim(payload->>'name'),
    nullif(lower(trim(payload->>'email')), ''),
    nullif(trim(payload->>'phone'), ''),
    nullif(trim(payload->>'whatsapp'), ''),
    CASE WHEN coalesce(payload->>'age', '') ~ '^\d{1,3}$' THEN (payload->>'age')::int ELSE NULL END,
    nullif(payload->>'gender', ''),
    nullif(trim(payload->>'address'), ''),
    coalesce(trim(payload->>'city'), ''),
    nullif(trim(payload->>'pincode'), ''),
    CASE WHEN payload->>'customer_type' = 'company' THEN 'company' ELSE 'personal' END,
    CASE WHEN payload->>'customer_type' = 'company' THEN nullif(trim(payload->>'company'), '') ELSE NULL END,
    payload->>'preferred_contact',
    payload->>'project_type',
    nullif(payload->>'budget', ''),
    nullif(left(trim(payload->>'details'), 2000), ''),
    requested_date,
    to_char(requested_time, 'HH24:MI'),
    'pending'
  );
  RETURN booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_taken_booking_slots(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_booking(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_taken_booking_slots(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_booking(jsonb) TO anon, authenticated;
