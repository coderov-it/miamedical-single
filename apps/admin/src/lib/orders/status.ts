/**
 * Presentation for order and payment statuses.
 *
 * Deliberately *not* a copy of the server's transition table. The detail
 * endpoint returns `allowedStatuses` / `allowedPaymentStatuses` straight from
 * the machine, and the UI renders buttons from that — so a rule change on the
 * server reaches the admin without a matching client edit. What lives here is
 * only what the server has no opinion about: labels, colours and order.
 */

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';

export type PaymentStatus =
  'unpaid' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'failed';

export interface StatusMeta {
  label: string;
  /** Tailwind classes for the badge — border + text, so both themes work. */
  tone: string;
  /** The dot in the status filter bar and the timeline rail. */
  dot: string;
}

const NEUTRAL: StatusMeta = {
  label: '—',
  tone: 'text-muted-foreground',
  dot: 'bg-muted-foreground',
};

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: 'Pending',
    tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  paid: {
    label: 'Paid',
    tone: 'border-blue-500/40 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  fulfilled: {
    label: 'Fulfilled',
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  refunded: {
    label: 'Refunded',
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  unpaid: {
    label: 'Unpaid',
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  authorized: {
    label: 'Authorized',
    tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  paid: {
    label: 'Paid',
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  partially_refunded: {
    label: 'Partly refunded',
    tone: 'border-orange-500/40 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  refunded: {
    label: 'Refunded',
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  failed: {
    label: 'Failed',
    tone: 'border-destructive/40 text-destructive',
    dot: 'bg-destructive',
  },
};

export function orderStatusMeta(status: string): StatusMeta {
  return ORDER_STATUS_META[status as OrderStatus] ?? { ...NEUTRAL, label: status };
}

export function paymentStatusMeta(status: string): StatusMeta {
  return PAYMENT_STATUS_META[status as PaymentStatus] ?? { ...NEUTRAL, label: status };
}

/**
 * The queue's filter bar, left to right in the order work actually moves.
 * `undefined` is the "All" segment — it is the absence of a filter, not a
 * status, which is why it is not part of the meta tables.
 */
export const ORDER_STATUS_ORDER: readonly OrderStatus[] = [
  'pending',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded',
];

/**
 * The three steps an order walks through when nothing goes wrong. The exits —
 * cancelled, refunded — are deliberately absent: a stepper that tries to show
 * every branch stops reading as a progression at all.
 */
export const FULFILMENT_STEPS: readonly OrderStatus[] = ['pending', 'paid', 'fulfilled'];
