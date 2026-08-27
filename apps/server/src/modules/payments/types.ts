export interface PaymentListFilters {
  page: number;
  perPage: number;
  q?: string | undefined;
  paymentStatus?:
    | 'unpaid'
    | 'authorized'
    | 'paid'
    | 'partially_refunded'
    | 'refunded'
    | 'failed'
    | undefined;
  type?: 'rental' | 'fixed' | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export interface PaymentRow {
  orderId: string;
  orderNumber: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  total: string;
  currency: string;
  orderStatus: string;
  paymentStatus: string;
  placedAt: Date;
  orderType: string;
}
