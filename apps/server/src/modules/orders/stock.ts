/**
 * Order moves that change `products.stock`. See /docs/code/orders-stock.md for
 * the walk-through.
 *
 * Stock leaves the shelf the moment an order is placed — an unpaid order holds
 * its units until it is paid or expires — and comes back when the order is
 * unwound before delivery (`cancelled`, `refunded` from `paid` or
 * `delivery_missed`). A returned rental unit is put back by its own return
 * inspection (return-inspections module), never by a status move: `received` and
 * `fulfilled` move nothing. A sold unit never comes back on its own.
 *
 * `taken` is `orders.stock_taken`: whether the PENDING order already holds its
 * units. Orders placed before stock moved to placement hold nothing, so theirs
 * is taken when they are paid instead — never twice.
 */

import type { Transaction } from '@mia/db';
import { and, eq, gte, sql } from '@mia/db';
import { products } from '@mia/db/schema';

import { conflict, httpError } from '../../shared/http/errors.ts';
import { setStockContext, type StockReason } from '../../shared/stock-context.ts';
import type { OrderStatus } from './status.ts';

export type LineMode = 'rental' | 'sale';

/** `null` is the placement itself — the order did not exist before it. */
export type StockFrom = OrderStatus | null;

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
export function stockDirection(from: StockFrom, to: OrderStatus, taken: boolean): -1 | 0 | 1 {
  if (from === null) return -1;
  if (to === 'paid') return taken ? 0 : -1;
  if (from === 'pending') return to === 'cancelled' && taken ? 1 : 0;
  if (from !== 'paid' && from !== 'delivery_missed') return 0;
  return to === 'cancelled' || to === 'refunded' ? 1 : 0;
}

/** Signed quantity per product. Lines whose product was deleted move nothing. */
export function stockDeltas(
  lines: readonly StockLine[],
  from: StockFrom,
  to: OrderStatus,
  taken: boolean,
): Map<string, { delta: number; title: string }> {
  const deltas = new Map<string, { delta: number; title: string }>();
  for (const line of lines) {
    if (!line.productId) continue;
    const delta = stockDirection(from, to, taken) * line.quantity;
    if (delta === 0) continue;
    const entry = deltas.get(line.productId) ?? { delta: 0, title: line.productTitle };
    entry.delta += delta;
    deltas.set(line.productId, entry);
  }
  return deltas;
}

/** Why the shelf moved, for the stock history. */
export function stockReason(from: StockFrom, to: OrderStatus): StockReason {
  if (from === null) return 'order_placed';
  if (to === 'paid') return 'order_paid';
  if (to === 'cancelled') return 'order_cancelled';
  if (to === 'refunded') return 'order_refunded';
  return 'rental_returned';
}

/**
 * The refusal when the shelf cannot cover a take. A customer at checkout gets
 * `out_of_stock` with the product named, which the storefront words in their
 * language; an operator marking an old order paid is told what to fix.
 */
function shortage(from: StockFrom, title: string, missing: number) {
  if (from === null) {
    return httpError(409, `"${title}" is no longer available.`, 'out_of_stock', {
      product: title,
    });
  }
  return conflict(
    `"${title}" does not have ${missing} in stock. Raise its stock on the product page, then mark the order paid again.`,
  );
}

/**
 * Applies the move inside the caller's transaction. A take that would drive
 * stock below zero throws a 409, which rolls back everything with it — the
 * order cannot be placed, or paid, for a unit the shelf does not have.
 */
export async function applyStockMoves(
  tx: Transaction,
  lines: readonly StockLine[],
  from: StockFrom,
  to: OrderStatus,
  taken: boolean,
  who: { orderId: string; actorAdminUserId: string | null },
): Promise<void> {
  const reason = stockReason(from, to);
  for (const [productId, { delta, title }] of stockDeltas(lines, from, to, taken)) {
    // One stock write per statement, and the trigger consumes the context: set it each time.
    await setStockContext(tx, { reason, ...who });
    if (delta > 0) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${delta}` })
        .where(eq(products.id, productId));
      continue;
    }

    const took = await tx
      .update(products)
      .set({ stock: sql`${products.stock} - ${-delta}` })
      .where(and(eq(products.id, productId), gte(products.stock, -delta)))
      .returning({ id: products.id });
    if (took.length === 0) throw shortage(from, title, -delta);
  }
}

/**
 * What `stock_taken` reads after a status move: set by a payment (the units are
 * now out, whichever way they left), cleared by a cancel from pending (they
 * came back). Every other move leaves it alone — past `pending` nothing reads it.
 */
export function takenAfter(to: OrderStatus, from: StockFrom, taken: boolean): boolean {
  if (to === 'paid') return true;
  if (from === 'pending' && to === 'cancelled') return false;
  return taken;
}
