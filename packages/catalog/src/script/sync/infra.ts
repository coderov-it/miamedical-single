/**
 * The encoder and the bucket this script writes through, read from the process
 * environment.
 *
 * Both come from `@mia/media`, which is the whole point of that package: an
 * object this sync uploads and one a person dragged into the admin panel have
 * to be byte-identical afterwards, and the only way to guarantee that is for
 * both to run the same encoder rather than two copies of it.
 *
 * Unlike the server, there is no boot guard here and there is no `env` schema —
 * a CLI is allowed to run with no R2 configured at all, because `--skip-media`
 * and `--dry-run` are both useful without it. `R2FileUploader` defers its
 * failure to the first call and names the variables it wanted, so the run that
 * needs credentials is the run that reports them missing.
 */
import { R2FileUploader, SharpImageConverter } from '@mia/media';
import type { FileUploader, ImageConverter } from '@mia/media';

/** The server's own default, restated because there is no shared config to read. */
const DEFAULT_WEBP_QUALITY = 92;

const quality = Number(process.env['MEDIA_WEBP_QUALITY'] ?? DEFAULT_WEBP_QUALITY);

export const imageConverter: ImageConverter = new SharpImageConverter(
  Number.isFinite(quality) && quality >= 1 && quality <= 100 ? quality : DEFAULT_WEBP_QUALITY,
);

export const uploader: FileUploader = new R2FileUploader({
  accountId: process.env['R2_ACCOUNT_ID'],
  accessKeyId: process.env['R2_ACCESS_KEY_ID'],
  secretAccessKey: process.env['R2_SECRET_ACCESS_KEY'],
  bucket: process.env['R2_BUCKET'],
});
