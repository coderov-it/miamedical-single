import { R2FileUploader } from '@mia/media';
import type { FileUploader } from '@mia/media';

import { FEATURES } from '../config/features.ts';

/*
 * The backup bucket is private and separate from the public media bucket, so it
 * gets its own uploader instead of the media singleton in infra/media.ts.
 * Built once at boot; null when backups are off.
 */
function createBackupUploader(): FileUploader | null {
  if (!FEATURES.backup) return null;
  const { accountId, accessKeyId, secretAccessKey, bucket } = FEATURES.backup.storage;
  return new R2FileUploader({ accountId, accessKeyId, secretAccessKey, bucket });
}

export const backupUploader: FileUploader | null = createBackupUploader();
