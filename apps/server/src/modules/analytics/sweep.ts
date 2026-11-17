import type { Database } from '@mia/db';

import { cacheClear } from './cache.ts';
import { allOrderDays, daysChangedSince, rebuildDays } from './rollup.ts';

/**
 * Keeps the sales rollups current. On boot every day with an order is rebuilt
 * (volume is small) plus every day the rollups already hold, so a day whose
 * orders were all deleted is emptied; then each minute the days of orders changed since the last
 * run are. Orders that left `paid` are selected too — their day must lose them.
 *
 *   tick 10:00:00 → orders updated after 09:55:00 touch 17 Nov → rebuild 17 Nov
 *
 * The 5 minute overlap covers app-clock skew and late commits: `updated_at` is
 * set by the app, not the database. `refreshedAt` feeds the endpoint.
 */
const TICK_MS = 60_000;
const OVERLAP_MS = 5 * 60_000;

let refreshedAt: Date | null = null;
let lastRunStart: Date | null = null;

export function lastRefreshedAt(): Date | null {
  return refreshedAt;
}

export function startAnalyticsSweep(db: Database): NodeJS.Timeout {
  const tick = () => {
    void run(db);
  };
  tick();
  const timer = setInterval(tick, TICK_MS);
  timer.unref();
  return timer;
}

async function run(db: Database): Promise<void> {
  const started = new Date();
  try {
    const days = lastRunStart
      ? await daysChangedSince(db, new Date(lastRunStart.getTime() - OVERLAP_MS))
      : await allOrderDays(db);
    await rebuildDays(db, days);
    lastRunStart = started;
    refreshedAt = new Date();
    if (days.length > 0) cacheClear();
  } catch (error) {
    /* The charts are a minute stale; the next tick retries the same window. */
    console.error('[analytics] rollup failed', error);
  }
}
