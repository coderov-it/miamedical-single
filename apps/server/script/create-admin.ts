/**
 * Creates or updates a back-office account.
 *
 *   pnpm --filter @mia/server admin:create -- --email you@example.com --superuser
 *   pnpm --filter @mia/server admin:create -- --email staff@example.com --permissions 1100,1101,1200
 *
 * The password is read from `ADMIN_PASSWORD` or prompted for, never taken from
 * an argument — arguments end up in shell history and in `ps` output.
 *
 * This is the only way the first superuser comes into existence: there is
 * deliberately no self-service registration for the admin panel.
 *
 * Access is attribute-based — a list of permission codes, plus `--superuser`
 * meaning "every code". There are no roles; see `@mia/permissions`.
 */
import { normalizePermissions } from '@mia/permissions';
import type { Interface } from 'node:readline';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';

import { MIN_PASSWORD_LENGTH, upsertAdminAccount } from './admin-account.ts';

// `pnpm run … -- --email x` forwards the `--` itself, which parseArgs would
// treat as an argument terminator and reject everything after it.
const { values } = parseArgs({
  args: process.argv.slice(2).filter((argument) => argument !== '--'),
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    superuser: { type: 'boolean', default: false },
    permissions: { type: 'string' },
  },
});

const email = values.email?.trim().toLowerCase();
if (!email) fail('Missing --email.');

const isSuperuser = values.superuser === true;

/** A superuser passes every check, so storing codes against one is noise. */
const permissions = isSuperuser
  ? []
  : normalizePermissions((values.permissions ?? '').split(',').map(Number).filter(Number.isFinite));

// An account with neither is real but can reach nothing, which is almost always
// a forgotten flag rather than an intention.
if (!isSuperuser && permissions.length === 0) {
  fail('Give --superuser or --permissions; an account with neither can open nothing.');
}

const password = process.env.ADMIN_PASSWORD ?? (await prompt('Password: '));
if (password.length < MIN_PASSWORD_LENGTH) {
  fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
}

const outcome = await upsertAdminAccount({
  email,
  password,
  ...(values.name ? { fullName: values.name } : {}),
  isSuperuser,
  permissions,
});

const access = isSuperuser ? 'superuser' : `${permissions.length} permissions`;
console.log(`${outcome === 'created' ? 'Created' : 'Updated'} ${email} (${access}).`);

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
