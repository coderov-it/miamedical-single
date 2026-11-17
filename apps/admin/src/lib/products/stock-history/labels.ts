import { type MessageKey, t } from '~/lib/ui-text';

import type { Reason } from './types';

const REASON_KEYS: Record<Reason, MessageKey> = {
  opening_balance: 'stock.reasonOpeningBalance',
  product_created: 'stock.reasonProductCreated',
  order_placed: 'stock.reasonOrderPlaced',
  order_paid: 'stock.reasonOrderPaid',
  order_cancelled: 'stock.reasonOrderCancelled',
  order_refunded: 'stock.reasonOrderRefunded',
  rental_returned: 'stock.reasonRentalReturned',
  manual_adjustment: 'stock.reasonManualAdjustment',
  unknown: 'stock.reasonUnknown',
};

export function reasonLabel(reason: Reason): string {
  return t(REASON_KEYS[reason]);
}

/** Who did it: the named operator, else the customer for a placed order, else the system. */
export function actorLabel(reason: Reason, actorName: string | null): string {
  if (actorName) return actorName;
  if (reason === 'order_placed') return t('stock.actorCustomer');
  return t('stock.actorSystem');
}
