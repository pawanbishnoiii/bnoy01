CREATE TABLE public.team_members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL DEFAULT '',
 expertise text NOT NULL DEFAULT '',
 image_url text NOT NULL DEFAULT '',
 website_url text NOT NULL DEFAULT '',
 linkedin_url text NOT NULL DEFAULT '',
 instagram_url text NOT NULL DEFAULT '',
 github_url text NOT NULL DEFAULT '',
 x_url text NOT NULL DEFAULT '',
 sort_order integer NOT NULL DEFAULT 0,
 published boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published team members" ON public.team_members FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admin team management" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.truecaller_settings (
 id boolean PRIMARY KEY DEFAULT true,
 app_domain text NOT NULL DEFAULT 'https://bnoy01.lovable.app',
 callback_url text NOT NULL DEFAULT 'https://bnoy01.lovable.app/auth/true-sdk',
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT truecaller_singleton CHECK (id = true)
);
GRANT SELECT, INSERT, UPDATE ON public.truecaller_settings TO authenticated;
GRANT ALL ON public.truecaller_settings TO service_role;
ALTER TABLE public.truecaller_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin Truecaller management" ON public.truecaller_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER truecaller_settings_updated BEFORE UPDATE ON public.truecaller_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.apps ADD COLUMN architecture text NOT NULL DEFAULT 'x64', ADD COLUMN system_requirements text NOT NULL DEFAULT '';
