import type { ExtensionOptionDto, RentalExtensionDto } from './dto.ts';
import type { ExtensionOption, ExtensionRow } from './types.ts';

export function toExtension(row: ExtensionRow): RentalExtensionDto {
  let requestedBy: RentalExtensionDto['requestedBy'] = null;
  if (row.requestedByCustomerAccountId) requestedBy = 'customer';
  if (row.requestedByAdminUserId) requestedBy = 'operator';

  return {
    id: row.id,
    status: row.status,
    fromDate: row.fromDate,
    toDate: row.toDate,
    days: row.days,
    amount: row.amount,
    currency: row.currency,
    requestedBy,
    paymentMethod: row.paymentMethod,
    paymentReference: row.paymentReference,
    paidAt: row.paidAt?.toISOString() ?? null,
    contractId: row.contractId,
    contractNumber: row.contractNumber,
    contractStatus: row.contractStatus,
    activatedAt: row.activatedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    cancelReason: row.cancelReason,
    createdAt: row.createdAt.toISOString(),
  };
}

/** The per-line split stays server-side; a reader needs the length and the price. */
export function toOption(option: ExtensionOption): ExtensionOptionDto {
  return {
    days: option.days,
    label: option.label,
    amount: option.amount,
    fromDate: option.fromDate,
    toDate: option.toDate,
  };
}
