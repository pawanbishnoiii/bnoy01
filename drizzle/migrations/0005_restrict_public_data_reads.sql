DROP POLICY IF EXISTS "Public read site settings" ON public.site_settings;
REVOKE SELECT ON public.site_settings FROM anon;
CREATE OR REPLACE VIEW public.site_settings_public WITH (security_barrier = true) AS
SELECT
  brand_name,
  brand_tagline,
  logo_url,
  banner_url,
  hero_video_url,
  hero_lottie_url,
  hero_bg_url,
  hero_badge,
  hide_watermarks,
  whatsapp_number,
  support_email,
  address,
  social_github,
  social_twitter,
  social_linkedin,
  social_instagram,
  social_youtube,
  refund_policy,
  google_auth_mode,
  google_site_verification,
  bing_site_verification,
  site_url,
  ga_measurement_id,
  gtm_id,
  google_verify_file_name,
  google_verify_file_content
FROM public.site_settings;
GRANT SELECT ON public.site_settings_public TO anon, authenticated;

DROP POLICY IF EXISTS "Public read comments" ON public.project_comments;
CREATE POLICY "Users read own or admin comments"
  ON public.project_comments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE OR REPLACE VIEW public.public_project_comments WITH (security_barrier = true) AS
SELECT
  c.project_id,
  c.content,
  c.rating,
  c.created_at,
  COALESCE(NULLIF(p.name, ''), 'Member') AS reviewer_name,
  p.avatar_url AS reviewer_avatar
FROM public.project_comments AS c
JOIN public.projects AS pr ON pr.id = c.project_id AND pr.status = 'published'
LEFT JOIN public.profiles AS p ON p.id = c.user_id;
GRANT SELECT ON public.public_project_comments TO anon, authenticated;
REVOKE SELECT ON public.project_comments FROM anon;

DROP POLICY IF EXISTS "Public read likes" ON public.project_likes;
CREATE POLICY "Users read own or admin likes"
  ON public.project_likes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE SELECT ON public.project_likes FROM anon;