import type { Database } from '@mia/db';
import type { ChangePasswordInput, LoginInput, UpdateProfileInput } from '@mia/validators';

import {
  fakeVerify,
  hashPassword,
  needsRehash,
  verifyPassword,
} from '../../shared/auth/password.ts';
import { SESSION_TTL_MS, createSessionToken, hashToken } from '../../shared/auth/session.ts';
import { conflict, forbidden, httpError, notFound } from '../../shared/http/errors.ts';
import * as repo from './repo.ts';
import type { AdminUserRow, IssuedSession, SessionMeta } from './types.ts';

/**
 * Back-office authentication policy.
 *
 * There is no role check here any more, and none is needed: `admin_users` holds
 * only back-office accounts, so being a row in it IS the eligibility. Customers
 * are a different table, a different module (`modules/customer-auth`) and a
 * different cookie, with no path from one to the other.
 */

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
  if (!passwordOk || !user.isActive) {
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
    adminUserId: user.id,
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
 *
 * A superuser is not asked for the current one. That is a deliberate trade, not
 * an oversight: the flag already lets its holder set any *other* operator's
 * password with no proof about that account at all, so demanding the old one on
 * their own row guards against nothing they could not route around in two
 * clicks — and it does block the case the check is supposed to serve, an
 * administrator rotating a password they no longer remember. Everyone else
 * proves ownership, because for them the admin route is closed.
 */
export async function changePassword(
  db: Database,
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await repo.findById(db, userId);
  if (!user) throw invalidCredentials();

  if (!user.isSuperuser) {
    await assertCurrentPassword(user, input.currentPassword);
  }

  await repo.updatePasswordHash(db, user.id, await hashPassword(input.newPassword));
  await repo.deleteSessionsForUser(db, user.id);
}

/**
 * Your own details, editable with no permission at all — an operator holding
 * nothing must still be able to correct their own name.
 *
 * Email is the exception and stays administrative: it is the identity you sign
 * in with, so only a superuser may change their own. Submitting the address you
 * already have is not a change and is always allowed, which is what lets the
 * form post the whole object every time.
 */
export async function updateProfile(
  db: Database,
  userId: string,
  input: UpdateProfileInput,
): Promise<AdminUserRow> {
  const user = await repo.findById(db, userId);
  if (!user) throw notFound('Account');

  const newEmail = input.email !== undefined && input.email !== user.email ? input.email : null;
  if (newEmail !== null) {
    if (!user.isSuperuser) {
      throw forbidden('Only a superuser can change their own email address.');
    }
    const existing = await repo.findByEmail(db, newEmail);
    if (existing && existing.id !== user.id) {
      throw conflict(`An account with the email "${newEmail}" already exists.`);
    }
  }

  await repo.updateProfile(db, user.id, {
    ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(newEmail !== null ? { email: newEmail } : {}),
  });

  const updated = await repo.findById(db, user.id);
  if (!updated) throw notFound('Account');
  return updated;
}

/** Your own account, for the profile screen. */
export async function getProfile(db: Database, userId: string): Promise<AdminUserRow> {
  const user = await repo.findById(db, userId);
  if (!user) throw notFound('Account');
  return user;
}

/**
 * 422 on the field that carries it, whether it was missing or wrong. Absent and
 * incorrect are told apart because "you left it blank" and "that is not your
 * password" are different fixes for the operator.
 */
async function assertCurrentPassword(
  user: AdminUserRow,
  currentPassword: string | undefined,
): Promise<void> {
  if (!currentPassword) {
    throw httpError(422, 'Enter your current password.', 'validation_failed', {
      fields: { currentPassword: 'Enter your current password.' },
    });
  }
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw httpError(422, 'Current password is incorrect.', 'validation_failed', {
      fields: { currentPassword: 'Current password is incorrect.' },
    });
  }
}
