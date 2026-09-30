import type { Database } from '@mia/db';
import type {
  ConfirmAccountDeletionInput,
  RequestAccountDeletionInput,
  VerifyAccountDeletionInput,
} from '@mia/validators';
import { randomInt } from 'node:crypto';

import { hashToken } from '../../shared/auth/session.ts';
import { httpError } from '../../shared/http/errors.ts';
import * as accounts from '../customer-auth/repo.ts';
import { TOKEN_TTL_MS } from '../customer-auth/service.ts';
import type { CustomerAccountRow } from '../customer-auth/types.ts';
import * as notifications from '../notifications/mail.ts';
import * as repo from './repo.ts';

/**
 * Public profile deletion — the page Google Play requires, reachable without
 * the app. Walk and reasoning: docs/code/account-deletion.md.
 *
 * Proof of ownership is a 6-digit code mailed to the account's address. Short
 * enough to type from a phone, and safe because each code is bound to ONE
 * account (its hash includes the account id) and the routes cap wrong guesses
 * per identifier — see the limiters in routes.ts.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Wrong, spent, expired, or no such account. Never says which. */
const invalidCode = () =>
  httpError(400, 'This code is not valid or has expired.', 'invalid_code', {
    fields: { code: 'This code is not valid or has expired.' },
  });

/** Email or customer id; anything that is neither simply matches nobody. */
function findAccount(db: Database, identifier: string): Promise<CustomerAccountRow | undefined> {
  const value = identifier.trim().toLowerCase();
  if (UUID.test(value)) return accounts.findById(db, value);
  return accounts.findByEmail(db, value);
}

/** Bound to the account, so a code guessed for one account opens no other. */
function codeHash(accountId: string, code: string): Promise<string> {
  return hashToken(`${accountId}:${code}`);
}

/**
 * Mails a fresh code when the identifier matches an account; does nothing
 * otherwise. The route answers the same either way, so this is not a way to
 * learn who has an account. Any earlier code stops working.
 */
export async function requestCode(
  db: Database,
  input: RequestAccountDeletionInput,
  ipAddress: string | null,
): Promise<void> {
  const account = await findAccount(db, input.identifier);
  if (!account) return;

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await repo.discardCodes(db, account.id);
  await accounts.createAuthToken(db, {
    tokenHash: await codeHash(account.id, code),
    customerAccountId: account.id,
    purpose: 'account_deletion',
    orderId: null,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS.account_deletion),
    ipAddress,
  });

  await notifications.sendAccountDeletionCode({ email: account.email, code });
}

/** The page's middle step: is this code right? Spends nothing. */
export async function verifyCode(db: Database, input: VerifyAccountDeletionInput): Promise<void> {
  const account = await findAccount(db, input.identifier);
  if (!account) throw invalidCode();
  if (!(await repo.hasLiveCode(db, await codeHash(account.id, input.code)))) throw invalidCode();
}

/**
 * Spends the code and erases the account. The spend is one atomic UPDATE, so
 * two confirms racing each other cannot both run the erasure.
 */
export async function confirmDeletion(
  db: Database,
  input: ConfirmAccountDeletionInput,
): Promise<void> {
  const account = await findAccount(db, input.identifier);
  if (!account) throw invalidCode();

  const spent = await accounts.consumeAuthToken(db, await codeHash(account.id, input.code), [
    'account_deletion',
  ]);
  if (!spent) throw invalidCode();

  await repo.eraseAccount(db, account.id);
}
