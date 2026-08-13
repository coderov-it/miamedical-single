import type { customerAccounts, customerAuthTokens } from '@mia/db/schema';

/** Plain database records. Repo returns these; nothing outside the module sees them. */
export type CustomerAccountRow = typeof customerAccounts.$inferSelect;
export type CustomerAuthTokenRow = typeof customerAuthTokens.$inferSelect;

export type AuthTokenPurpose = CustomerAuthTokenRow['purpose'];

/** Request-derived audit fields recorded against a session or a token. */
export interface SessionMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * What a successful sign-in produces. `token` is the only time the raw value
 * exists server-side — the database stores its SHA-256 and nothing else.
 */
export interface IssuedCustomerSession {
  account: CustomerAccountRow;
  token: string;
  expiresAt: Date;
}

/**
 * A token that was just minted. The raw value is returned exactly once, to be put
 * in an email; afterwards only its hash exists and it cannot be recovered.
 */
export interface IssuedAuthToken {
  token: string;
  expiresAt: Date;
}
