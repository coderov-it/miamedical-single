import type { RentalStatus } from '@mia/validators';

import type { ExtensionStatus } from '../rental-extensions/types.ts';

export interface RentalSummaryDto {
  orderId: string;
  /** One list row per rented line, so this — not orderId — is the row's identity. */
  orderItemId: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string | null;
  productTitle: string;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  rentalPackage: string | null;
  status: RentalStatus;
  orderStatus: string;
  paymentStatus: string;
  contractId: string | null;
  contractStatus: string | null;
  /** An extension waiting for payment or signature, if one is open. */
  openExtensionStatus: ExtensionStatus | null;
  total: string;
  currency: string;
}
