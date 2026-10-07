CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, role public.app_role NOT NULL DEFAULT 'user', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, role));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, name text, email text, avatar_url text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.apps (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text DEFAULT '', version text DEFAULT '1.0.0', platform text DEFAULT 'android', price integer DEFAULT 0, icon_url text, screenshots_urls text[] DEFAULT '{}', apk_url text, file_size text, changelog text DEFAULT '', download_count integer DEFAULT 0, is_latest boolean DEFAULT true, status text DEFAULT 'draft', created_at timestamptz DEFAULT now());
CREATE TABLE public.auth_settings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), smtp_host text, smtp_port integer DEFAULT 587, smtp_user text, smtp_secure boolean NOT NULL DEFAULT true, smtp_from_email text, smtp_from_name text, smtp_enabled boolean NOT NULL DEFAULT false, email_login_enabled boolean NOT NULL DEFAULT true, google_login_enabled boolean NOT NULL DEFAULT true, google_auth_mode text NOT NULL DEFAULT 'managed', google_client_id text, google_callback_url text, notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE, icon text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body text NOT NULL DEFAULT '', banner_url text, tag text, url text, audience text NOT NULL DEFAULT 'all', target_user_id uuid, status text NOT NULL DEFAULT 'draft', sent_count integer NOT NULL DEFAULT 0, failed_count integer NOT NULL DEFAULT 0, error text, sent_at timestamptz, created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
CREATE TABLE public.projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, short_desc text NOT NULL DEFAULT '', full_desc text NOT NULL DEFAULT '', price integer NOT NULL DEFAULT 0, category text[] NOT NULL DEFAULT '{}', tech_stack text[] NOT NULL DEFAULT '{}', thumbnail_url text, screenshots text[] NOT NULL DEFAULT '{}', video_url text, preview_url text, source_code_url text, featured boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now(), discount_price integer, version text DEFAULT 'v1.0', screenshots_urls text[] DEFAULT '{}', changelog jsonb DEFAULT '[]', views_count integer DEFAULT 0, likes_count integer DEFAULT 0, lov_email text, project_url text, preview_enabled boolean NOT NULL DEFAULT true, slug text, demo_admin_email text, demo_admin_password text, preview_watermark text, external_url_enabled boolean NOT NULL DEFAULT false, project_type text NOT NULL DEFAULT 'website', seo_title text, seo_description text, seo_keywords text[] NOT NULL DEFAULT '{}', og_image_url text, noindex boolean NOT NULL DEFAULT false);
CREATE UNIQUE INDEX projects_slug_unique ON public.projects(slug) WHERE slug IS NOT NULL;
CREATE TABLE public.project_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL, user_id uuid NOT NULL, content text NOT NULL, rating integer CHECK (rating >= 1 AND rating <= 5), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.project_likes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL, user_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id, user_id));
CREATE TABLE public.project_versions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, version text NOT NULL, released_at date NOT NULL DEFAULT CURRENT_DATE, notes text, changelog text, source_code_url text, preview_url text, thumbnail_url text, is_latest boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), short_desc text DEFAULT '', full_desc text DEFAULT '', price integer, discount_price integer, screenshots text[] NOT NULL DEFAULT '{}', video_url text, app_file_url text, file_size text, external_url_enabled boolean NOT NULL DEFAULT false, seo_title text, seo_description text);
CREATE INDEX project_versions_project_idx ON public.project_versions(project_id);
CREATE TABLE public.purchases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, amount integer NOT NULL DEFAULT 0, razorpay_payment_id text, created_at timestamptz NOT NULL DEFAULT now(), status text DEFAULT 'success');
CREATE TABLE public.push_subscribers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, token text NOT NULL UNIQUE, user_agent text, platform text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), enabled boolean NOT NULL DEFAULT true);
CREATE TABLE public.site_settings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), whatsapp_number text DEFAULT '+919999999999', support_email text DEFAULT 'help@devmarket.in', phone text DEFAULT '+91 99999 99999', address text DEFAULT 'Bengaluru, Karnataka, India', social_github text DEFAULT 'https://github.com', social_twitter text DEFAULT 'https://twitter.com', social_linkedin text DEFAULT 'https://linkedin.com', social_instagram text DEFAULT 'https://instagram.com', social_youtube text DEFAULT '', refund_policy text, updated_at timestamptz NOT NULL DEFAULT now(), hero_video_url text, brand_name text DEFAULT 'Bnoy Studios', brand_tagline text DEFAULT 'Premium web & mobile projects, ready to ship.', logo_url text, banner_url text, hero_lottie_url text, hero_bg_url text, hero_badge text, hide_watermarks boolean NOT NULL DEFAULT true, google_verify_file_name text, google_verify_file_content text, elevenlabs_agent_id text, ai_section_enabled boolean NOT NULL DEFAULT true, google_auth_mode text NOT NULL DEFAULT 'managed', google_client_id text, google_redirect_uri text, ai_system_prompt text, google_site_verification text, bing_site_verification text, site_url text);
CREATE TABLE public.wishlists (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, project_id));

