import type { Database } from '@mia/db';
import type { ChangePasswordInput, LoginInput } from '@mia/validators';

import {
  fakeVerify,
  hashPassword,
  needsRehash,
  verifyPassword,
} from '../../shared/auth/password.ts';
import { SESSION_TTL_MS, createSessionToken, hashToken } from '../../shared/auth/session.ts';
import { httpError } from '../../shared/http/errors.ts';
import * as repo from './repo.ts';
import type { IssuedSession, SessionMeta, UserRow } from './types.ts';

/**
 * Authentication policy. The storefront is anonymous by design — these accounts
 * exist only for the back office, so anything without a back-office role is
 * refused here even if the password is correct.
 */

const BACK_OFFICE_ROLES = new Set<UserRow['role']>(['staff', 'admin', 'super_admin']);

/**
 * One message for every failure mode — wrong password, unknown email, disabled
 * account, customer record. Telling them apart tells an attacker which emails
 * are worth attacking.
 */
const invalidCredentials = () =>
  httpError(401, 'Incorrect email or password.', 'invalid_credentials');

export async function login(
  db: Database,
  input: LoginInput,
  meta: SessionMeta,
): Promise<IssuedSession> {
  const user = await repo.findByEmail(db, input.email);

  if (!user) {
    // Spend the same time as a real verification so response timing does not
    // reveal whether the address exists.
    await fakeVerify(input.password);
    throw invalidCredentials();
  }

  const passwordOk = await verifyPassword(input.password, user.passwordHash);
  if (!passwordOk || !user.isActive || !BACK_OFFICE_ROLES.has(user.role)) {
    throw invalidCredentials();
  }

  if (needsRehash(user.passwordHash)) {
    await repo.updatePasswordHash(db, user.id, await hashPassword(input.password));
  }

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await repo.deleteExpiredSessions(db, user.id);
  await repo.createSession(db, {
    tokenHash: await hashToken(token),
    userId: user.id,
    expiresAt,
    meta,
  });
  await repo.touchLastLogin(db, user.id);

  return { user, token, expiresAt };
}

/** Idempotent: an unknown or already-deleted token is not an error. */
export async function logout(db: Database, token: string | undefined): Promise<void> {
  if (!token) return;
  await repo.deleteSession(db, await hashToken(token));
}

/**
 * Changing a password revokes every session, including the caller's own. The
 * alternative — keeping the current one alive — leaves a stolen session valid
 * after the victim reacts to the theft.
 */
export async function changePassword(
  db: Database,
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await repo.findById(db, userId);
  if (!user) throw invalidCredentials();

  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw httpError(422, 'Current password is incorrect.', 'validation_failed', {
      fields: { currentPassword: 'Current password is incorrect.' },
    });
  }

  await repo.updatePasswordHash(db, user.id, await hashPassword(input.newPassword));
  await repo.deleteSessionsForUser(db, user.id);
}
