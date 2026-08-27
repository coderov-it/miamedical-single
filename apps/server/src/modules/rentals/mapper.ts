import type { RentalStatus } from '@mia/validators';

import type { RentalSummaryDto } from './dto.ts';
import type { RentalRow } from './types.ts';

export function computeRentalStatus(row: RentalRow): RentalStatus {
  if (row.orderStatus === 'fulfilled' || row.orderStatus === 'cancelled') return 'completed';
  if (row.rentalEndDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (row.rentalEndDate < today) return 'overdue';
  }
  return 'active';
}

export function toRentalSummary(row: RentalRow): RentalSummaryDto {
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
    total: row.total,
    currency: row.currency,
  };
}