CREATE TABLE public.visitor_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), visitor_id text NOT NULL, user_id uuid, ip text, country text, region text, city text, postal text, latitude double precision, longitude double precision, isp text, timezone text, device_type text, device_name text, os text, browser text, user_agent text, screen text, language text, referrer text, landing_page text, last_page text, page_views integer NOT NULL DEFAULT 0, total_seconds integer NOT NULL DEFAULT 0, first_seen timestamptz NOT NULL DEFAULT now(), last_seen timestamptz NOT NULL DEFAULT now());
CREATE INDEX visitor_sessions_visitor_idx ON public.visitor_sessions(visitor_id);
CREATE INDEX visitor_sessions_last_seen_idx ON public.visitor_sessions(last_seen DESC);
CREATE TABLE public.page_views (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES public.visitor_sessions(id) ON DELETE CASCADE, path text NOT NULL, title text, duration_seconds integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX page_views_session_idx ON public.page_views(session_id);

GRANT SELECT ON public.apps, public.categories, public.projects, public.project_versions, public.project_comments, public.project_likes, public.site_settings, public.notifications TO anon;
GRANT INSERT, UPDATE ON public.push_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apps, public.auth_settings, public.categories, public.notifications, public.projects, public.project_comments, public.project_likes, public.project_versions, public.purchases, public.push_subscribers, public.site_settings, public.wishlists TO authenticated;
GRANT SELECT, DELETE ON public.visitor_sessions, public.page_views TO authenticated;
GRANT ALL ON public.apps, public.auth_settings, public.categories, public.notifications, public.projects, public.project_comments, public.project_likes, public.project_versions, public.purchases, public.push_subscribers, public.site_settings, public.wishlists, public.visitor_sessions, public.page_views TO service_role;

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  IF lower(NEW.email) IN ('bnoy.studios@gmail.com','a@a.a') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE FUNCTION public.increment_project_views(_project_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.projects SET views_count = COALESCE(views_count,0) + 1 WHERE id = _project_id AND status = 'published';
$$;
GRANT EXECUTE ON FUNCTION public.increment_project_views(uuid) TO anon, authenticated;

CREATE FUNCTION public.sync_project_likes() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.projects SET likes_count = COALESCE(likes_count,0) + 1 WHERE id = NEW.project_id; RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.projects SET likes_count = GREATEST(COALESCE(likes_count,0) - 1, 0) WHERE id = OLD.project_id; RETURN OLD;
  END IF; RETURN NULL;
END; $$;
CREATE TRIGGER trg_project_likes_count AFTER INSERT OR DELETE ON public.project_likes FOR EACH ROW EXECUTE FUNCTION public.sync_project_likes();
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_push_updated_at BEFORE UPDATE ON public.push_subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_versions_updated_at BEFORE UPDATE ON public.project_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_auth_settings_updated_at BEFORE UPDATE ON public.auth_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Public read published apps" ON public.apps FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage apps" ON public.apps FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage auth settings" ON public.auth_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Read sent notifications" ON public.notifications FOR SELECT USING (status = 'sent' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read published projects" ON public.projects FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage projects" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read versions" ON public.project_versions FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.status = 'published') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage versions" ON public.project_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read comments" ON public.project_comments FOR SELECT USING (true);
CREATE POLICY "Users comment" ON public.project_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own comments" ON public.project_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read likes" ON public.project_likes FOR SELECT USING (true);
CREATE POLICY "Users like" ON public.project_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike" ON public.project_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own purchases read" ON public.purchases FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own purchases insert" ON public.purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage purchases" ON public.purchases FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Guests register devices" ON public.push_subscribers FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "Guests refresh devices" ON public.push_subscribers FOR UPDATE TO anon USING (user_id IS NULL) WITH CHECK (user_id IS NULL);
CREATE POLICY "Users register devices" ON public.push_subscribers FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users view devices" ON public.push_subscribers FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users update devices" ON public.push_subscribers FOR UPDATE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users delete devices" ON public.push_subscribers FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own wishlist read" ON public.wishlists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own wishlist insert" ON public.wishlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own wishlist delete" ON public.wishlists FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read visitors" ON public.visitor_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete visitors" ON public.visitor_sessions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read page views" ON public.page_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete page views" ON public.page_views FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE POLICY "Public read public buckets" ON storage.objects FOR SELECT USING (bucket_id IN ('project-assets','avatars','project-images','app-assets'));
CREATE POLICY "Admins manage all buckets" ON storage.objects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='avatars' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='avatars' AND auth.uid()::text=(storage.foldername(name))[1]);
CREATE POLICY "Buyers read source files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('source-code','app-files') AND EXISTS (SELECT 1 FROM public.purchases p WHERE p.user_id=auth.uid() AND p.project_id::text=(storage.foldername(name))[1]));