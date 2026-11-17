import type { Database } from '@mia/db';
import { sql } from '@mia/db';

import { romeToday } from '../../shared/day-range.ts';
import { createViewCounter, type ViewRow } from './flush.ts';

/**
 * The process-wide view counter and its timer. Walkthrough, fallbacks and the
 * privacy note: docs/code/product-views.md.
 */
const MAX_KEYS = 20_000;
const TICK_MS = 60_000;
const SHUTDOWN_MS = 3_000;

/**
 * One statement: unknown product ids fall out of the JOIN, and `views + excluded`
 * adds to whatever another process already wrote for the same product and day.
 */
export async function writeViews(db: Database, rows: ViewRow[]): Promise<void> {
  await db.execute(sql`
    INSERT INTO product_views_daily (product_id, day, views)
    SELECT v."productId", v.day, v.views
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
         AS v("productId" uuid, day date, views int)
    JOIN products p ON p.id = v."productId"
    ON CONFLICT (product_id, day)
    DO UPDATE SET views = product_views_daily.views + EXCLUDED.views`);
}

let counter = createViewCounter(MAX_KEYS, () => Promise.resolve());

export function recordView(productId: string): void {
  counter.record(romeToday(), productId);
}

export const lastFlushedAt = () => counter.flushedAt();

export function startViewFlush(db: Database): NodeJS.Timeout {
  counter = createViewCounter(MAX_KEYS, (rows) => writeViews(db, rows));
  const timer = setInterval(() => void counter.flush(), TICK_MS);
  timer.unref();
  return timer;
}

/** Last flush before exit; gives up after 3 s so shutdown can never hang. Never rejects. */
export async function flushViewsOnShutdown(): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const giveUp = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, SHUTDOWN_MS);
  });
  await Promise.race([counter.flush(), giveUp]);
  clearTimeout(timer);
}
