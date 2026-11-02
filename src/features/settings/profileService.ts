import { bffFetch, toUser, type MeResponse } from '@/shared/lib/bff';
import { useAuthStore } from '@/shared/lib/store';
import type { User } from '@/shared/types/auth';

/**
 * Settings > Profile against the backend (auth-service, the caller's own account; every role):
 *   PATCH  /api/v1/me/profile  { name, phone, address }   -> /me
 *   PUT    /api/v1/me/avatar   raw PNG / JPEG / WebP body  -> /me   (at most 256 KB)
 *   DELETE /api/v1/me/avatar                              -> /me
 *   GET    /api/v1/me/avatar   the image (User.logoUrl points here)
 * Email is the sign-in address and read-only here. Each call returns the fresh /me, which replaces the signed-in user.
 */

/** The server's limit; photos are shrunk in the browser to fit it. */
const AVATAR_MAX_BYTES = 256 * 1024;
/** Longest side of the stored avatar (it is shown at most ~112 px wide). */
const AVATAR_MAX_SIDE = 512;

function apply(me: MeResponse): User {
  const user = toUser(me);
  useAuthStore.setState({ user });
  return user;
}

export async function saveProfile(p: { name: string; phone: string; address: string }): Promise<User> {
  return apply(await bffFetch<MeResponse>('/api/v1/me/profile', { method: 'PATCH', json: p }));
}

export async function uploadAvatar(file: Blob): Promise<User> {
  const image = await shrinkImage(file);
  return apply(await bffFetch<MeResponse>('/api/v1/me/avatar', { method: 'PUT', body: image, headers: { 'content-type': image.type } }));
}

export async function deleteAvatar(): Promise<User> {
  return apply(await bffFetch<MeResponse>('/api/v1/me/avatar', { method: 'DELETE' }));
}

/**
 * Scales the photo down to AVATAR_MAX_SIDE and re-encodes it (WebP, else JPEG) until it fits AVATAR_MAX_BYTES. A small PNG / JPEG /
 * WebP that already fits is sent as it is. Re-encoding also drops photo metadata such as GPS location.
 */
export async function shrinkImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const fits = file.size <= AVATAR_MAX_BYTES && Math.max(bitmap.width, bitmap.height) <= AVATAR_MAX_SIDE;
    if (fits && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return file;
    const scale = Math.min(1, AVATAR_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const type of ['image/webp', 'image/jpeg']) {
      for (const quality of [0.9, 0.8, 0.65, 0.5]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
        // Some browsers fall back to PNG when they cannot write the asked type; try the next type then.
        if (blob && blob.type === type && blob.size <= AVATAR_MAX_BYTES) return blob;
        if (blob && blob.type !== type) break;
      }
    }
    throw new Error('This image could not be made small enough. Try a smaller photo.');
  } finally {
    bitmap.close();
  }
}
