import type { Database } from '@mia/db';
import type {
  CustomerLoginInput,
  RedeemAuthTokenInput,
  SetCustomerPasswordInput,
} from '@mia/validators';

import {
  CUSTOMER_SESSION_TTL_MS,
  createSessionToken,
  hashToken,
} from '../../shared/auth/customer-session.ts';
import {
  fakeVerify,
  hashPassword,
  needsRehash,
  verifyPassword,
} from '../../shared/auth/password.ts';
import { httpError } from '../../shared/http/errors.ts';
import * as notifications from '../notifications/service.ts';
import * as repo from './repo.ts';
import type {
  AuthTokenPurpose,
  CustomerAccountRow,
  IssuedAuthToken,
  IssuedCustomerSession,
  SessionMeta,
} from './types.ts';

/**
 * Storefront authentication policy.
 *
 * Accounts are not registered, they are created by checkout — see
 * `resolveForOrder` and docs/code/customer-accounts.md. Everything here is about
 * what happens afterwards: proving the inbox, signing in, setting a password.
 */

/** How long each kind of emailed link stays usable. Policy, not schema. */
const TOKEN_TTL_MS: Record<AuthTokenPurpose, number> = {
  // Long: it rides on an order confirmation, and people read those late.
  activation: 7 * 24 * 60 * 60 * 1000,
  // Short: it is a live credential sitting in an inbox.
  magic_link: 15 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
  // Long: a dispute may only be noticed when a statement arrives.
  order_report: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Don't re-mail an activation link that is still fresh. Three orders in an
 * afternoon should produce one invitation, not three racing into the same inbox.
 */
const ACTIVATION_RESEND_GRACE_MS = 15 * 60 * 1000;

/**
 * One message for every failure mode — wrong password, unknown email, disabled
 * account, password-less account. Telling them apart tells an attacker which
 * addresses are worth attacking.
 */
const invalidCredentials = () =>
  httpError(401, 'Incorrect email or password.', 'invalid_credentials');

/** A spent, expired, or simply wrong token. Never says which. */
const invalidToken = () =>
  httpError(400, 'This link is no longer valid. Request a new one.', 'invalid_token');

// --- tokens -----------------------------------------------------------------

/**
 * Mints a token and stores only its hash. The raw value is returned once, for an
 * email; after this call it cannot be recovered from the database.
 */
export async function issueAuthToken(
  db: Database,
  input: {
    customerAccountId: string;
    purpose: AuthTokenPurpose;
    orderId?: string | null;
    ipAddress?: string | null;
  },
): Promise<IssuedAuthToken> {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS[input.purpose]);

  await repo.createAuthToken(db, {
    tokenHash: await hashToken(token),
    customerAccountId: input.customerAccountId,
    purpose: input.purpose,
    orderId: input.orderId ?? null,
    expiresAt,
    ipAddress: input.ipAddress ?? null,
  });

  return { token, expiresAt };
}

/** True when an unspent activation link was issued recently enough to reuse. */
export async function hasFreshActivationToken(
  db: Database,
  customerAccountId: string,
): Promise<boolean> {
  const existing = await repo.findFreshUnconsumedToken(
    db,
    customerAccountId,
    'activation',
    ACTIVATION_RESEND_GRACE_MS,
  );
  return existing !== undefined;
}

// --- sessions ---------------------------------------------------------------

async function issueSession(
  db: Database,
  account: CustomerAccountRow,
  meta: SessionMeta,
): Promise<IssuedCustomerSession> {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + CUSTOMER_SESSION_TTL_MS);

  await repo.deleteExpiredSessionsForAccount(db, account.id);
  await repo.createSession(db, {
    tokenHash: await hashToken(token),
    customerAccountId: account.id,
    expiresAt,
    meta,
  });
  await repo.touchLastLogin(db, account.id);

  return { account, token, expiresAt };
}

export async function login(
  db: Database,
  input: CustomerLoginInput,
  meta: SessionMeta,
): Promise<IssuedCustomerSession> {
  const account = await repo.findByEmail(db, input.email);

  if (!account) {
    // Spend the same time as a real verification so response timing does not
    // reveal whether the address exists.
    await fakeVerify(input.password);
    throw invalidCredentials();
  }

  const passwordOk = await verifyPassword(input.password, account.passwordHash);
  if (!passwordOk || !account.isActive) throw invalidCredentials();

  if (account.passwordHash && needsRehash(account.passwordHash)) {
    await repo.updatePasswordHash(db, account.id, await hashPassword(input.password));
  }

  return issueSession(db, account, meta);
}

