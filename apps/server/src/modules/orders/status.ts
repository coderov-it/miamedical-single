/**
 * The order state machine. See /docs/code/orders-status-machine.md.
 *
 * This module is the single authority on what may follow what. The admin
 * mirrors the same table to decide which buttons to *offer*, but never to
 * decide what is *allowed* — a client that gets it wrong is told so by the
 * service, with a message written for a human to read.
 */

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'out_for_delivery'
  | 'delivery_missed'
  | 'delivered'
  | 'out_for_pickup'
  | 'pickup_missed'
  | 'received'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded';

/** A rental order if any line is rented; the order's goods then come back. */
export type OrderFlow = 'sale' | 'rental';

export function orderFlow(
  items: ReadonlyArray<{ configuration: Record<string, unknown> | null }>,
): OrderFlow {
  return items.some((item) => item.configuration?.pricingMode === 'rental') ? 'rental' : 'sale';
}

export type PaymentStatus =
  'unpaid' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'failed';

/**
 * Forward step FIRST in every array: the admin makes the first entry that is not
 * an exit or a `*_missed` the primary button. `cancelled` and `refunded` are exits,
 * not stages. `delivered` branches on the flow: a sale closes, a rental goes out
 * for pickup. `received → fulfilled` is not here: it is automatic, made by the
 * last return inspection (return-inspections module), never by hand.
 *
 * Deliberately narrow. Reversing a move is not modelled, because the honest
 * record is a *new* event, not a rewound one.
 */
const COMMON_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['out_for_delivery', 'cancelled', 'refunded'],
  out_for_delivery: ['delivered', 'delivery_missed'],
  delivery_missed: ['out_for_delivery', 'cancelled'],
  delivered: [],
  out_for_pickup: ['received', 'pickup_missed'],
  pickup_missed: ['out_for_pickup'],
  received: [],
  fulfilled: ['refunded'],
  cancelled: [],
  refunded: [],
};

const DELIVERED_NEXT: Record<OrderFlow, readonly OrderStatus[]> = {
  sale: ['fulfilled'],
  rental: ['out_for_pickup'],
};

/** Every status money was taken for: all but `pending` and `cancelled`. */
export const PAID_ONWARD_STATUSES: readonly OrderStatus[] = [
  'paid',
  'out_for_delivery',
  'delivery_missed',
  'delivered',
  'out_for_pickup',
  'pickup_missed',
  'received',
  'fulfilled',
  'refunded',
];

/** The two `*_missed` statuses: a move into one needs a note saying what happened. */
export const MISSED_ORDER_STATUSES: readonly OrderStatus[] = ['delivery_missed', 'pickup_missed'];

/**
 * Payment moves independently: an order can be marked paid by a transfer that
 * clears days after fulfilment, and a refund can be partial without the order
 * itself leaving `fulfilled`.
 */
const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  unpaid: ['authorized', 'paid', 'failed'],
  authorized: ['paid', 'failed'],
  paid: ['partially_refunded', 'refunded'],
  /* The self-loop is a second partial refund. Only the refund endpoint
     (order-refunds) may make either of these moves; see REFUND_ONLY below. */
  partially_refunded: ['partially_refunded', 'refunded'],
  refunded: [],
  failed: ['unpaid', 'authorized', 'paid'],
};

/**
 * Payment statuses that carry an amount. A bare move into one of them would be a
 * refund with no figure on it, so only `POST /orders/:id/refunds` may cause it.
 */
export const REFUND_ONLY_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'partially_refunded',
  'refunded',
];

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ['cancelled', 'refunded'];

/** The moves an operator may make by hand from `from`, for this flow. */
export function nextOrderStatuses(from: OrderStatus, flow: OrderFlow): readonly OrderStatus[] {
  if (from === 'delivered') return DELIVERED_NEXT[flow];
  return COMMON_TRANSITIONS[from];
}

export function nextPaymentStatuses(from: PaymentStatus): readonly PaymentStatus[] {
  return PAYMENT_TRANSITIONS[from];
}

/** The moves an operator may make by hand: the table minus the refund-only ones. */
export function manualPaymentStatuses(from: PaymentStatus): PaymentStatus[] {
  return PAYMENT_TRANSITIONS[from].filter((to) => !REFUND_ONLY_PAYMENT_STATUSES.includes(to));
}

export function canMoveOrder(from: OrderStatus, to: OrderStatus, flow: OrderFlow): boolean {
  return nextOrderStatuses(from, flow).includes(to);
}

export function canMovePayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

/**
 * The 409 body. Written to be shown verbatim: it names where the order is,
 * what was asked, and what would actually work — so the reader can act
 * without opening documentation.
 */
export function explainRejection(
  kind: 'order' | 'payment',
  from: string,
  to: string,
  allowed: readonly string[],
): string {
  const subject = kind === 'order' ? 'This order' : 'This payment';
  if (allowed.length === 0) {
    return `${subject} is ${from}, which is final. It cannot move to ${to}.`;
  }
  return `${subject} is ${from} and cannot move to ${to}. Possible next steps: ${allowed.join(', ')}.`;
}
