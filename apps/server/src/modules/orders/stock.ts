/**
 * Order status moves that change `products.stock`. See
 * /docs/code/orders-stock.md for the walk-through.
 *
 * Stock leaves the shelf when an order is paid and comes back when a rental is
 * returned (`fulfilled`) or a paid order is unwound before it was fulfilled. A
 * sold unit never comes back on its own — a goods return after `fulfilled` is a
 * hand edit of stock, because nothing here knows the goods actually arrived.
 */

import type { Transaction } from '@mia/db';
import { and, eq, gte, sql } from '@mia/db';
import { products } from '@mia/db/schema';

import { conflict } from '../../shared/http/errors.ts';
import type { OrderStatus } from './status.ts';

export type LineMode = 'rental' | 'sale';

export interface StockLine {
  productId: string | null;
  productTitle: string;
  quantity: number;
  configuration: Record<string, unknown> | null;
}

export function lineMode(line: Pick<StockLine, 'configuration'>): LineMode {
  return line.configuration?.pricingMode === 'rental' ? 'rental' : 'sale';
}

/** -1 takes the line's quantity off the shelf, +1 puts it back, 0 leaves it. */
export function stockDirection(from: string, to: OrderStatus, mode: LineMode): -1 | 0 | 1 {
  if (to === 'paid') return -1;
  if (from !== 'paid') return 0;
  if (to === 'cancelled' || to === 'refunded') return 1;
  if (to === 'fulfilled' && mode === 'rental') return 1;
  return 0;
}

/** Signed quantity per product. Lines whose product was deleted move nothing. */
export function stockDeltas(
  lines: readonly StockLine[],
  from: string,
  to: OrderStatus,
): Map<string, { delta: number; title: string }> {
  const deltas = new Map<string, { delta: number; title: string }>();
  for (const line of lines) {
    if (!line.productId) continue;
    const delta = stockDirection(from, to, lineMode(line)) * line.quantity;
    if (delta === 0) continue;
    const entry = deltas.get(line.productId) ?? { delta: 0, title: line.productTitle };
    entry.delta += delta;
    deltas.set(line.productId, entry);
  }
  return deltas;
}

/**
 * Applies the move inside the status transaction. A take that would drive stock
 * below zero throws a 409 naming the product, which rolls the status back with
 * it — the order cannot be paid for a unit the shelf does not have.
 */
export async function applyStockMoves(
  tx: Transaction,
  lines: readonly StockLine[],
  from: string,
  to: OrderStatus,
): Promise<void> {
  for (const [productId, { delta, title }] of stockDeltas(lines, from, to)) {
    if (delta > 0) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${delta}` })
        .where(eq(products.id, productId));
      continue;
    }

    const taken = await tx
      .update(products)
      .set({ stock: sql`${products.stock} - ${-delta}` })
      .where(and(eq(products.id, productId), gte(products.stock, -delta)))
      .returning({ id: products.id });
    if (taken.length === 0) {
      throw conflict(
        `"${title}" does not have ${-delta} in stock. Raise its stock on the product page, then mark the order paid again.`,
      );
    }
  }
}