/** Idempotent: an unknown or already-deleted token is not an error. */
export async function logout(db: Database, token: string | undefined): Promise<void> {
  if (!token) return;
  await repo.deleteSession(db, await hashToken(token));
}

// --- emailed sign-in --------------------------------------------------------

/**
 * Requests a magic link or a password reset.
 *
 * Returns nothing and never signals whether the address exists — the route always
 * answers the same way. An endpoint that 404s on unknown emails is an account
 * enumeration oracle, and this one is unauthenticated by definition.
 *
 * A mail failure DOES propagate here, unlike order mail: the caller is about to
 * tell someone "check your inbox", and there is nothing recorded that they would
 * lose by being asked to try again.
 */
export async function requestEmailedLink(
  db: Database,
  email: string,
  purpose: Extract<AuthTokenPurpose, 'magic_link' | 'password_reset'>,
  ipAddress: string | null,
): Promise<void> {
  const account = await repo.findByEmail(db, email);
  if (!account || !account.isActive) return;

  const { token } = await issueAuthToken(db, {
    customerAccountId: account.id,
    purpose,
    ipAddress,
  });

  if (purpose === 'magic_link') {
    await notifications.sendMagicLink({ email: account.email, token });
  } else {
    await notifications.sendPasswordReset({ email: account.email, token });
  }
}

export interface RedeemResult extends IssuedCustomerSession {
  /** The order the link came from, when it carried one — the caller confirms it. */
  orderId: string | null;
}

/**
 * Redeems an activation, magic-link or reset token: signs them in, marks the
 * account activated, and optionally sets a password.
 *
 * `order_report` is excluded. It is a capability for one specific page and must
 * never be spendable as a sign-in — that would turn a link designed for "this
 * wasn't me" into a way into the account it was complaining about.
 */
export async function redeemToken(
  db: Database,
  input: RedeemAuthTokenInput,
  meta: SessionMeta,
): Promise<RedeemResult> {
  const row = await repo.consumeAuthToken(db, await hashToken(input.token), [
    'activation',
    'magic_link',
    'password_reset',
  ]);
  if (!row) throw invalidToken();

  const account = await repo.findById(db, row.customerAccountId);
  if (!account || !account.isActive) throw invalidToken();

  if (input.password) {
    await repo.updatePasswordHash(db, account.id, await hashPassword(input.password));
  }

  // Redeeming any emailed link proves they read the inbox, which is exactly what
  // "activated" records. Idempotent in the repo, so a later link cannot move it.
  await repo.markActivated(db, account.id);

  const issued = await issueSession(db, account, meta);
  return { ...issued, orderId: row.orderId };
}

// --- password ---------------------------------------------------------------

/**
 * Sets or changes the password from inside a session.
 *
 * Revokes every OTHER session and keeps the caller's, which differs from the back
 * office (`modules/auth/service.ts`) on purpose: a stolen session still dies the
 * moment the victim reacts, but the customer is not thrown onto a login screen
 * immediately after choosing a password — the case that matters most, since
 * setting one is the first thing an activating customer does.
 */
export async function setPassword(
  db: Database,
  customerAccountId: string,
  input: SetCustomerPasswordInput,
  currentSessionToken: string | undefined,
): Promise<void> {
  const account = await repo.findById(db, customerAccountId);
  if (!account) throw invalidCredentials();

  // Only an account that already has a password can be asked to prove it.
  if (account.passwordHash) {
    if (!input.currentPassword) {
      throw httpError(422, 'Enter your current password.', 'validation_failed', {
        fields: { currentPassword: 'Enter your current password.' },
      });
    }
    if (!(await verifyPassword(input.currentPassword, account.passwordHash))) {
      throw httpError(422, 'Current password is incorrect.', 'validation_failed', {
        fields: { currentPassword: 'Current password is incorrect.' },
      });
    }
  }

  await repo.updatePasswordHash(db, account.id, await hashPassword(input.newPassword));
  await repo.deleteOtherSessionsForAccount(
    db,
    account.id,
    currentSessionToken ? await hashToken(currentSessionToken) : undefined,
  );
}

export { repo };
