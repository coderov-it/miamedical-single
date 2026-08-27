import type { RentalStatus } from '@mia/validators';

export interface RentalListFilters {
  page: number;
  perPage: number;
  q?: string | undefined;
  status?: RentalStatus | undefined;
}

export interface RentalRow {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  productTitle: string;
  orderItemId: string;
  total: string;
  currency: string;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  rentalDuration: number | null;
  rentalUnit: string | null;
  rentalPackageName: string | null;
  contractId: string | null;
  contractStatus: string | null;
}
