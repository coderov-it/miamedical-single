import type { RentalStatus } from '@mia/validators';

import { isClosedRentalOrderStatus, romeToday } from '../../shared/rental-calendar.ts';
import type { ExtensionStatus } from '../rental-extensions/types.ts';
import type { RentalSummaryDto } from './dto.ts';
import type { RentalRow } from './types.ts';

/** Same rules as the list filters in repo.ts, so a row never sits under the wrong tab. */
export function computeRentalStatus(row: RentalRow, today: string = romeToday()): RentalStatus {
  if (isClosedRentalOrderStatus(row.orderStatus)) return 'completed';
  if (row.rentalEndDate && row.rentalEndDate < today) return 'overdue';
  return 'active';
}

export function toRentalSummary(
  row: RentalRow,
  openExtension: ExtensionStatus | undefined,
): RentalSummaryDto {
  return {
    orderId: row.orderId,
    orderItemId: row.orderItemId,
    orderNumber: row.orderNumber,
    customerName: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || row.email,
    email: row.email,
    phone: row.phone,
    productTitle: row.productTitle,
    rentalStartDate: row.rentalStartDate,
    rentalEndDate: row.rentalEndDate,
    rentalPackage: row.rentalPackageName,
    status: computeRentalStatus(row),
    orderStatus: row.orderStatus,
    paymentStatus: row.paymentStatus,
    contractId: row.contractId,
    contractStatus: row.contractStatus,
    openExtensionStatus: openExtension ?? null,
    total: row.total,
    currency: row.currency,
  };
}
