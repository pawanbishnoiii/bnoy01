CREATE TABLE public.system_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  status text NOT NULL,
  ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.system_checks TO authenticated;
GRANT ALL ON public.system_checks TO service_role;
ALTER TABLE public.system_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read checks" ON public.system_checks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write checks" ON public.system_checks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX system_checks_time_idx ON public.system_checks(created_at DESC);

CREATE TABLE public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL UNIQUE,
  folder text NOT NULL DEFAULT '/',
  mime text,
  size bigint NOT NULL DEFAULT 0,
  starred boolean NOT NULL DEFAULT false,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_files TO authenticated;
GRANT ALL ON public.media_files TO service_role;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage media" ON public.media_files FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins media-cloud select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media-cloud' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins media-cloud insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media-cloud' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins media-cloud update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media-cloud' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins media-cloud delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media-cloud' AND public.has_role(auth.uid(), 'admin'));