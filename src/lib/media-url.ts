// Picture buckets readable by everyone (storage policy "Public read public buckets").
export const PUBLIC_MEDIA_BUCKETS = ['project-assets', 'avatars', 'project-images', 'app-assets'] as const;

/** Stable site URL for an uploaded picture, served by /api/public/media. */
export function mediaUrl(bucket: string, path: string) {
  return `/api/public/media/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/** Rewrites old direct storage links (which fail on private buckets) to the media route. */
export function fixMediaUrl(url?: string | null) {
  if (!url) return url ?? '';
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  return m && (PUBLIC_MEDIA_BUCKETS as readonly string[]).includes(m[1]) ? `/api/public/media/${m[1]}/${m[2]}` : url;
}

/** Drop-in for storage getPublicUrl() that works with private picture buckets. */
export function publicMedia(bucket: string, path: string) {
  return { data: { publicUrl: mediaUrl(bucket, path) } };
}
