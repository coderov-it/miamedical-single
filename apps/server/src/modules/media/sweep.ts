import type { Database } from '@mia/db';
import { STAGING_PREFIX, type FileUploader } from '@mia/media';

import { env } from '../../config/env.ts';
import { FEATURES } from '../../config/features.ts';
import { reclaimFinalObjects } from './orphans.ts';
import { loadMediaReferences } from './references.ts';

/**
 * The bucket's two cleanups, on boot and then hourly.
 *
 * 1. Orphaned uploads. Every upload lands in `_staging/` and only leaves it
 *    when the owning entity is saved — an admin who uploads and then closes
 *    the tab strands the object there. Staging objects older than
 *    `MEDIA_STAGING_TTL_HOURS` are deleted.
 * 2. Unreferenced final objects. A save never deletes the object it replaces,
 *    so replaced and removed photos and icons wait here until no row names
 *    them (orphans.ts decides; docs/code/media-lifecycle.md walks it).
 */

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

/* Decided once, at boot, in config/features.ts (`MEDIA_ORPHAN_SWEEP`). */
const RECLAIM_DRY_RUN = !FEATURES.mediaReclaim;

export async function sweepStagingObjects(
  uploader: FileUploader,
  maxAgeMs: number,
  now = Date.now(),
): Promise<number> {
  const cutoff = now - maxAgeMs;
  const objects = await uploader.list(STAGING_PREFIX);
  let removed = 0;
  for (const object of objects) {
    if (object.lastModified.getTime() >= cutoff) continue;
    await uploader.delete(object.key).catch(() => undefined);
    removed += 1;
  }
  return removed;
}

async function reclaim(uploader: FileUploader, db: Database): Promise<void> {
  const result = await reclaimFinalObjects(uploader, () => loadMediaReferences(db), {
    dryRun: RECLAIM_DRY_RUN,
  });
  const count = result.orphans.length;
  if (count === 0) return;
  if (result.skipped === 'breaker') {
    console.warn(
      `media: ${count} of ${result.scanned} stored object(s) look unreferenced — ` +
        'too many to be real orphans, nothing deleted. Is this server on the right database?',
    );
    return;
  }
  if (result.skipped === 'no_references') {
    console.warn(`media: ${count} object(s) unreferenced but the database is empty — kept`);
    return;
  }
  if (RECLAIM_DRY_RUN) {
    console.log(
      `media: ${count} unreferenced object(s) would be swept (MEDIA_ORPHAN_SWEEP=report)`,
    );
    return;
  }
  console.log(`media: swept ${result.deleted} unreferenced object(s)`);
}

/** Fire-and-forget scheduling; `unref` so the timer never blocks shutdown. */
export function startMediaSweep(uploader: FileUploader, db: Database): void {
  const run = async () => {
    try {
      const removed = await sweepStagingObjects(uploader, env.MEDIA_STAGING_TTL_HOURS * 3_600_000);
      if (removed > 0) console.log(`media: swept ${removed} orphaned staging object(s)`);
      await reclaim(uploader, db);
    } catch (error) {
      // Unconfigured R2 in local dev is expected — one quiet line, no crash.
      console.warn(`media: sweep skipped — ${(error as Error).message}`);
    }
  };
  void run();
  setInterval(run, SWEEP_INTERVAL_MS).unref();
}
