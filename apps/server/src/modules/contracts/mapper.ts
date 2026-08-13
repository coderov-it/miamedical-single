import type { ContractDetailDto, ContractSummaryDto } from './dto.ts';
import type { ContractDetailRow, ContractSummaryRow } from './repo.ts';

const iso = (value: Date) => value.toISOString();
const optIso = (value: Date | null) => (value ? iso(value) : null);

export function toContractSummary(row: ContractSummaryRow): ContractSummaryDto {
  const customer = (row.contractData as { customer?: { fullName?: string; email?: string } })
    .customer;
  return {
    id: row.id,
    number: row.number,
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    customerName: customer?.fullName ?? null,
    customerEmail: customer?.email ?? null,
    variant: row.variant,
    status: row.status,
    language: row.language,
    requiresDeposit: row.requiresDeposit,
    depositAmount: row.depositAmount,
    sentAt: optIso(row.sentAt),
    viewedAt: optIso(row.viewedAt),
    signedAt: optIso(row.signedAt),
    createdAt: iso(row.createdAt),
  };
}

export function toContractDetail(row: ContractDetailRow): ContractDetailDto {
  return {
    ...toContractSummary(row),
    contractData: row.contractData,
    signatureData: row.signatureData,
    voidedAt: optIso(row.voidedAt),
    voidReason: row.voidReason,
    voidedByAdminName: row.voidedByAdminName,
    pdfStorageKey: row.pdfStorageKey,
    updatedAt: iso(row.updatedAt),
  };
}
