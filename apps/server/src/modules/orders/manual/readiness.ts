/**
 * Whether a manual order's customer details are complete enough to start it.
 * Same rule as `CheckoutCustomerSchema` (the online checkout), held here because
 * a manual order is created with the email alone. See docs/code/manual-orders.md.
 *
 * ```
 * customerType 'company', codiceFiscale set, partitaIva null  →  ['partitaIva']
 * everything set                                              →  []
 * ```
 */

import { httpError } from '../../../shared/http/errors.ts';
import type { OrderRow } from '../types.ts';

export type ReadinessOrder = Pick<
  OrderRow,
  'firstName' | 'lastName' | 'phone' | 'customerType' | 'codiceFiscale' | 'partitaIva'
>;

const blank = (value: string | null): boolean => value === null || value.trim() === '';

/** The order's form keys still missing, in the order the form shows them. */
export function missingCustomerFields(order: ReadinessOrder): string[] {
  const missing: string[] = [];
  if (blank(order.firstName)) missing.push('firstName');
  if (blank(order.lastName)) missing.push('lastName');
  if (blank(order.phone)) missing.push('phone');
  if (order.customerType === null) {
    missing.push('customerType');
    return missing;
  }
  const needsFiscalCode = order.customerType === 'private' || order.customerType === 'company';
  if (needsFiscalCode && blank(order.codiceFiscale)) missing.push('codiceFiscale');
  if (order.customerType === 'company' && blank(order.partitaIva)) missing.push('partitaIva');
  return missing;
}

/** 409 listing every missing field, so the caller can mark them all at once. */
export function assertStartable(order: ReadinessOrder): void {
  const missing = missingCustomerFields(order);
  if (missing.length === 0) return;
  const message = 'Complete the customer details first.';
  const fields = Object.fromEntries(missing.map((key) => [key, 'Required.']));
  throw httpError(409, message, 'conflict', { fields });
}
