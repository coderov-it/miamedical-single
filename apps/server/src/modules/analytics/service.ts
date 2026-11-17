import type { Database } from '@mia/db';

import { cacheGet, cacheSet } from './cache.ts';
import { fetchReport } from './report-sql.ts';
import { type Bucket, resolveRange, type SalesInput } from './range.ts';
import { lastRefreshedAt } from './sweep.ts';

export async function salesReport(db: Database, query: SalesInput) {
  const { range, previous, bucket } = resolveRange(query);
  const key = `${range.from}|${range.to}|${bucket}`;
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
  bucket: Bucket,
) {
  const r = await fetchReport(db, range, previous, bucket);
  return {
    range,
    previous,
    bucket,
    currency: 'EUR',
    refreshedAt: lastRefreshedAt()?.toISOString() ?? null,
    totals: r.totals,
    previousTotals: r.previousTotals,
    series: r.series,
    topProducts: { byRevenue: r.byRevenue, byUnits: r.byUnits },
    modeSplit: r.modeSplit,
  };
}
