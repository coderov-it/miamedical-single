/**
 * Creates or updates a back-office account.
 *
 *   pnpm --filter @mia/server admin:create -- --email you@example.com --role super_admin
 *
 * The password is read from `ADMIN_PASSWORD` or prompted for, never taken from
 * an argument — arguments end up in shell history and in `ps` output.
 *
 * This is the only way the first `super_admin` comes into existence: there is
 * deliberately no self-service registration for the admin panel.
 */
import { createDatabase, eq } from '@mia/db';
import { users } from '@mia/db/schema';
import { normalizePermissions } from '@mia/permissions';
import type { Interface } from 'node:readline';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';

import { env } from '../src/config/env.ts';
import { hashPassword } from '../src/shared/auth/password.ts';

const ROLES = ['staff', 'admin', 'super_admin'] as const;
type Role = (typeof ROLES)[number];

// `pnpm run … -- --email x` forwards the `--` itself, which parseArgs would
// treat as an argument terminator and reject everything after it.
const { values } = parseArgs({
  args: process.argv.slice(2).filter((argument) => argument !== '--'),
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', default: 'super_admin' },
    permissions: { type: 'string' },
  },
});

const email = values.email?.trim().toLowerCase();
if (!email) fail('Missing --email.');

const role = values.role as Role;
if (!ROLES.includes(role)) fail(`--role must be one of: ${ROLES.join(', ')}`);

/** A super admin passes every check, so storing codes against one is noise. */
const permissions =
  role === 'super_admin'
    ? []
    : normalizePermissions(
        (values.permissions ?? '').split(',').map(Number).filter(Number.isFinite),
      );

const password = process.env.ADMIN_PASSWORD ?? (await prompt('Password: '));
if (password.length < 12) fail('Password must be at least 12 characters.');

const db = createDatabase({ url: env.DATABASE_URL, logger: false });
const passwordHash = await hashPassword(password);

const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

if (existing) {
  await db
    .update(users)
    .set({
      passwordHash,
      role,
      permissions,
      isActive: true,
      ...(values.name ? { fullName: values.name } : {}),
    })
    .where(eq(users.id, existing.id));

  console.log(`Updated ${email} (${role}).`);
} else {
  await db.insert(users).values({
    email,
    fullName: values.name ?? null,
    passwordHash,
    role,
    permissions,
    emailVerifiedAt: new Date(),
  });

  console.log(`Created ${email} (${role}).`);
}

process.exit(0);

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

/**
 * Reads one line from stdin. On a terminal the typed characters are not echoed;
 * when stdin is a pipe (`echo … | pnpm admin:create`) the line is read as-is.
 */
function prompt(label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl: Interface & { _writeToOutput?: (chunk: string) => void } = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: process.stdin.isTTY === true,
    });

    if (process.stdin.isTTY) {
      // readline echoes each keystroke through this hook; emit the prompt only.
      rl._writeToOutput = (chunk) => {
        if (chunk.includes(label)) process.stdout.write(label);
      };
    }

    rl.question(label, (answer) => {
      rl.close();
      if (process.stdin.isTTY) process.stdout.write('\n');
      resolve(answer.trim());
    });

    rl.on('error', reject);
  });
}
