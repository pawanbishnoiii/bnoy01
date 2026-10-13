// Picture buckets that are publicly readable straight from storage.
export const PUBLIC_MEDIA_BUCKETS = ['project-assets', 'avatars', 'project-images', 'app-assets'] as const;

const STORAGE_BASE = `${(import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://kwglwvbtjkrsdndgnecf.supabase.co'}/storage/v1/object/public`;

const enc = (path: string) => path.split('/').map((p) => encodeURIComponent(decodeURIComponent(p))).join('/');

/** Permanent storage URL for an uploaded picture; works on every domain (Lovable, Vercel, custom). */
export function mediaUrl(bucket: string, path: string) {
  return `${STORAGE_BASE}/${bucket}/${enc(path)}`;
}

/** Rewrites old proxy links, old project storage links and domain-bound links to the storage URL. */
export function fixMediaUrl(url?: string | null) {
  if (!url) return url ?? '';
  const proxy = url.match(/\/api\/public\/media\/([^/]+)\/(.+)$/);
  if (proxy && (PUBLIC_MEDIA_BUCKETS as readonly string[]).includes(proxy[1])) return mediaUrl(proxy[1], proxy[2]);
  const direct = url.match(/^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (direct && (PUBLIC_MEDIA_BUCKETS as readonly string[]).includes(direct[1])) return mediaUrl(direct[1], direct[2]);
  return url;
}

/** Drop-in for storage getPublicUrl(). */
export function publicMedia(bucket: string, path: string) {
  return { data: { publicUrl: mediaUrl(bucket, path) } };
}
