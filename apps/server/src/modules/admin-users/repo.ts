import type { Database } from '@mia/db';
import { and, asc, count, eq, ilike, ne, or } from '@mia/db';
import { adminSessions, adminUsers } from '@mia/db/schema';

import type { AdminUserListFilters, AdminUserRow } from './types.ts';

/** Data access only. No policy — see service.ts. */

function whereFor(filters: AdminUserListFilters) {
  const clauses = [];

  if (filters.q) {
    const term = `%${filters.q}%`;
    clauses.push(or(ilike(adminUsers.email, term), ilike(adminUsers.fullName, term)));
  }
  if (filters.status !== 'all') {
    clauses.push(eq(adminUsers.isActive, filters.status === 'active'));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function list(
  db: Database,
  filters: AdminUserListFilters,
): Promise<{ rows: AdminUserRow[]; total: number }> {
  const where = whereFor(filters);

  const rows = await db.query.adminUsers.findMany({
    ...(where ? { where } : {}),
    // Email, not creation date: this is a list people scan for a name.
    orderBy: asc(adminUsers.email),
    limit: filters.perPage,
    offset: (filters.page - 1) * filters.perPage,
  });

  const [totals] = await db
    .select({ value: count() })
    .from(adminUsers)
    .where(where ?? undefined);

  return { rows, total: totals?.value ?? 0 };
}

export async function findById(db: Database, id: string): Promise<AdminUserRow | undefined> {
  return db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
}

export async function findByEmail(db: Database, email: string): Promise<AdminUserRow | undefined> {
  return db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email) });
}

export async function create(
  db: Database,
  values: {
    email: string;
    fullName: string;
    phone: string | null;
    passwordHash: string;
    isSuperuser: boolean;
    permissions: number[];
  },
): Promise<AdminUserRow> {
  const [row] = await db
    .insert(adminUsers)
    .values({
      ...values,
      // Created by hand by another operator, so there is nothing to verify.
      emailVerifiedAt: new Date(),
    })
    .returning();
  if (!row) throw new Error('Admin user insert returned no row.');
  return row;
}

export async function update(
  db: Database,
  id: string,
  values: Partial<Pick<AdminUserRow, 'email' | 'fullName' | 'phone' | 'isActive'>>,
): Promise<void> {
  await db.update(adminUsers).set(values).where(eq(adminUsers.id, id));
}

export async function setPermissions(
  db: Database,
  id: string,
  values: { isSuperuser: boolean; permissions: number[] },
): Promise<void> {
  await db.update(adminUsers).set(values).where(eq(adminUsers.id, id));
}

export async function setPasswordHash(
  db: Database,
  id: string,
  passwordHash: string,
): Promise<void> {
  await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, id));
}

export async function remove(db: Database, id: string): Promise<void> {
  // `admin_sessions.admin_user_id` is ON DELETE CASCADE.
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
}

/** Signs the account out everywhere. Used after a password reset or a lockout. */
export async function deleteSessions(db: Database, id: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.adminUserId, id));
}

/**
 * How many *other* accounts could still grant access if this one stopped being
 * able to. Counted rather than fetched because the only question asked of it is
 * "is this the last one".
 */
export async function countOtherActiveSuperusers(db: Database, exceptId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.isSuperuser, true),
        eq(adminUsers.isActive, true),
        ne(adminUsers.id, exceptId),
      ),
    );
  return row?.value ?? 0;
}
