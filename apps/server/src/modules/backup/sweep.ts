import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';

import type { Database } from '@mia/db';
import { sql } from '@mia/db';
import type { FileUploader } from '@mia/media';

import type { BackupFeature } from '../../config/features.ts';
import { exists, runBackupJob } from './job.ts';
import type { BackupTarget } from './naming.ts';
import { expiredDays, scheduledTarget, slotStart } from './naming.ts';
import type { BackupRow } from './repo.ts';
import { failStaleRuns, findByR2Key, insertRun, markRetry } from './repo.ts';
import { ensureUploaded, pruneRemote } from './upload.ts';

/**
 * Database dumps every 4h UTC: a copy on disk, a copy in the private backup bucket.
 * Both copies are pruned by code (10 days kept); the R2 prune runs only after a
 * successful upload, so old backups go only once a new one has landed.
 * Checked on boot and every 10 minutes; the slot's file name makes a repeat a no-op.
 * Walkthrough: docs/code/db-backup.md.
 */
const TICK_MS = 10 * 60_000;

/** Serialises pm2 workers; analytics uses 7_301_001n. */
const BACKUP_LOCK = 7_301_002n;

let running = false;

export function startBackupSweep(
  db: Database,
  uploader: FileUploader,
  backup: BackupFeature,
): void {
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runTick(db, uploader, backup);
    } catch (error) {
      console.error('[backup] tick failed', error);
    } finally {
      running = false;
    }
  };
  void tick();
  setInterval(tick, TICK_MS).unref();
}

async function runTick(db: Database, uploader: FileUploader, backup: BackupFeature) {
  const now = new Date();
  const target = scheduledTarget(backup, slotStart(now));

  /* The lock is held until the callback returns, so everything below runs under it.
     Log writes go through `db`, not `tx`, so the admin sees `running` while it runs. */
  await db.transaction(async (tx) => {
    const rows = await tx.execute<{ locked: boolean }>(
      sql`SELECT pg_try_advisory_xact_lock(${BACKUP_LOCK}) AS locked`,
    );
    if (!rows[0]?.locked) return;

    const closed = await failStaleRuns(db);
    if (closed > 0) console.log(`[backup] closed ${closed} interrupted run(s)`);

    const row = await findByR2Key(db, target.r2Key);
    const settled =
      row?.status === 'succeeded' && row.uploadedAt !== null && (await exists(target.localPath));
    if (!settled) {
      const run = await startRun(db, backup, target, row);
      if (run) await runBackupJob(db, uploader, backup.databaseUrl, target, run.id);
    }

    /* Prune only once this slot is safely in R2. */
    const current = await findByR2Key(db, target.r2Key);
    if (current?.uploadedAt) {
      try {
        const removed = await pruneRemote(uploader, backup.folder, now);
        if (removed > 0) console.log(`[backup] pruned ${removed} old R2 object(s)`);
      } catch (error) {
        console.error('[backup] R2 prune failed', error);
      }
    }
    await pruneLocal(backup, now);
  });
}

/** The row this tick works on: a new one, or the slot's earlier row marked as another attempt. */
async function startRun(
  db: Database,
  backup: BackupFeature,
  target: BackupTarget,
  row: BackupRow | null,
): Promise<BackupRow | null> {
  if (!row) return insertRun(db, { kind: 'scheduled', folder: backup.folder, target });
  await markRetry(db, row.id);
  return row;
}

async function pruneLocal(backup: BackupFeature, now: Date): Promise<void> {
  const root = path.join(backup.localDir, backup.folder);
  const entries = await readdir(root, { withFileTypes: true }).catch(() => null);
  if (!entries) return;
  const names = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const expired = expiredDays(names, now);
  for (const name of expired) await rm(path.join(root, name), { recursive: true, force: true });
  if (expired.length > 0) console.log(`[backup] pruned ${expired.length} old day folder(s)`);
}
