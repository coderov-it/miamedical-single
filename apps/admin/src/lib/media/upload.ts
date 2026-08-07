import { MEDIA_PROFILES, type MediaProfileName } from '@mia/validators';
import { env } from '$env/dynamic/public';

import { api } from '../api';

export interface UploadResult {
  /** Staging path — becomes real when the owning entity is saved. */
  path: string;
  mimeType: string;
}

/** Same base the RPC client uses: empty → same-origin, the Vite proxy in dev. */
const baseUrl = env.PUBLIC_ADMIN_API_URL ?? '';

/**
 * The whole client side of the upload flow: one multipart POST through the
 * API. The server does the heavy lifting — images are converted to WebP and
 * resized there (sharp), SVG and video/PDF pass through untouched. The
 * checks here only exist for a fast local error; the server re-checks all
 * of them where it actually counts.
 */
export async function uploadFile(
  file: File,
  profile: MediaProfileName,
  onProgress?: (fraction: number) => void,
): Promise<UploadResult> {
  const { source } = MEDIA_PROFILES[profile];
  if (!(source.mime as readonly string[]).includes(file.type)) {
    throw new Error(`This slot accepts: ${source.mime.join(', ')}.`);
  }
  if (file.size > source.maxBytes) {
    throw new Error(`File is too large (max ${Math.round(source.maxBytes / 1_048_576)} MB).`);
  }

  const form = new FormData();
  form.set('profile', profile);
  form.set('file', file);

  // XMLHttpRequest instead of fetch for real upload progress.
  return await new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseUrl}/api/media/upload`);
    xhr.withCredentials = true;
    xhr.responseType = 'json';
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      const body = xhr.response as { data?: UploadResult; error?: { message?: string } } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.data) {
        resolve(body.data);
      } else {
        reject(new Error(body?.error?.message ?? `Upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed — network error.'));
    xhr.send(form);
  });
}

/** Cancel an upload that will not be saved. Best-effort. */
export async function discardUpload(path: string): Promise<void> {
  await api.api.media.object.$delete({ json: { path } }).catch(() => undefined);
}
