import type { RentalPackage, rentalExtensions } from '@mia/db/schema';

export type ExtensionStatus = (typeof rentalExtensions.$inferSelect)['status'];

/** An extension with the number and status of the contract that covers it. */
export type ExtensionRow = typeof rentalExtensions.$inferSelect & {
  contractNumber: string | null;
  contractStatus: string | null;
};

/** `rental_extensions.line_amounts`: the quote frozen per order item id. */
export type LineAmounts = Record<string, { unitPrice: string; total: string }>;

/** A rental line as the quote reads it. */
export interface RentalLine {
  id: string;
  productTitle: string;
  quantity: number;
  startDate: string | null;
  endDate: string | null;
  unit: 'hour' | 'day';
  packages: RentalPackage[];
}

/** One length the order can be extended by, priced across every rental line. */
export interface ExtensionOption {
  days: number;
  /** The first line's package name for this length, in the reader's language. */
  label: string;
  amount: string;
  /** Per-line amounts, keyed by order item id — what the contract table prints. */
  lineAmounts: LineAmounts;
  fromDate: string;
  toDate: string;
}
