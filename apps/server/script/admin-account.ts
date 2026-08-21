/**
 * The one write path for a back-office account, shared by `create-admin.ts`
 * (interactive, flag-driven) and `seed-superadmin.ts` (non-interactive, env
 * driven). Both need the same hash, the same upsert and the same reactivation
 * of a disabled row, and two copies of that would drift.
 */
import { createDatabase, eq } from '@mia/db';
import { adminUsers } from '@mia/db/schema';

import { env } from '../src/config/env.ts';
import { hashPassword } from '../src/shared/auth/password.ts';

export const MIN_PASSWORD_LENGTH = 12;

export interface AdminAccountInput {
  email: string;
  password: string;
  /** Undefined leaves an existing name alone; null clears it on create. */
  fullName?: string | null | undefined;
  isSuperuser: boolean;
  /** Ignored when `isSuperuser` — a superuser passes every check anyway. */
  permissions: number[];
}

/**
 * Creates the account, or resets the password and access of the existing one.
 * Idempotent: running it twice leaves one row, active, with the given password.
 *
 * `emailVerifiedAt` is stamped on create because an operator provisioned from
 * the command line has no verification mail to click — the human running this
 * *is* the verification.
 */
export async function upsertAdminAccount(input: AdminAccountInput): Promise<'created' | 'updated'> {
  const db = createDatabase({ url: env.DATABASE_URL, logger: false });
  const passwordHash = await hashPassword(input.password);
  const permissions = input.isSuperuser ? [] : input.permissions;

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, input.email));

  if (existing) {
    await db
      .update(adminUsers)
      .set({
        passwordHash,
        isSuperuser: input.isSuperuser,
        permissions,
        isActive: true,
        ...(input.fullName ? { fullName: input.fullName } : {}),
      })
      .where(eq(adminUsers.id, existing.id));
    await db.$client.end();
    return 'updated';
  }

  await db.insert(adminUsers).values({
    email: input.email,
    fullName: input.fullName ?? null,
    passwordHash,
    isSuperuser: input.isSuperuser,
    permissions,
    emailVerifiedAt: new Date(),
  });
  await db.$client.end();
  return 'created';
}
