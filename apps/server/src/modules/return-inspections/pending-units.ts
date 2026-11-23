/** Expands rental lines into the units nobody has decided yet. Pure, no IO. */

import type { UnitDetails } from './unit-details.ts';

export interface PendingLine extends Omit<UnitDetails, 'receivedAt'> {
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  productTitle: string;
  /** Decisions already written for this line. */
  decided: number;
  receivedAt: Date;
}

export interface PendingUnit extends Omit<UnitDetails, 'receivedAt'> {
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  productTitle: string;
  unitNumber: number;
  receivedAt: Date;
}

/**
 * qty 2 with 1 decided gives one unit, numbered 2. Oldest `receivedAt` first,
 * then order number, then unit number.
 */
export function pendingUnits(lines: readonly PendingLine[]): PendingUnit[] {
  const units: PendingUnit[] = [];
  for (const line of lines) {
    for (let unitNumber = line.decided + 1; unitNumber <= line.quantity; unitNumber += 1) {
      const { decided: _decided, ...unit } = line;
      units.push({ ...unit, unitNumber });
    }
  }
  return units.sort(
    (a, b) =>
      a.receivedAt.getTime() - b.receivedAt.getTime() ||
      a.orderNumber.localeCompare(b.orderNumber) ||
      a.unitNumber - b.unitNumber,
  );
}
