/**
 * Opening a private order link: the raw token → its row → the order it belongs to,
 * or the refusal. The raw token is hashed first; only the hash is ever looked up.
 *
 * ```
 * unknown token        → 404
 * revoked / expired    → 410 { reason }   (a newer link replaced it / 30 days passed)
 * order paid / closed  → 410 { reason }   (nothing left to complete)
 * live                 → { token, order, contract }
 * ```
 */

import type { DatabaseWriter } from '@mia/db';
import { eq } from '@mia/db';
import { orders } from '@mia/db/schema';

import { notFound } from '../../shared/http/errors.ts';
import * as contractsRepo from '../contracts/repo.ts';
import type { OrderItemRow, OrderRow } from '../orders/types.ts';
import { goneError, linkRefusal } from './access.ts';
import * as repo from './repo.ts';
import { hashToken } from './token.ts';

export interface LinkContext {
  token: repo.LinkTokenRow;
  order: OrderRow & { items: OrderItemRow[] };
  /** Status of the order's newest non-voided contract; null when none exists. */
  contractStatus: string | null;
}

export async function redeem(db: DatabaseWriter, rawToken: string): Promise<LinkContext> {
  const token = await repo.findByHash(db, hashToken(rawToken));
  if (!token) throw notFound('Link');
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, token.orderId),
    with: { items: true },
  });
  if (!order) throw notFound('Link');
  const refusal = linkRefusal(token, order, new Date());
  if (refusal) throw goneError(refusal);
  const contract = await contractsRepo.findLatestActiveByOrderId(db, order.id);
  return { token, order, contractStatus: contract?.status ?? null };
}
