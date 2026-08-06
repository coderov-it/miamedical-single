import type { Database } from '@mia/db';
import { and, eq, lt } from '@mia/db';
import { sessions, users } from '@mia/db/schema';

import type { SessionMeta, UserRow } from './types.ts';

/** Data access only. No auth decisions, no DTO shaping — see service.ts. */

export async function findByEmail(db: Database, email: string): Promise<UserRow | undefined> {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function findById(db: Database, id: string): Promise<UserRow | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function createSession(
  db: Database,
  data: { tokenHash: string; userId: string; expiresAt: Date; meta: SessionMeta },
): Promise<void> {
  await db.insert(sessions).values({
    id: data.tokenHash,
    userId: data.userId,
    expiresAt: data.expiresAt,
    ipAddress: data.meta.ipAddress,
    userAgent: data.meta.userAgent,
  });
}

export async function deleteSession(db: Database, tokenHash: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, tokenHash));
}

/** Used after a password change, so other devices are signed out. */
export async function deleteSessionsForUser(db: Database, userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** Housekeeping on login — cheap, and keeps the table from growing forever. */
export async function deleteExpiredSessions(db: Database, userId: string): Promise<void> {
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
}

export async function touchLastLogin(db: Database, userId: string): Promise<void> {
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
}

export async function updatePasswordHash(
  db: Database,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}
