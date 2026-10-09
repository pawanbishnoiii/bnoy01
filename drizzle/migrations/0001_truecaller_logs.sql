CREATE TABLE public.truecaller_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid,
  stage text NOT NULL,
  message text NOT NULL,
  details jsonb,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.truecaller_logs TO authenticated;
GRANT ALL ON public.truecaller_logs TO service_role;
ALTER TABLE public.truecaller_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read truecaller logs" ON public.truecaller_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete truecaller logs" ON public.truecaller_logs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX truecaller_logs_created_idx ON public.truecaller_logs (created_at DESC);