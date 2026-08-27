import type { PaymentSummaryDto } from './dto.ts';
import type { PaymentRow } from './types.ts';

export function toPaymentSummary(row: PaymentRow): PaymentSummaryDto {
  return {
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    customerName: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || row.email,
    email: row.email,
    total: row.total,
    currency: row.currency,
    type: row.orderType === 'rental' ? 'rental' : 'fixed',
    orderStatus: row.orderStatus,
    paymentStatus: row.paymentStatus,
    placedAt: row.placedAt.toISOString(),
  };
}

export function toCsv(rows: PaymentRow[]): string {
  const headers = [
    'Order Number',
    'Customer Name',
    'Email',
    'Type',
    'Amount',
    'Currency',
    'Payment Status',
    'Order Status',
    'Date',
  ];

  const lines = rows.map((row) =>
    [
      row.orderNumber,
      `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
      row.email,
      row.orderType === 'rental' ? 'Noleggio' : 'Vendita',
      row.total,
      row.currency,
      row.paymentStatus,
      row.orderStatus,
      row.placedAt.toISOString().slice(0, 10),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );

  return [headers.join(','), ...lines].join('\n');
}
