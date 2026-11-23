/**
 * Pure rules for the Actions card: which button leads, what each is called, and
 * the dates the delivered move may carry. Kept out of the component so the
 * choices are testable.
 */
import type { OrderStatus } from './status.ts';

/** Moves that give up or report a failure: never the lead button. */
const NOT_PRIMARY: readonly string[] = [
  'cancelled',
  'refunded',
  'delivery_missed',
  'pickup_missed',
];
/** Moves that end an order early: tinted as destructive. */
export const DESTRUCTIVE: readonly string[] = ['cancelled', 'refunded'];
/** Moves that report a failed attempt and cannot be written without saying why. */
export const NEEDS_NOTE: readonly string[] = ['delivery_missed', 'pickup_missed'];

/** The first forward move; the server lists it first, so it is also the likeliest. */
export function primaryMove(allowed: readonly string[]): string | undefined {
  return allowed.find((to) => !NOT_PRIMARY.includes(to));
}

/** The message key for a button: a retry reads as one, everything else is "Mark as". */
export function moveLabelKey(
  from: OrderStatus,
  to: string,
): 'orders.actionsRetryDelivery' | 'orders.actionsRetryPickup' | 'orders.actionsMarkAs' {
  if (from === 'delivery_missed' && to === 'out_for_delivery') return 'orders.actionsRetryDelivery';
  if (from === 'pickup_missed' && to === 'out_for_pickup') return 'orders.actionsRetryPickup';
  return 'orders.actionsMarkAs';
}

/** Today in the operator's own calendar, `YYYY-MM-DD` — not UTC, which is tomorrow late at night. */
export function localToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
