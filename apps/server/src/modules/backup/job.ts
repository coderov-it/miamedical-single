import { access, stat } from 'node:fs/promises';

import type { Database } from '@mia/db';
import type { FileUploader } from '@mia/media';

import { runPgDump } from './dump.ts';
import type { BackupTarget } from './naming.ts';
import * as repo from './repo.ts';
import { ensureUploaded } from './upload.ts';

const MAX_ERROR_CHARS = 1000;

/**
 * One backup, scheduled or manual: dump unless the file is already on disk, record its
 * size, make sure R2 holds it, and write each step to the log row. Never throws —
 * a failure is logged and recorded. A dump that landed but did not upload stays
 * `succeeded` with `uploadedAt` null and the upload message in `error`.
 */
export async function runBackupJob(
  db: Database,
  uploader: FileUploader,
  databaseUrl: string,
  target: BackupTarget,
  rowId: string,
): Promise<void> {
  try {
    if (!(await exists(target.localPath))) {
      await runPgDump(databaseUrl, target.localPath);
    }
    const { size } = await stat(target.localPath);
    await repo.markSucceeded(db, rowId, size);
    console.log(`[backup] dumped ${target.fileName} (${(size / 1_048_576).toFixed(1)} MB)`);
  } catch (error) {
    await recordFailure(db, rowId, 'dump failed', error, repo.markFailed);
    return;
  }

  try {
    await ensureUploaded(uploader, target.r2Key, target.localPath);
    await repo.markUploaded(db, rowId);
  } catch (error) {
    await recordFailure(db, rowId, 'R2 upload failed', error, repo.markUploadFailed);
  }
}

async function recordFailure(
  db: Database,
  rowId: string,
  what: string,
  error: unknown,
  write: (db: Database, id: string, message: string) => Promise<void>,
): Promise<void> {
  console.error(`[backup] ${what}`, error);
  const message = (error instanceof Error ? error.message : String(error)).slice(
    0,
    MAX_ERROR_CHARS,
  );
  await write(db, rowId, message).catch((writeError: unknown) =>
    console.error('[backup] could not write the log row', writeError),
  );
}

export async function exists(file: string): Promise<boolean> {
  return access(file).then(
    () => true,
    () => false,
  );
}
