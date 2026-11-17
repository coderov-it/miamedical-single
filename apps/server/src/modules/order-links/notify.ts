/**
 * Telling the agent who created a manual order about its two milestones (decision 7 of
 * docs/code/manual-orders.md). They get the notice even without the general fan-out's
 * permission (`contract:read`, `order:read`), because the order is theirs.
 *
 * ```
 * customer signs from the link   → contract.signed to every contract:read operator except the agent,
 *                                  and to the agent (admin feed row, same payload)
 * order moves to paid            → order.status_changed (admin audience) to the agent
 * ```
 */

import type { Transaction } from '@mia/db';

import { emit, emitToAdmins } from '../notifications/write.ts';

export interface SignedNotice {
  orderId: string;
  contractNumber: string;
  orderNumber: string;
  customerName: string;
  createdByAdminUserId: string | null;
}

/** Inside the signing transaction, like the signature's other feed rows. */
export async function emitContractSigned(tx: Transaction, notice: SignedNotice): Promise<void> {
  const data = {
    contractNumber: notice.contractNumber,
    orderNumber: notice.orderNumber,
    customerName: notice.customerName,
  };
  await emitToAdmins(tx, {
    type: 'contract.signed',
    orderId: notice.orderId,
    data,
    exceptAdminUserId: notice.createdByAdminUserId,
  });
  if (!notice.createdByAdminUserId) return;
  await emit(tx, {
    audience: 'admin',
    adminUserId: notice.createdByAdminUserId,
    type: 'contract.signed',
    orderId: notice.orderId,
    data,
  });
}
