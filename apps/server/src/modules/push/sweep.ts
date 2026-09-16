import type { Database } from '@mia/db';

import { expireStale, sweepPending } from './dispatch.ts';

/**
 * The retry tick, for everything the live path missed.
 *
 * `LISTEN` has no backlog, so a notification committed while this process was
 * restarting reached nobody and raised no error. That is survivable for the feed,
 * which re-reads the table on the next screen load, and not survivable for a
 * closed app — this is what closes it.
 *
 * Every minute rather than hourly, unlike `notifications/sweep.ts`: that one
 * raises events from the passage of time, where an hour's latency is invisible.
 * This one is a delivery retry, where an hour's latency means an alert arriving
 * long after it was worth reading.
 */
const TICK_MS = 60_000;

export function startPushSweep(db: Database): NodeJS.Timeout {
  const tick = () => {
    void run(db);
  };

  /* Once at boot, before the interval: a deploy is exactly when the gap this
     exists to close is most likely to have opened. */
  tick();

  const timer = setInterval(tick, TICK_MS);
  // Never a reason to keep the process alive.
  timer.unref();
  return timer;
}

async function run(db: Database): Promise<void> {
  try {
    await sweepPending(db);
    await expireStale(db);
  } catch (error) {
    /* A failed tick is a delayed push, not a lost one — the rows are still
       unclaimed and the next tick sees them. Throwing out of a timer callback
       would take the process down for something the next minute would fix. */
    console.error('[push] sweep failed', error);
  }
}
