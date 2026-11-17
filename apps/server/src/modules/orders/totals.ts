/**
 * The one place an order's total is derived. See docs/code/manual-orders.md.
 *
 * ```
 * orderTotal('180.00', '0.00', '20.00')   → '160.00'
 * orderTotal('100.00', '15.00', '0.00')   → '115.00'
 * ```
 *
 * Placement passes a zero discount; `service.update` passes the order's stored
 * `discountTotal`, so changing the delivery fee on a discounted order keeps the
 * discount instead of silently dropping it.
 */

import { addMoney, subMoney } from '@mia/pricing';

export function orderTotal(subtotal: string, shipping: string, discount: string): string {
  return subMoney(addMoney(subtotal, shipping), discount);
}
