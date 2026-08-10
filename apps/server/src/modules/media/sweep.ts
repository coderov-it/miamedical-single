import { env } from '../../config/env.ts';
import type { FileUploader } from '../../infra/storage/port.ts';
import { STAGING_PREFIX } from '../../infra/storage/port.ts';

/**
 * Orphaned-upload cleanup. Every upload lands in `_staging/` and only leaves
 * it when the owning entity is saved — an admin who uploads and then closes
 * the tab strands the object there. This sweep deletes staging objects older
 * than `MEDIA_STAGING_TTL_HOURS`, on boot and then hourly.
 */

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

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

/** Fire-and-forget scheduling; `unref` so the timer never blocks shutdown. */
export function startStagingSweep(uploader: FileUploader): void {
  const run = async () => {
    try {
      const removed = await sweepStagingObjects(uploader, env.MEDIA_STAGING_TTL_HOURS * 3_600_000);
      if (removed > 0) console.log(`media: swept ${removed} orphaned staging object(s)`);
    } catch (error) {
      // Unconfigured R2 in local dev is expected — one quiet line, no crash.
      console.warn(`media: staging sweep skipped — ${(error as Error).message}`);
    }
  };
  void run();
  setInterval(run, SWEEP_INTERVAL_MS).unref();
}
