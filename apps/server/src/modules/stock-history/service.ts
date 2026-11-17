/** Orchestration for the stock history, plus the boot-time ledger check. */

import type { Database } from '@mia/db';

import { notFound } from '../../shared/http/errors.ts';
import type { StockHistoryDto } from './dto.ts';
import { resolveRange } from './range.ts';
import * as repo from './repo.ts';
import type { StockHistoryQuery } from './validators.ts';

export async function stockHistory(
  db: Database,
  productId: string,
  query: StockHistoryQuery,
): Promise<StockHistoryDto> {
  const range = resolveRange(query);
  const product = await repo.findProduct(db, productId);
  if (!product) throw notFound('Product');

  const [series, movements] = await Promise.all([
    repo.findSeries(db, productId, range),
    repo.findMovements(db, productId, range, query.page),
  ]);

  return {
    product: { id: product.id, title: product.title ?? '', stock: product.stock },
    range,
    series,
    movements: movements.rows.map((row) => ({
      id: String(row.id),
      at: row.at.toISOString(),
      reason: row.reason,
      delta: row.delta,
      stockAfter: row.stockAfter,
      order: row.orderId && row.orderNumber ? { id: row.orderId, number: row.orderNumber } : null,
      actorName: row.actorFullName ?? row.actorEmail ?? null,
      note: row.note,
    })),
    movementsMeta: { page: query.page, perPage: repo.PER_PAGE, total: movements.total },
  };
}

/**
 * Every product's stock must equal the sum of its movements. A mismatch is
 * logged and returned, never "fixed": the ledger is evidence, not a cache.
 */
export async function checkLedger(db: Database) {
  const rows = await repo.findLedgerMismatches(db);
  if (rows.length > 0) console.error('[stock-history] ledger mismatch', [...rows]);
  return [...rows];
}
