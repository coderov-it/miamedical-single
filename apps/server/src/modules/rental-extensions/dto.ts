import type { ExtensionStatus } from './types.ts';

export interface RentalExtensionDto {
  id: string;
  status: ExtensionStatus;
  fromDate: string;
  toDate: string;
  days: number;
  amount: string;
  currency: string;
  requestedBy: 'customer' | 'operator' | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  contractId: string | null;
  contractNumber: string | null;
  contractStatus: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

export interface ExtensionOptionDto {
  days: number;
  label: string;
  amount: string;
  fromDate: string;
  toDate: string;
}

/**
 * Why an order cannot be extended right now, as a code the reader words:
 * `closed` — the equipment is back, order it again instead; `open` — one
 * extension is already waiting; `hourly` — the shop extends hourly rentals by
 * hand; `no_rental` — nothing on the order is rented.
 */
export type ExtensionBlock = 'closed' | 'open' | 'hourly' | 'no_rental';

/** Everything an order page needs to show and start an extension. */
export interface ExtensionOverviewDto {
  orderNumber: string;
  currency: string;
  /** The day the equipment is due back today, before any open extension. */
  endDate: string | null;
  blockedBy: ExtensionBlock | null;
  options: ExtensionOptionDto[];
  open: RentalExtensionDto | null;
  /** Newest first, open one included. */
  history: RentalExtensionDto[];
}
