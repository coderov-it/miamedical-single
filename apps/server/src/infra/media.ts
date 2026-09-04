/**
 * The two media singletons the app wires everywhere, built from `env`.
 *
 * The implementations live in `@mia/media` because the catalogue sync in
 * `@mia/catalog` runs the same encoder and the same uploader; this file is
 * only the server's copy of the wiring — its credentials, its WebP quality.
 */
import { R2FileUploader, SharpImageConverter } from '@mia/media';
import type { FileUploader, ImageConverter } from '@mia/media';

import { env } from '../config/env.ts';

export const imageConverter: ImageConverter = new SharpImageConverter(env.MEDIA_WEBP_QUALITY);

export const r2FileUploader: FileUploader = new R2FileUploader({
  accountId: env.R2_ACCOUNT_ID,
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  bucket: env.R2_BUCKET,
});
