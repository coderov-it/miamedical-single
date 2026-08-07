/**
 * The order state machine. See /docs/code/orders-status-machine.md.
 *
 * This module is the single authority on what may follow what. The admin
 * mirrors the same table to decide which buttons to *offer*, but never to
 * decide what is *allowed* — a client that gets it wrong is told so by the
 * service, with a message written for a human to read.
 */

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';

export type PaymentStatus =
  'unpaid' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'failed';

/**
 * The forward path is `pending → paid → fulfilled`. `cancelled` and `refunded`
 * are exits, not stages: nothing continues out of them, which is what makes
 * them safe to treat as terminal in the UI.
 *
 * Deliberately narrow. Reversing a move ("un-fulfil") is not modelled, because
 * the honest record is a *new* event, not a rewound one — and the timeline is
 * the artefact people actually reason from during a dispute.
 */
const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['fulfilled', 'cancelled', 'refunded'],
  fulfilled: ['refunded'],
  cancelled: [],
  refunded: [],
};

/**
 * Payment moves independently: an order can be marked paid by a transfer that
 * clears days after fulfilment, and a refund can be partial without the order
 * itself leaving `fulfilled`.
 */
const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  unpaid: ['authorized', 'paid', 'failed'],
  authorized: ['paid', 'failed'],
  paid: ['partially_refunded', 'refunded'],
  partially_refunded: ['refunded'],
  refunded: [],
  failed: ['unpaid', 'authorized', 'paid'],
};

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ['cancelled', 'refunded'];

export function nextOrderStatuses(from: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from];
}

export function nextPaymentStatuses(from: PaymentStatus): readonly PaymentStatus[] {
  return PAYMENT_TRANSITIONS[from];
}

export function canMoveOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
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
