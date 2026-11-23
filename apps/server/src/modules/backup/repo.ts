import type { Database } from '@mia/db';
import { and, desc, eq, lt, sql } from '@mia/db';
import { dbBackups } from '@mia/db/schema';

import type { BackupTarget } from './naming.ts';

/** Queries on the `db_backups` log. Always called with `db`, never a transaction, so the admin sees `running` live. */
export type BackupRow = typeof dbBackups.$inferSelect;

interface NewRun {
  kind: 'scheduled' | 'manual';
  folder: string;
  name?: string;
  target: BackupTarget;
  adminUserId?: string;
}

/** Null when a row with this `r2Key` already exists (a second worker, or the same manual name in the same minute). */
export async function insertRun(db: Database, run: NewRun): Promise<BackupRow | null> {
  const [row] = await db
    .insert(dbBackups)
    .values({
      kind: run.kind,
      folder: run.folder,
      name: run.name ?? null,
      fileName: run.target.fileName,
      localPath: run.target.localPath,
      r2Key: run.target.r2Key,
      status: 'running',
      triggeredByAdminUserId: run.adminUserId ?? null,
    })
    .onConflictDoNothing({ target: dbBackups.r2Key })
    .returning();
  return row ?? null;
}

export async function findByR2Key(db: Database, r2Key: string): Promise<BackupRow | null> {
  const [row] = await db.select().from(dbBackups).where(eq(dbBackups.r2Key, r2Key)).limit(1);
  return row ?? null;
}

export async function findById(db: Database, id: string): Promise<BackupRow | null> {
  const [row] = await db.select().from(dbBackups).where(eq(dbBackups.id, id)).limit(1);
  return row ?? null;
}

export async function markRetry(db: Database, id: string): Promise<void> {
  await db
    .update(dbBackups)
    .set({
      status: 'running',
      attempts: sql`${dbBackups.attempts} + 1`,
      error: null,
      startedAt: new Date(),
      finishedAt: null,
    })
    .where(eq(dbBackups.id, id));
}

export async function markSucceeded(db: Database, id: string, sizeBytes: number): Promise<void> {
  await db
    .update(dbBackups)
    .set({ status: 'succeeded', sizeBytes, finishedAt: new Date(), error: null })
    .where(eq(dbBackups.id, id));
}

export async function markUploaded(db: Database, id: string): Promise<void> {
  await db
    .update(dbBackups)
    .set({ uploadedAt: new Date(), error: null })
    .where(eq(dbBackups.id, id));
}

/** The dump exists but the upload failed: still `succeeded`, `uploadedAt` stays null. */
export async function markUploadFailed(db: Database, id: string, message: string): Promise<void> {
  await db.update(dbBackups).set({ error: message }).where(eq(dbBackups.id, id));
}

export async function markFailed(db: Database, id: string, message: string): Promise<void> {
  await db
    .update(dbBackups)
    .set({ status: 'failed', error: message, finishedAt: new Date() })
    .where(eq(dbBackups.id, id));
}

/** Rows left `running` by a process that died mid-backup. Returns how many were closed. */
export async function failStaleRuns(db: Database, olderThanMinutes = 60): Promise<number> {
  const closed = await db
    .update(dbBackups)
    .set({
      status: 'failed',
      error: 'Interrupted: the server stopped before this backup finished.',
      finishedAt: new Date(),
    })
    .where(
      and(
        eq(dbBackups.status, 'running'),
        lt(dbBackups.startedAt, sql`now() - make_interval(mins => ${olderThanMinutes})`),
      ),
    )
    .returning({ id: dbBackups.id });
  return closed.length;
}

/** Recent runs of one server folder only: other instances sharing the table are not shown. */
export async function listRecent(db: Database, folder: string, limit = 200): Promise<BackupRow[]> {
  return db
    .select()
    .from(dbBackups)
    .where(eq(dbBackups.folder, folder))
    .orderBy(desc(dbBackups.startedAt))
    .limit(limit);
}
