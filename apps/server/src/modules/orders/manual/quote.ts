/**
 * Prices a manual order's lines for the form's totals card; writes nothing.
 * The form never computes money: every figure on screen comes from here, through
 * the same `resolveLines` the order creation uses. Docs: docs/code/manual-orders.md.
 *
 * ```
 * letto-degenza 7-day x1, discountAmount 20.00 → subtotal 180.00, discount 20.00, total 160.00
 * discountAmount 180.00 on 180.00              → 422 on "amount", nothing left to charge
 * ```
 */

import type { Database } from '@mia/db';
import { NO_DELIVERY_FEE, isNegative, isZero } from '@mia/pricing';
import type { ManualOrderQuoteInput } from '@mia/validators';

import { resolveLines } from '../placement-input.ts';
import { sumLines } from '../resolve.ts';
import { orderTotal } from '../totals.ts';
import { invalid } from './pricing.ts';

export interface QuotedLine {
  productTitle: string;
  quantity: number;
  unitPrice: string;
  total: string;
  packageLabel: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface OrderQuote {
  lines: QuotedLine[];
  subtotal: string;
  shippingTotal: string;
  discountTotal: string;
  total: string;
  currency: string;
}

export async function quoteManualOrder(
  db: Database,
  input: ManualOrderQuoteInput,
): Promise<OrderQuote> {
  const { lines, currency } = await resolveLines(db, input.items);
  const subtotal = sumLines(lines);
  const shippingTotal = input.shippingTotal ?? NO_DELIVERY_FEE;
  const discountTotal = input.discountAmount ?? '0.00';
  const total = orderTotal(subtotal, shippingTotal, discountTotal);
  if (isNegative(total) || isZero(total)) {
    throw invalid('amount', 'The discount must leave something to pay.');
  }
  return {
    lines: lines.map((line) => ({
      productTitle: line.productTitle,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
      packageLabel: line.configuration.rentalPackage?.label ?? null,
      startDate: line.configuration.rental?.startDate ?? null,
      endDate: line.configuration.rental?.endDate ?? null,
    })),
    subtotal,
    shippingTotal,
    discountTotal,
    total,
    currency,
  };
}
