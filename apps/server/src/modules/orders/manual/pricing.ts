/**
 * The arithmetic and refusals of a manual order's discount, pure so it is tested
 * without a database. Docs: docs/code/manual-orders.md.
 *
 * ```
 * subtotal 180.00, shipping 0.00, discount 20.00 "cliente storico" → total 160.00
 * discount 0.00                                                    → no discount, reason dropped
 * discount 180.00 on 180.00                                        → 422, nothing left to charge
 * ```
 */

import { isNegative, isZero } from '@mia/pricing';

import { conflict, httpError } from '../../../shared/http/errors.ts';
import { orderTotal } from '../totals.ts';

export interface DiscountInput {
  /** Two-decimal amount taken off the order; `0.00` removes the discount. */
  amount: string;
  reason?: string | null;
}

export function invalid(field: string, message: string) {
  return httpError(422, message, 'unprocessable_entity', { fields: { [field]: message } });
}

/** The figures a discount of `input` would give an order, or the 422 that refuses it. */
export function priceDiscount(
  order: { subtotal: string; shippingTotal: string },
  input: DiscountInput,
): { discountTotal: string; discountReason: string | null; total: string } {
  if (isNegative(input.amount)) throw invalid('amount', 'The discount cannot be negative.');
  if (isZero(input.amount)) {
    return {
      discountTotal: '0.00',
      discountReason: null,
      total: orderTotal(order.subtotal, order.shippingTotal, '0.00'),
    };
  }
  const reason = input.reason?.trim() ?? '';
  if (reason === '') throw invalid('reason', 'Give a reason for the discount.');

  const total = orderTotal(order.subtotal, order.shippingTotal, input.amount);
  if (isNegative(total) || isZero(total)) {
    throw invalid('amount', 'The discount must leave something to pay.');
  }
  return { discountTotal: input.amount, discountReason: reason, total };
}

/**
 * Whether the discount may still change (decision 8 of docs/code/manual-orders.md).
 * The signed contract states the amount and an open payment attempt has fixed it at
 * the gateway, so either one locks it with a 409.
 */
export function assertDiscountEditable(order: {
  source: 'online' | 'manual';
  status: string;
  contractStatus: string | null;
  hasPendingAttempt: boolean;
}): void {
  if (order.source !== 'manual') throw conflict('Only a manual order carries a discount.');
  if (order.status !== 'pending') throw conflict('A discount can only change on a pending order.');
  if (order.contractStatus === 'signed') {
    throw conflict('The customer signed the contract, so the discount can no longer change.');
  }
  if (order.hasPendingAttempt) {
    throw conflict('A payment is in progress, so the discount can no longer change.');
  }
}
