import type { Database } from '@mia/db';

import * as repo from './repo.ts';
import type { PaymentListFilters, PaymentRow } from './types.ts';

export async function list(
  db: Database,
  filters: PaymentListFilters,
): Promise<{
  rows: PaymentRow[];
  total: number;
  stats: { totalRevenue: string; pendingCount: number; paidCount: number; currency: string };
}> {
  const [result, aggregates] = await Promise.all([
    repo.findMany(db, filters),
    repo.stats(db, filters),
  ]);
  return { rows: result.rows, total: result.total, stats: aggregates };
}

export async function exportCsv(
  db: Database,
  filters: Omit<PaymentListFilters, 'page' | 'perPage'>,
): Promise<PaymentRow[]> {
  return repo.findAllForExport(db, filters);
}
