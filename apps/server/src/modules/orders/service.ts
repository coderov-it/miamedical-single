/**
 * Business orchestration for orders. Transport-agnostic.
 *
 * The rule this module exists to hold: a status only moves through here, the
 * move is checked against the state machine, and every accepted move writes a
 * timeline entry in the same transaction. There is no second path — which is
 * why `PATCH /orders/:id` cannot touch status at all.
 */

import type { Database } from '@mia/db';
import { addMoney } from '@mia/pricing';

import type { SessionUser } from '../../shared/http/context.ts';
import { conflict, notFound } from '../../shared/http/errors.ts';
/* Read-only: the newest live contract, for the signed-before-paid gate. The
   repo depends only on the schema, so no cycle. */
import * as contractsRepo from '../contracts/repo.ts';
import { multiply, sumMoney } from './mapper.ts';
import * as cartRepo from './cart-repo.ts';
import * as listRepo from './list-repo.ts';
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
  AdminOrderSummaryRecord,
} from './types.ts';
import type { AdminUpdateOrderInput } from './validators.ts';

export async function list(
  db: Database,
  filters: OrderListFilters,
): Promise<{ rows: AdminOrderSummaryRecord[]; total: number; stats: OrderListStats }> {
  const [result, awaitingCount] = await Promise.all([
    listRepo.findMany(db, filters),
    listRepo.countAwaiting(db),
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

export async function calendarEntries(db: Database, from: string, to: string) {
  return listRepo.findCalendarEntries(db, from, to);
}

export async function searchCustomers(db: Database, q: string) {
  return listRepo.findCustomers(db, q);
}

/** Dashboard tiles. One round trip per figure, both indexed on `placed_at`. */
export async function windowStats(db: Database, windowDays: number) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const [window, awaitingCount] = await Promise.all([
    listRepo.windowStats(db, since),
    listRepo.countAwaiting(db),
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
  const order = await getById(db, id);

  const patch: repo.OrderPatch = {};
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.shippingAddress !== undefined) patch.shippingAddress = input.shippingAddress;
  if (input.billingAddress !== undefined) patch.billingAddress = input.billingAddress;

  /*
    The agreed delivery fee, arriving from a phone call rather than from any
    calculation — nothing prices delivery any more.

    The total is re-derived here rather than accepted from the client, for the
    same reason placement never read a fee off the request body: the amount owed
    is the shop's arithmetic, not the caller's. Recomputed from the order's own
    stored subtotal, so a stale figure in the admin cannot carry the items total
    backwards with it.
  */
  if (input.shippingTotal !== undefined) {
    patch.shippingTotal = input.shippingTotal;
    patch.total = addMoney(order.subtotal, input.shippingTotal);
  }

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
    actorAdminUserId: actor?.id ?? null,
  });

  return getById(db, id);
}

const PAYMENT_FOLLOWS_ORDER: Partial<Record<OrderStatus, PaymentStatus>> = {
  paid: 'paid',
  refunded: 'refunded',
};

/**
 * A rental order does not move forward without a signed contract.
 *
 * Checked at `paid` because that is the first forward step: money is only taken
 * once the customer has signed, so nothing later on the happy path can be
 * reached unsigned either. Sales orders owe no contract and pass untouched, and
 * the payment-status machine is deliberately not gated — a transfer arriving is
 * a fact regardless of paperwork.
 */
async function assertContractSigned(db: Database, id: string): Promise<void> {
  const order = await getById(db, id);
  const rented = order.items.some(
    (item) => (item.configuration as Record<string, unknown> | null)?.pricingMode === 'rental',
  );
  if (!rented) return;

  const contract = await contractsRepo.findLatestActiveByOrderId(db, id);
  if (!contract) {
    throw conflict(
      'This rental order has no contract. Generate one and get it signed before marking the order paid.',
    );
  }
  if (contract.status !== 'signed') {
    throw conflict(
      `Contract ${contract.number} is not signed yet. The customer must sign it before this order can be marked paid.`,
    );
  }
}

export async function moveStatus(
  db: Database,
  id: string,
  to: OrderStatus,
  note: string | null,
  actor: SessionUser | null,
): Promise<OrderAggregate> {
  if (to === 'paid') await assertContractSigned(db, id);

  let order = await transition(db, id, 'status', to, note, actor);

  const follow = PAYMENT_FOLLOWS_ORDER[to];
  if (follow && canMovePayment(order.paymentStatus as PaymentStatus, follow)) {
    order = await transition(db, id, 'paymentStatus', follow, note, actor);
  }

  return order;
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

export { type PlacementContext, place, previewContract } from './placement.ts';

// --- carts -----------------------------------------------------------------

export function listCarts(
  db: Database,
  filters: CartListFilters,
): Promise<{ rows: CartSummaryRecord[]; total: number }> {
  return cartRepo.findCarts(db, filters);
}

export async function getCartById(db: Database, id: string): Promise<CartAggregate> {
  const cart = await cartRepo.findCartById(db, id);
  if (!cart) throw notFound('Cart');
  return cart;
}

export { multiply, sumMoney };
