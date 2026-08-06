import type { users } from '@mia/db/schema';

/** Plain database records. Repo returns these; nothing outside the module sees them. */
export type UserRow = typeof users.$inferSelect;

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
  user: UserRow;
  token: string;
  expiresAt: Date;
}
