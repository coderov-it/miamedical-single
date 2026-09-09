import type { Database } from '@mia/db';
import { and, eq, lt } from '@mia/db';
import { adminSessions, adminUsers } from '@mia/db/schema';

import type { AdminUserRow, SessionMeta } from './types.ts';

/** Data access only. No auth decisions, no DTO shaping — see service.ts. */

export async function findByEmail(db: Database, email: string): Promise<AdminUserRow | undefined> {
  return db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email) });
}

export async function findById(db: Database, id: string): Promise<AdminUserRow | undefined> {
  return db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
}

export async function createSession(
  db: Database,
  data: { tokenHash: string; adminUserId: string; expiresAt: Date; meta: SessionMeta },
): Promise<void> {
  await db.insert(adminSessions).values({
    id: data.tokenHash,
    adminUserId: data.adminUserId,
    expiresAt: data.expiresAt,
    ipAddress: data.meta.ipAddress,
    userAgent: data.meta.userAgent,
  });
}

export async function deleteSession(db: Database, tokenHash: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.id, tokenHash));
}

/** Used after a password change, so other devices are signed out. */
export async function deleteSessionsForUser(db: Database, adminUserId: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.adminUserId, adminUserId));
}

/** Housekeeping on login — cheap, and keeps the table from growing forever. */
export async function deleteExpiredSessions(db: Database, adminUserId: string): Promise<void> {
  await db
    .delete(adminSessions)
    .where(
      and(eq(adminSessions.adminUserId, adminUserId), lt(adminSessions.expiresAt, new Date())),
    );
}

export async function touchLastLogin(db: Database, adminUserId: string): Promise<void> {
  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, adminUserId));
}

export async function updatePasswordHash(
  db: Database,
  adminUserId: string,
  passwordHash: string,
): Promise<void> {
  await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, adminUserId));
}

/**
 * Your own details. Narrower than `admin-users/repo.ts`'s `update` by design —
 * `isActive` is absent, so no amount of wrong policy above this line can let an
 * operator disable themselves through the profile screen.
 */
export async function updateProfile(
  db: Database,
  adminUserId: string,
  values: Partial<Pick<AdminUserRow, 'email' | 'fullName' | 'phone'>>,
): Promise<void> {
  if (Object.keys(values).length === 0) return;
  await db.update(adminUsers).set(values).where(eq(adminUsers.id, adminUserId));
}
