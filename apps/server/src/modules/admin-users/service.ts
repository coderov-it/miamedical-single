import type { Database } from '@mia/db';
import { P, can, isPermissionCode, normalizePermissions, permissionByCode } from '@mia/permissions';
import type {
  CreateAdminUserInput,
  SetAdminPasswordInput,
  SetAdminPermissionsInput,
  UpdateAdminUserInput,
} from '@mia/validators';

import { hashPassword } from '../../shared/auth/password.ts';
import { conflict, forbidden, httpError, notFound } from '../../shared/http/errors.ts';
import * as repo from './repo.ts';
import type { Actor, AdminUserListFilters, AdminUserRow } from './types.ts';

/**
 * Policy for administering back-office accounts.
 *
 * Four invariants, and every rule below is one of them:
 *
 * 1. **Nobody edits their own access.** Permissions, activation and deletion of
 *    the caller's own row are all refused. A guard that stops at "do you hold
 *    admin:permission_assign" would let the holder grant themselves everything
 *    else, and would also let them lock themselves out — so the answer to both
 *    is that this screen is for other people's accounts. The caller changes
 *    their own password through `POST /api/auth/password`, which asks for the
 *    current one.
 * 2. **You cannot grant what you do not hold**, and granting anything at all
 *    needs `admin:permission_assign`. Otherwise that permission is quietly
 *    equivalent to superuser, one hop away — and `admin:create` on its own
 *    would be a way around it. `admin:create` alone still creates a working
 *    account; it just arrives holding nothing until someone grants it something.
 * 3. **Only a superuser can create a superuser.** Same reason, for the attribute
 *    that has no code.
 * 4. **The last superuser stays.** Demoting, disabling or deleting the only one
 *    leaves a system where nobody can grant access again, and no amount of SQL
 *    knowledge is a substitute for that being impossible from the UI.
 */

export async function list(db: Database, filters: AdminUserListFilters) {
  return repo.list(db, filters);
}

export async function get(db: Database, id: string): Promise<AdminUserRow> {
  const row = await repo.findById(db, id);
  if (!row) throw notFound('Admin user');
  return row;
}

export async function create(
  db: Database,
  actor: Actor,
  input: CreateAdminUserInput,
): Promise<AdminUserRow> {
  await assertEmailFree(db, input.email, null);

  const permissions = resolvePermissions(input.permissions);
  assertMayGrant(actor, input.isSuperuser, permissions);

  return repo.create(db, {
    email: input.email,
    fullName: input.fullName,
    phone: input.phone ?? null,
    passwordHash: await hashPassword(input.password),
    isSuperuser: input.isSuperuser,
    permissions,
  });
}

export async function updateProfile(
  db: Database,
  actor: Actor,
  id: string,
  input: UpdateAdminUserInput,
): Promise<AdminUserRow> {
  const target = await get(db, id);

  if (input.email !== undefined && input.email !== target.email) {
    await assertEmailFree(db, input.email, id);
  }

  const disabling = input.isActive === false && target.isActive;
  if (disabling) {
    assertNotSelf(actor, id, 'disable your own account');
    await assertNotLastSuperuser(db, target, 'Disabling');
  }

  await repo.update(db, id, {
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  });

  // `withSession` already rejects an inactive account on its next request; this
  // makes the session rows agree with that instead of lingering until expiry.
  if (disabling) await repo.deleteSessions(db, id);

  return get(db, id);
}

/**
 * Sets access to exactly what was submitted. The codes are stored even when the
 * superuser flag is on — the flag makes them inert, not wrong, and keeping them
 * means clearing the flag later reveals a considered set rather than an empty
 * one. (`script/create-admin.ts` stores `[]` for a superuser because a CLI
 * invocation has no set to preserve.)
 */
export async function setPermissions(
  db: Database,
  actor: Actor,
  id: string,
  input: SetAdminPermissionsInput,
): Promise<AdminUserRow> {
  const target = await get(db, id);
  assertNotSelf(actor, id, 'change your own permissions');

  const permissions = resolvePermissions(input.permissions);
  assertMayGrant(actor, input.isSuperuser, permissions);

  if (target.isSuperuser && !input.isSuperuser) {
    await assertNotLastSuperuser(db, target, 'Removing superuser from');
  }

  await repo.setPermissions(db, id, { isSuperuser: input.isSuperuser, permissions });
  return get(db, id);
}

/**
 * Sets someone else's password and signs them out everywhere. The sign-out is
 * the point: a password is reset because the old one is suspect, and leaving
 * live sessions on the account resets nothing.
 */
export async function setPassword(
  db: Database,
  actor: Actor,
  id: string,
  input: SetAdminPasswordInput,
): Promise<void> {
  await get(db, id);
  assertNotSelf(actor, id, 'change your own password here');

  await repo.setPasswordHash(db, id, await hashPassword(input.password));
  await repo.deleteSessions(db, id);
}

export async function remove(db: Database, actor: Actor, id: string): Promise<void> {
  const target = await get(db, id);
  assertNotSelf(actor, id, 'delete your own account');
  await assertNotLastSuperuser(db, target, 'Deleting');

  await repo.remove(db, id);
}

// --- policy helpers --------------------------------------------------------

function assertNotSelf(actor: Actor, id: string, what: string): void {
  if (actor.id === id) throw forbidden(`You cannot ${what}.`);
}

/**
 * Unknown codes are rejected rather than dropped. `normalizePermissions` drops
 * them when reading an old row, which is right — but a client sending one is
 * either out of date or wrong, and a silent drop turns that into a grant the
 * operator thinks they made.
 */
function resolvePermissions(codes: readonly number[]): number[] {
  const unknown = codes.filter((code) => !isPermissionCode(code));
  if (unknown.length > 0) {
    throw httpError(422, `Unknown permission codes: ${unknown.join(', ')}.`, 'validation_failed', {
      fields: { permissions: 'This list contains permissions that no longer exist.' },
    });
  }
  return normalizePermissions(codes);
}

function assertMayGrant(actor: Actor, isSuperuser: boolean, permissions: number[]): void {
  if (!isSuperuser && permissions.length === 0) return;

  // The route guard on `PUT /:id/permissions` already asked this; `POST /` did
  // not, because creating an account that holds nothing is a legitimate use of
  // `admin:create` on its own.
  if (!can(actor, P.ADMIN_PERMISSION_ASSIGN)) {
    throw forbidden('Requires permission: admin:permission_assign.');
  }
  if (isSuperuser && !actor.isSuperuser) {
    throw forbidden('Only a superuser can grant superuser access.');
  }
  if (actor.isSuperuser) return;

  const beyond = permissions.filter((code) => !can(actor, code));
  if (beyond.length > 0) {
    const keys = beyond.map((code) => permissionByCode(code)?.key ?? String(code));
    throw forbidden(`You cannot grant a permission you do not hold: ${keys.join(', ')}.`);
  }
}

async function assertNotLastSuperuser(
  db: Database,
  target: AdminUserRow,
  action: string,
): Promise<void> {
  if (!target.isSuperuser || !target.isActive) return;
  if ((await repo.countOtherActiveSuperusers(db, target.id)) > 0) return;

  throw conflict(
    `${action} the last active superuser would leave nobody able to grant access. Promote another account first.`,
  );
}

async function assertEmailFree(
  db: Database,
  email: string,
  exceptId: string | null,
): Promise<void> {
  const existing = await repo.findByEmail(db, email);
  if (existing && existing.id !== exceptId) {
    throw conflict(`An account with the email "${email}" already exists.`);
  }
}
