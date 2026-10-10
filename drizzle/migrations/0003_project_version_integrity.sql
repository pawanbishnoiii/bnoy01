-- Backfill legacy latest releases that were created before full snapshots existed.
UPDATE public.project_versions AS version
SET
  short_desc = COALESCE(version.short_desc, project.short_desc),
  full_desc = COALESCE(version.full_desc, project.full_desc),
  price = COALESCE(version.price, project.price),
  discount_price = COALESCE(version.discount_price, project.discount_price),
  thumbnail_url = COALESCE(version.thumbnail_url, project.thumbnail_url),
  screenshots = CASE
    WHEN cardinality(version.screenshots) = 0 THEN project.screenshots
    ELSE version.screenshots
  END,
  video_url = COALESCE(version.video_url, project.video_url),
  preview_url = COALESCE(version.preview_url, project.preview_url),
  source_code_url = COALESCE(version.source_code_url, project.source_code_url),
  seo_title = COALESCE(version.seo_title, project.seo_title),
  seo_description = COALESCE(version.seo_description, project.seo_description),
  updated_at = now()
FROM public.projects AS project
WHERE version.project_id = project.id
  AND version.is_latest = true;

CREATE UNIQUE INDEX IF NOT EXISTS project_versions_project_version_unique
  ON public.project_versions (project_id, lower(version));

CREATE UNIQUE INDEX IF NOT EXISTS project_versions_one_latest_unique
  ON public.project_versions (project_id)
  WHERE is_latest = true;

COMMENT ON TABLE public.project_versions IS
  'Independent release snapshots. projects mirrors the release marked is_latest.';
