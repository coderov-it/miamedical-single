import type { Database } from '@mia/db';
import { and, eq, gt, isNull } from '@mia/db';
import {
  addresses,
  carts,
  customerAccounts,
  customerAuthTokens,
  customerSessions,
  notifications,
  pushDevices,
} from '@mia/db/schema';

/** Data access only. The flow and its rules are in service.ts. */

/**
 * Drops every deletion code the account holds, spent or not, so only the one
 * about to be mailed works — and so its hash can never collide with an older
 * row still waiting for the expiry sweep.
 */
export async function discardCodes(db: Database, customerAccountId: string): Promise<void> {
  await db
    .delete(customerAuthTokens)
    .where(
      and(
        eq(customerAuthTokens.customerAccountId, customerAccountId),
        eq(customerAuthTokens.purpose, 'account_deletion'),
      ),
    );
}

/** A live, unspent code — checked without spending it, for the verify step. */
export async function hasLiveCode(db: Database, codeHash: string): Promise<boolean> {
  const row = await db.query.customerAuthTokens.findFirst({
    columns: { id: true },
    where: and(
      eq(customerAuthTokens.id, codeHash),
      eq(customerAuthTokens.purpose, 'account_deletion'),
      isNull(customerAuthTokens.consumedAt),
      gt(customerAuthTokens.expiresAt, new Date()),
    ),
  });
  return row !== undefined;
}

/**
 * Erases the account in one transaction.
 *
 * DELETED: sessions, emailed tokens, saved addresses, carts, push devices and
 * the in-app feed — everything that exists only because the account does.
 *
 * KEPT: orders and their disputes. They are fiscal records Italian law makes us
 * hold, and they carry their own name/email snapshot, so they neither need nor
 * reveal the account row. They stay pointing at the tombstone below.
 *
 * The row itself is soft-deleted as `customers.ts` describes: personal fields
 * blanked, `email` rewritten to a tombstone so the unique index holds and the
 * same address can sign up again as a clean new account.
 */
export async function eraseAccount(db: Database, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(customerSessions).where(eq(customerSessions.customerAccountId, id));
    await tx.delete(customerAuthTokens).where(eq(customerAuthTokens.customerAccountId, id));
    await tx.delete(addresses).where(eq(addresses.customerAccountId, id));
    await tx.delete(carts).where(eq(carts.customerAccountId, id));
    await tx.delete(pushDevices).where(eq(pushDevices.customerAccountId, id));
    await tx.delete(notifications).where(eq(notifications.customerAccountId, id));
    await tx
      .update(customerAccounts)
      .set({
        email: `deleted-${id}@deleted.invalid`,
        passwordHash: null,
        firstName: '',
        lastName: '',
        phone: null,
        language: null,
        notificationPreferences: {},
        isActive: false,
        deletedAt: new Date(),
      })
      .where(eq(customerAccounts.id, id));
  });
}
