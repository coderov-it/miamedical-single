/**
 * What both return lists print around a unit: product, customer, rental period
 * and who received the order. Pure, no IO; the queries live in unit-context.ts.
 */

import type { ProductMedia } from '@mia/db/schema';

export interface UnitDetails {
  /** Path only: the client prefixes the CDN base, as on the products list. */
  productImage: string | null;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerCity: string | null;
  /** `YYYY-MM-DD`, already shifted to the delivered dates. */
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  receivedAt: Date | null;
  receivedByName: string | null;
}

/** The raw columns `toUnitDetails` reads. */
export interface UnitRow {
  quantity: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  shippingAddress: Record<string, unknown> | null;
  media: Pick<ProductMedia, 'thumbnail'> | null;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
}

export interface ReceivedEvent {
  orderId: string;
  at: Date;
  byName: string | null;
}

/** Trimmed first + last name, or the email when both are empty. */
export function customerName(line: Pick<UnitRow, 'firstName' | 'lastName' | 'email'>): string {
  const name = [line.firstName, line.lastName]
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
  return name || line.email;
}

/** The shipping address is a jsonb snapshot: read the one field defensively. */
export function cityOf(address: Record<string, unknown> | null): string | null {
  const city = address && typeof address === 'object' ? address.city : null;
  return typeof city === 'string' && city.trim() ? city.trim() : null;
}

export function toUnitDetails(row: UnitRow, received: ReceivedEvent | undefined): UnitDetails {
  return {
    productImage: row.media?.thumbnail?.path ?? null,
    quantity: row.quantity,
    customerName: customerName(row),
    customerEmail: row.email,
    customerPhone: row.phone?.trim() || null,
    customerCity: cityOf(row.shippingAddress),
    rentalStartDate: row.rentalStartDate,
    rentalEndDate: row.rentalEndDate,
    receivedAt: received?.at ?? null,
    receivedByName: received?.byName ?? null,
  };
}

/** Rows come newest first; the first one seen per order is its latest. */
export function latestPerOrder(rows: readonly ReceivedEvent[]): Map<string, ReceivedEvent> {
  const latest = new Map<string, ReceivedEvent>();
  for (const row of rows) if (!latest.has(row.orderId)) latest.set(row.orderId, row);
  return latest;
}

/**
 * Position of each inspection row among its line's rows, inspected-first.
 * Input is ordered by inspectedAt then id: line A rows [r1, r2] → r1:1, r2:2.
 */
export function unitNumbers(
  rows: readonly { id: string; orderItemId: string }[],
): Map<string, number> {
  const seen = new Map<string, number>();
  const numbers = new Map<string, number>();
  for (const row of rows) {
    const next = (seen.get(row.orderItemId) ?? 0) + 1;
    seen.set(row.orderItemId, next);
    numbers.set(row.id, next);
  }
  return numbers;
}
