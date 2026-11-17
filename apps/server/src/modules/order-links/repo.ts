/** Data access for `order_link_tokens`. */

import type { DatabaseWriter } from '@mia/db';
import { and, eq, isNull } from '@mia/db';
import { orderLinkTokens } from '@mia/db/schema';

export interface NewOrderLink {
  hash: string;
  orderId: string;
  steps: string;
  includeDetails: boolean;
  expiresAt: Date;
  createdByAdminUserId: string;
}

/**
 * Mints a link and revokes the order's earlier ones, so only the newest works.
 * Run inside the caller's transaction: a failure leaves the old link alive.
 */
export async function mint(db: DatabaseWriter, link: NewOrderLink): Promise<void> {
  await db
    .update(orderLinkTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(orderLinkTokens.orderId, link.orderId), isNull(orderLinkTokens.revokedAt)));
  await db.insert(orderLinkTokens).values({
    id: link.hash,
    orderId: link.orderId,
    steps: link.steps,
    includeDetails: link.includeDetails,
    expiresAt: link.expiresAt,
    createdByAdminUserId: link.createdByAdminUserId,
  });
}

export type LinkTokenRow = typeof orderLinkTokens.$inferSelect;

/** The token row for a raw token's hash, or undefined for an unknown one. */
export async function findByHash(
  db: DatabaseWriter,
  hash: string,
): Promise<LinkTokenRow | undefined> {
  const [row] = await db
    .select()
    .from(orderLinkTokens)
    .where(eq(orderLinkTokens.id, hash))
    .limit(1);
  return row;
}
