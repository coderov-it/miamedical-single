/** The stage a pending manual order waits in. Pure; read by `mapper.ts`. */

import type { ManualStage } from '../dto.ts';
import type { OrderRow } from '../types.ts';

/**
 * Where a pending manual order waits. A rental not yet signed waits for the
 * signature, anything else unpaid waits for payment; paid onwards (and every online
 * order) has no stage and shows its normal status.
 */
export function manualStage(order: {
  source: OrderRow['source'];
  status: OrderRow['status'];
  paymentStatus: OrderRow['paymentStatus'];
  hasRental: boolean;
  contractStatus: string | null;
}): ManualStage | null {
  if (order.source !== 'manual' || order.status !== 'pending') return null;
  if (order.hasRental && order.contractStatus !== 'signed') return 'awaiting_signature';
  if (order.paymentStatus === 'unpaid') return 'awaiting_payment';
  return null;
}
