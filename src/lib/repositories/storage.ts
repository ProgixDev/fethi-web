/**
 * Storage path → public URL helper (server-side).
 *
 * Avatars live in the public `avatars` bucket, listing photos in the public
 * `listing-photos` bucket (SCR-001). We store only the object path in the DB;
 * the browser-facing URL is built from NEXT_PUBLIC_SUPABASE_URL. A stored path
 * that is already an absolute URL is returned as-is.
 */
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export function publicStorageUrl(
  bucket: 'avatars' | 'listing-photos',
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (!BASE) return null;
  const clean = path.replace(/^\/+/, '');
  return `${BASE}/storage/v1/object/public/${bucket}/${clean}`;
}
