/**
 * Business orchestration for orders. Transport-agnostic.
 *
 * The rule this module exists to hold: a status only moves through here, the
 * move is checked against the state machine, and every accepted move writes a
 * timeline entry in the same transaction. There is no second path — which is
 * why `PATCH /orders/:id` cannot touch status at all.
 */

import type { Database } from '@mia/db';

import type { SessionUser } from '../../shared/http/context.ts';
import { conflict, notFound } from '../../shared/http/errors.ts';
import { multiply, sumMoney } from './mapper.ts';
import * as repo from './repo.ts';
import {
  canMoveOrder,
  canMovePayment,
  explainRejection,
  nextOrderStatuses,
  nextPaymentStatuses,
  type OrderStatus,
  type PaymentStatus,
} from './status.ts';
import type {
  CartAggregate,
  CartListFilters,
  CartSummaryRecord,
  OrderAggregate,
  OrderListFilters,
  OrderListStats,
  OrderSummaryRecord,
} from './types.ts';
import type { AdminUpdateOrderInput } from './validators.ts';

export async function list(
  db: Database,
  filters: OrderListFilters,
): Promise<{ rows: OrderSummaryRecord[]; total: number; stats: OrderListStats }> {
  const [result, awaitingCount] = await Promise.all([
    repo.findMany(db, filters),
    repo.countAwaiting(db),
  ]);

  return {
    rows: result.rows,
    total: result.total,
    stats: {
      total: result.total,
      awaitingCount,
      // Summed over the rows we are actually returning. The admin labels this
      // "this page" — a money figure must never imply more than it covers.
      pageValue: sumMoney(result.rows.map((row) => row.total)),
    },
  };
}

/** Dashboard tiles. One round trip per figure, both indexed on `placed_at`. */
export async function windowStats(db: Database, windowDays: number) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const [window, awaitingCount] = await Promise.all([
    repo.windowStats(db, since),
    repo.countAwaiting(db),
  ]);

  return {
    windowDays,
    revenue: window.revenue,
    currency: window.currency,
    orderCount: window.orderCount,
    awaitingCount,
    revenueBasis: 'Paid and fulfilled orders only',
  };
}

export async function getById(db: Database, id: string): Promise<OrderAggregate> {
  const order = await repo.findById(db, id);
  if (!order) throw notFound('Order');
  return order;
}

export async function update(
  db: Database,
  id: string,
  input: AdminUpdateOrderInput,
): Promise<OrderAggregate> {
  await getById(db, id);

  const patch: repo.OrderPatch = {};
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.shippingAddress !== undefined) patch.shippingAddress = input.shippingAddress;
  if (input.billingAddress !== undefined) patch.billingAddress = input.billingAddress;

  await repo.update(db, id, patch);
  return getById(db, id);
}

/**
 * Both transitions follow the same shape, so they share one body: read the
 * order, check the move against the machine, then hand the accepted move to
 * the repo, which writes the column and its audit entry atomically.
 */
async function transition(
  db: Database,
  id: string,
  field: 'status' | 'paymentStatus',
  to: string,
  note: string | null,
  actor: SessionUser | null,
): Promise<OrderAggregate> {
  const order = await getById(db, id);
  const from = field === 'status' ? order.status : order.paymentStatus;

  if (from === to) {
    throw conflict(`This order is already ${to}.`);
  }

  const allowed =
    field === 'status'
      ? nextOrderStatuses(from as OrderStatus)
      : nextPaymentStatuses(from as PaymentStatus);

  const permitted =
    field === 'status'
      ? canMoveOrder(from as OrderStatus, to as OrderStatus)
      : canMovePayment(from as PaymentStatus, to as PaymentStatus);

  if (!permitted) {
    throw conflict(explainRejection(field === 'status' ? 'order' : 'payment', from, to, allowed));
  }

  await repo.applyTransition(db, {
    orderId: id,
    field,
    fromValue: from,
    toValue: to,
    note: note ?? null,
    actorUserId: actor?.id ?? null,
  });

  return getById(db, id);
}

export function moveStatus(
  db: Database,
  id: string,
  to: OrderStatus,
  note: string | null,
  actor: SessionUser | null,
): Promise<OrderAggregate> {
  return transition(db, id, 'status', to, note, actor);
}

export function movePaymentStatus(
  db: Database,
  id: string,
  to: PaymentStatus,
  note: string | null,
  actor: SessionUser | null,
): Promise<OrderAggregate> {
  return transition(db, id, 'paymentStatus', to, note, actor);
}

// --- carts -----------------------------------------------------------------

export function listCarts(
  db: Database,
  filters: CartListFilters,
): Promise<{ rows: CartSummaryRecord[]; total: number }> {
  return repo.findCarts(db, filters);
}

export async function getCartById(db: Database, id: string): Promise<CartAggregate> {
  const cart = await repo.findCartById(db, id);
  if (!cart) throw notFound('Cart');
  return cart;
}

export { multiply, sumMoney };
