/**
 * Seeds the superadmin, and nothing else, entirely from the environment:
 *
 *   pnpm admin:seed
 *
 * Reads `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` and optional
 * `SUPERADMIN_NAME`. Nothing is prompted for and nothing comes from an
 * argument, so this runs unattended — a fresh database, a rebuilt dev box, a
 * provisioning step — where `admin:create` cannot.
 *
 * Idempotent: a second run resets that account's password and re-enables it.
 * Existing accounts other than this one are untouched; this seeds one operator,
 * it does not reconcile the table.
 *
 * The three variables are read straight from `process.env`, not through
 * `config/env.ts`, for the same reason the WordPress migration's are: the
 * running server never touches them, so a missing value must not be able to
 * stop the API from booting.
 */
import { MIN_PASSWORD_LENGTH, upsertAdminAccount } from './admin-account.ts';

const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPERADMIN_PASSWORD ?? '';
const fullName = process.env.SUPERADMIN_NAME?.trim();

if (!email) fail('SUPERADMIN_EMAIL is not set.');
if (!email.includes('@')) fail(`SUPERADMIN_EMAIL is not an address: "${email}".`);
if (password.length < MIN_PASSWORD_LENGTH) {
  fail(
    password.length === 0
      ? 'SUPERADMIN_PASSWORD is not set.'
      : `SUPERADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  );
}

const outcome = await upsertAdminAccount({
  email,
  password,
  ...(fullName ? { fullName } : {}),
  isSuperuser: true,
  permissions: [],
});

console.log(`${outcome === 'created' ? 'Created' : 'Updated'} superadmin ${email}.`);
process.exit(0);

function fail(message: string): never {
  console.error(`${message}\nSet it in .env — see .env.example.`);
  process.exit(1);
}
