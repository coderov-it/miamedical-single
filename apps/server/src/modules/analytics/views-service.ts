import type { Database } from '@mia/db';

import { lastFlushedAt } from '../product-views/views.ts';
import { cacheGet, cacheSet } from './cache.ts';
import { resolveRange, type SalesInput } from './range.ts';
import { fetchViews } from './views-sql.ts';

/** Same defaults, validation and 60 s cache as the sales report. */
export async function viewsReport(db: Database, query: SalesInput) {
  const { range, previous, bucket } = resolveRange(query);
  const key = `views|${range.from}|${range.to}|${bucket}`;
  const cached = cacheGet<Awaited<ReturnType<typeof build>>>(key);
  if (cached) return cached;

  const report = await build(db, range, previous, bucket);
  cacheSet(key, report);
  return report;
}

async function build(
  db: Database,
  range: { from: string; to: string },
  previous: { from: string; to: string },
  bucket: SalesInputBucket,
) {
  const r = await fetchViews(db, range, previous, bucket);
  return {
    range,
    previous,
    bucket,
    flushedAt: lastFlushedAt()?.toISOString() ?? null,
    ...r,
  };
}

type SalesInputBucket = NonNullable<SalesInput['bucket']>;
