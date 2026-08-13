import type { adminUsers } from '@mia/db/schema';

/**
 * Plain database records. Repo returns these; nothing outside the module sees them.
 *
 * This module is the BACK-OFFICE side of authentication. Customers sign in through
 * `modules/customer-auth` against `customer_accounts`, with their own session
 * table and their own cookie — the two never share a row or a credential.
 */
export type AdminUserRow = typeof adminUsers.$inferSelect;

/** Request-derived audit fields recorded against a session at login. */
export interface SessionMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * What a successful login produces. `token` is the only time the raw value
 * exists server-side — the database stores its SHA-256 and nothing else.
 */
export interface IssuedSession {
  user: AdminUserRow;
  token: string;
  expiresAt: Date;
}
