/**
 * Pure refund rules: no IO, so every edge is unit-tested. Amounts are decimal
 * strings and all arithmetic runs on integer cents, never on floats.
 * Worked examples: docs/code/order-money.md.
 */

import type { PaymentStatus } from '../orders/status.ts';

/** "12.50" → 1250. Input is a validated two-decimal string from the database or the schema. */
export function toCents(amount: string): number {
  const [whole = '0', fraction = ''] = amount.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}

export function fromCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export type RefundDecision = { ok: true; netAfter: string } | { ok: false; message: string };

/** Whether `amount` may come off an order that is currently worth `netTotal`. */
export function decideRefund(input: { netTotal: string; amount: string }): RefundDecision {
  const net = toCents(input.netTotal);
  const amount = toCents(input.amount);
  if (net <= 0) return { ok: false, message: 'Nothing is left to refund on this order.' };
  if (amount > net) {
    return { ok: false, message: `At most ${fromCents(net)} can still be refunded.` };
  }
  return { ok: true, netAfter: fromCents(net - amount) };
}

/** The payment status a refund leaves behind: everything given back, or part of it. */
export function paymentStatusAfterRefund(netAfter: string): PaymentStatus {
  return toCents(netAfter) === 0 ? 'refunded' : 'partially_refunded';
}

/** Statuses money was received in — the only ones a refund makes sense from. */
const REFUNDABLE_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'paid',
  'partially_refunded',
  'refunded',
];

export function isRefundablePayment(status: PaymentStatus): boolean {
  return REFUNDABLE_PAYMENT_STATUSES.includes(status);
}

/** "12,50 €" — what an operator reads on the timeline. */
export function formatMoney(amount: string, currency: string): string {
  const [whole = '0', fraction = '00'] = amount.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const symbol = currency === 'EUR' ? '€' : currency;
  return `${grouped},${fraction.padEnd(2, '0')} ${symbol}`;
}

export function refundNote(amount: string, currency: string, reason: string): string {
  return `Refund ${formatMoney(amount, currency)} — ${reason}`;
}

/** Legacy partial refunds the migration could not price: flagged for an operator. */
export function isRefundAmountMissing(paymentStatus: string, refundedTotal: string): boolean {
  return paymentStatus === 'partially_refunded' && toCents(refundedTotal) === 0;
}

/** Postgres check_violation raised by `orders_money_check`, however the driver wraps it. */
export function isMoneyCheckViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
    const e = current as { code?: unknown; constraint_name?: unknown; cause?: unknown };
    if (e.code === '23514' && e.constraint_name === 'orders_money_check') return true;
    current = e.cause;
  }
  return false;
}
