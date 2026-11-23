import type { Database } from '@mia/db';
import type { FileUploader } from '@mia/media';

import type { BackupFeature } from '../../config/features.ts';
import { conflict } from '../../shared/http/errors.ts';
import { runBackupJob } from './job.ts';
import { manualTarget } from './naming.ts';
import type { BackupRow } from './repo.ts';
import { insertRun } from './repo.ts';

/**
 * An operator-triggered backup, kept apart from the schedule: no advisory lock, so it
 * neither waits for nor blocks the 4h dump. One at a time per process (`inFlight`);
 * files go to `<folder>/manual_<day>/` and are never auto-pruned.
 * Returns the `running` row at once; the dump continues in the background.
 */
let inFlight = false;

export async function startManualBackup(
  db: Database,
  uploader: FileUploader,
  backup: BackupFeature,
  name: string,
  adminUserId: string,
): Promise<BackupRow> {
  if (inFlight) throw conflict('A manual backup is already running.');
  inFlight = true;
  try {
    const target = manualTarget(backup, name, new Date());
    const row = await insertRun(db, {
      kind: 'manual',
      folder: backup.folder,
      name,
      target,
      adminUserId,
    });
    if (!row) throw conflict('A backup with this name already exists this minute.');
    void runBackupJob(db, uploader, backup.databaseUrl, target, row.id).finally(() => {
      inFlight = false;
    });
    return row;
  } catch (error) {
    inFlight = false;
    throw error;
  }
}
