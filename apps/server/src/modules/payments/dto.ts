export interface PaymentSummaryDto {
  orderId: string;
  orderNumber: string;
  customerName: string;
  email: string;
  total: string;
  currency: string;
  type: 'rental' | 'fixed';
  orderStatus: string;
  paymentStatus: string;
  placedAt: string;
}

export interface PaymentStatsDto {
  totalRevenue: string;
  pendingCount: number;
  paidCount: number;
  currency: string;
}
