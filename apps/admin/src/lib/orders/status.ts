/**
 * Presentation for order and payment statuses.
 *
 * Deliberately *not* a copy of the server's transition table. The detail
 * endpoint returns `allowedStatuses` / `allowedPaymentStatuses` straight from
 * the machine, and the UI renders buttons from that — so a rule change on the
 * server reaches the admin without a matching client edit. What lives here is
 * only what the server has no opinion about: labels, colours and order.
 *
 * Labels are resolved per call in the interface language — order and payment
 * statuses from `@mia/i18n`, the catalogue the storefront shows customers too.
 */
import { orderStatusLabel, paymentStatusLabel } from '@mia/i18n';

import { uiLang } from '~/lib/ui-lang.svelte';
import type { MessageKey } from '~/lib/ui-text';

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

export type PaymentStatus =
  'unpaid' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'failed';

export interface StatusMeta {
  label: string;
  /** Tailwind classes for the badge — border + text, so both themes work. */
  tone: string;
  /** The dot in the status filter bar and the timeline rail. */
  dot: string;
}

/** A status's colours. The label is looked up when the meta is asked for. */
export type StatusTone = Omit<StatusMeta, 'label'>;

export const NEUTRAL_TONE: StatusTone = {
  tone: 'text-muted-foreground',
  dot: 'bg-muted-foreground',
};

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  pending: {
    tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  paid: {
    tone: 'border-blue-500/40 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  out_for_delivery: {
    tone: 'border-sky-500/40 text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  delivery_missed: {
    tone: 'border-orange-500/40 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  delivered: {
    tone: 'border-blue-500/40 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  out_for_pickup: {
    tone: 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
  },
  pickup_missed: {
    tone: 'border-orange-500/40 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  received: {
    tone: 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
  },
  fulfilled: {
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  refunded: {
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  unpaid: {
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  authorized: {
    tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  paid: {
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  partially_refunded: {
    tone: 'border-orange-500/40 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  refunded: {
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  failed: {
    tone: 'border-destructive/40 text-destructive',
    dot: 'bg-destructive',
  },
};

/** Call at render time — the label follows the interface language. */
export function orderStatusMeta(status: string): StatusMeta {
  const tone = ORDER_STATUS_TONE[status as OrderStatus];
  if (!tone) return { ...NEUTRAL_TONE, label: status };
  return { ...tone, label: orderStatusLabel(status as OrderStatus, uiLang.current) };
}

export function paymentStatusMeta(status: string): StatusMeta {
  const tone = PAYMENT_STATUS_TONE[status as PaymentStatus];
  if (!tone) return { ...NEUTRAL_TONE, label: status };
  return { ...tone, label: paymentStatusLabel(status as PaymentStatus, uiLang.current) };
}

export type OrderStage = 'pending' | 'paid' | 'delivery' | 'return' | 'fulfilled' | 'closed';

export interface StageMeta {
  id: OrderStage;
  /** Mirrors `ORDER_STAGES` in the server's orders/status.ts. */
  statuses: readonly OrderStatus[];
  dot: string;
  labelKey: MessageKey;
}

/**
 * The queue's filter bar segments, left to right in the order work moves.
 * "All" is the absence of a filter, so it is not listed here.
 */
export const ORDER_STAGES: readonly StageMeta[] = [
  { id: 'pending', statuses: ['pending'], dot: 'bg-amber-500', labelKey: 'orders.stagePending' },
  { id: 'paid', statuses: ['paid'], dot: 'bg-blue-500', labelKey: 'orders.stagePaid' },
  {
    id: 'delivery',
    statuses: ['out_for_delivery', 'delivery_missed', 'delivered'],
    dot: 'bg-sky-500',
    labelKey: 'orders.stageDelivery',
  },
  {
    id: 'return',
    statuses: ['out_for_pickup', 'pickup_missed', 'received'],
    dot: 'bg-indigo-500',
    labelKey: 'orders.stageReturn',
  },
  {
    id: 'fulfilled',
    statuses: ['fulfilled'],
    dot: 'bg-emerald-500',
    labelKey: 'orders.stageFulfilled',
  },
  {
    id: 'closed',
    statuses: ['cancelled', 'refunded'],
    dot: 'bg-muted-foreground',
    labelKey: 'orders.stageClosed',
  },
];

/** The stage containing a status, for highlighting a legacy `?status=` link. */
export function stageOfStatus(status: string): OrderStage | undefined {
  return ORDER_STAGES.find((stage) => stage.statuses.includes(status as OrderStatus))?.id;
}

export type OrderFlow = 'sale' | 'rental';

/**
 * The steps an order walks through when nothing goes wrong, per flow. The exits
 * (cancelled, refunded) are deliberately absent: a stepper that tries to show
 * every branch stops reading as a progression at all. A `*_missed` status is
 * not a step either — it sits on its parent, see `MISSED_PARENT`.
 */
export function flowSteps(flow: OrderFlow): readonly OrderStatus[] {
  if (flow === 'rental') {
    return [
      'pending',
      'paid',
      'out_for_delivery',
      'delivered',
      'out_for_pickup',
      'received',
      'fulfilled',
    ];
  }
  return ['pending', 'paid', 'out_for_delivery', 'delivered', 'fulfilled'];
}

/** The step a failed attempt belongs to: the retry goes back to it. */
export const MISSED_PARENT: Partial<Record<OrderStatus, OrderStatus>> = {
  delivery_missed: 'out_for_delivery',
  pickup_missed: 'out_for_pickup',
};
