import type { Database } from '@mia/db';
import { and, eq, gt, inArray, isNull, lt, ne, sql } from '@mia/db';
import { customerAccounts, customerAuthTokens, customerSessions } from '@mia/db/schema';

import type {
  AuthTokenPurpose,
  CustomerAccountRow,
  CustomerAuthTokenRow,
  SessionMeta,
} from './types.ts';

/** Data access only. No auth decisions, no DTO shaping — see service.ts. */

/**
 * Live accounts only: a soft-deleted row is not findable by email, so a returning
 * customer on an erased address is treated as new rather than resurrected.
 */
export async function findByEmail(
  db: Database,
  email: string,
): Promise<CustomerAccountRow | undefined> {
  return db.query.customerAccounts.findFirst({
    where: and(eq(customerAccounts.email, email), isNull(customerAccounts.deletedAt)),
  });
}

export async function findById(db: Database, id: string): Promise<CustomerAccountRow | undefined> {
  return db.query.customerAccounts.findFirst({
    where: and(eq(customerAccounts.id, id), isNull(customerAccounts.deletedAt)),
  });
}

/**
 * Creates the account for an email, or returns the one already there.
 *
 * `ON CONFLICT (email) DO UPDATE` rather than select-then-insert: two people
 * checking out from the same address in the same instant would both see no row and
 * both insert, and the unique index would turn that into a failed checkout for
 * whoever lost. The no-op update is what makes the row returnable in that case.
 *
 * The name and phone of an existing account are deliberately NOT overwritten: the
 * account holder's own profile outranks whatever was typed into a later checkout,
 * which may not even have been typed by them.
 */
export async function createOrGetByEmail(
  db: Database,
  data: { email: string; firstName: string; lastName: string; phone: string | null },
): Promise<CustomerAccountRow> {
  const [row] = await db
    .insert(customerAccounts)
    .values(data)
    .onConflictDoUpdate({
      target: customerAccounts.email,
      set: { updatedAt: new Date() },
    })
    .returning();

  // Unreachable in practice: the upsert always returns its row. Narrowing only.
  if (!row) throw new Error('customer account upsert returned no row');
  return row;
}

export async function updateProfile(
  db: Database,
  id: string,
  patch: { firstName?: string; lastName?: string; phone?: string | null },
): Promise<void> {
  await db.update(customerAccounts).set(patch).where(eq(customerAccounts.id, id));
}

export async function updatePasswordHash(
  db: Database,
  id: string,
  passwordHash: string,
): Promise<void> {
  await db.update(customerAccounts).set({ passwordHash }).where(eq(customerAccounts.id, id));
}

export async function markActivated(db: Database, id: string): Promise<void> {
  await db
    .update(customerAccounts)
    .set({ activatedAt: sql`coalesce(${customerAccounts.activatedAt}, now())` })
    .where(eq(customerAccounts.id, id));
}

export async function touchLastLogin(db: Database, id: string): Promise<void> {
  await db
    .update(customerAccounts)
    .set({ lastLoginAt: new Date() })
    .where(eq(customerAccounts.id, id));
}

// --- sessions ---------------------------------------------------------------

export async function createSession(
  db: Database,
  data: { tokenHash: string; customerAccountId: string; expiresAt: Date; meta: SessionMeta },
): Promise<void> {
  await db.insert(customerSessions).values({
    id: data.tokenHash,
    customerAccountId: data.customerAccountId,
    expiresAt: data.expiresAt,
    ipAddress: data.meta.ipAddress,
    userAgent: data.meta.userAgent,
  });
}

export async function deleteSession(db: Database, tokenHash: string): Promise<void> {
  await db.delete(customerSessions).where(eq(customerSessions.id, tokenHash));
}

export async function deleteSessionsForAccount(
  db: Database,
  customerAccountId: string,
): Promise<void> {
  await db
    .delete(customerSessions)
    .where(eq(customerSessions.customerAccountId, customerAccountId));
}

/** Everything except the caller's own, for a password change. */
export async function deleteOtherSessionsForAccount(
  db: Database,
  customerAccountId: string,
  keepTokenHash: string | undefined,
): Promise<void> {
  await db
    .delete(customerSessions)
    .where(
      and(
        eq(customerSessions.customerAccountId, customerAccountId),
        keepTokenHash ? ne(customerSessions.id, keepTokenHash) : undefined,
      ),
    );
}

export async function deleteExpiredSessionsForAccount(
  db: Database,
  customerAccountId: string,
): Promise<void> {
  await db
    .delete(customerSessions)
    .where(
      and(
        eq(customerSessions.customerAccountId, customerAccountId),
        lt(customerSessions.expiresAt, new Date()),
      ),
    );
}

// --- one-shot emailed tokens -----------------------------------------------

export async function createAuthToken(
  db: Database,
  data: {
    tokenHash: string;
    customerAccountId: string;
    purpose: AuthTokenPurpose;
    orderId: string | null;
    expiresAt: Date;
    ipAddress: string | null;
  },
): Promise<void> {
  await db.insert(customerAuthTokens).values({
    id: data.tokenHash,
    customerAccountId: data.customerAccountId,
    purpose: data.purpose,
    orderId: data.orderId,
    expiresAt: data.expiresAt,
    ipAddress: data.ipAddress,
  });
}

/**
 * Redeems a token, or returns undefined.
 *
 * One statement, and the `consumed_at IS NULL` predicate is inside it: two clicks
 * arriving together must not both succeed, and a select-then-update would let them.
 * Whoever's UPDATE matches the row gets it; the other matches nothing.
 */
export async function consumeAuthToken(
  db: Database,
  tokenHash: string,
  purposes: readonly AuthTokenPurpose[],
): Promise<CustomerAuthTokenRow | undefined> {
  const [row] = await db
    .update(customerAuthTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(customerAuthTokens.id, tokenHash),
        isNull(customerAuthTokens.consumedAt),
        gt(customerAuthTokens.expiresAt, new Date()),
        inArray(customerAuthTokens.purpose, [...purposes]),
      ),
    )
    .returning();

  return row;
}

/**
 * An unspent token of this purpose issued within `withinMs`.
 *
 * Feeds the resend throttle: three orders in a row should produce one activation
 * email, not three identical ones racing into the same inbox.
 */
export async function findFreshUnconsumedToken(
  db: Database,
  customerAccountId: string,
  purpose: AuthTokenPurpose,
  withinMs: number,
): Promise<CustomerAuthTokenRow | undefined> {
  return db.query.customerAuthTokens.findFirst({
    where: and(
      eq(customerAuthTokens.customerAccountId, customerAccountId),
      eq(customerAuthTokens.purpose, purpose),
      isNull(customerAuthTokens.consumedAt),
      gt(customerAuthTokens.createdAt, new Date(Date.now() - withinMs)),
    ),
  });
}

export async function deleteExpiredAuthTokens(db: Database): Promise<number> {
  const rows = await db
    .delete(customerAuthTokens)
    .where(lt(customerAuthTokens.expiresAt, new Date()))
    .returning({ id: customerAuthTokens.id });
  return rows.length;
}
