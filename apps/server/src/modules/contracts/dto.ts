import type { ContractStatus, ContractVariant } from '@mia/validators';

export interface ContractSummaryDto {
  id: string;
  number: string;
  /** Both null for manual contracts, which have no storefront order. */
  orderId: string | null;
  orderNumber: string | null;
  /** Lifted out of the contractData snapshot for lists and search results. */
  customerName: string | null;
  customerEmail: string | null;
  variant: ContractVariant;
  status: ContractStatus;
  language: string;
  requiresDeposit: boolean;
  depositAmount: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  createdAt: string;
}

export interface ContractDetailDto extends ContractSummaryDto {
  contractData: Record<string, unknown>;
  signatureData: Record<string, unknown> | null;
  voidedAt: string | null;
  voidReason: string | null;
  voidedByAdminName: string | null;
  pdfStorageKey: string | null;
  updatedAt: string;
}
