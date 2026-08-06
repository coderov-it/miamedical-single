import type { Algorithm, Options } from '@node-rs/argon2';
import { hash, verify } from '@node-rs/argon2';

/**
 * Password hashing with Argon2id, via `@node-rs/argon2` (prebuilt NAPI binary —
 * nothing to compile at install time).
 *
 * Parameters follow the OWASP baseline: 19 MiB of memory, two passes, one
 * thread. Memory hardness is the point — it is what makes GPU and ASIC attacks
 * expensive in a way that iteration count alone cannot.
 *
 * Hashes are stored in PHC string format, which carries the algorithm, version
 * and parameters inside the value:
 *
 *   $argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>
 *
 * That is what makes the cost tunable: raising `PARAMS` invalidates nothing —
 * old hashes still verify with their own recorded parameters, and `needsRehash`
 * tells the login flow to upgrade them silently on the next successful sign-in.
 */

/**
 * `Algorithm.Argon2id`. The library declares an ambient `const enum`, which
 * `verbatimModuleSyntax` forbids importing as a value — the numeric member is
 * part of the PHC format and cannot change, and `needsRehash` asserts the
 * `$argon2id$` prefix, so a wrong value here could not go unnoticed.
 */
const ARGON2ID = 2 as Algorithm;

const PARAMS: Options = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

/** Matches a hash produced with exactly the parameters above. */
const CURRENT_PREFIX = `$argon2id$v=19$m=${PARAMS.memoryCost},t=${PARAMS.timeCost},p=${PARAMS.parallelism}$`;

export async function hashPassword(password: string): Promise<string> {
  return hash(password.normalize('NFKC'), PARAMS);
}

/**
 * Constant-time verification. Returns false for every malformed, unsupported or
 * missing hash rather than throwing — a corrupt row must not become a 500.
 */
export async function verifyPassword(password: string, encoded: string | null): Promise<boolean> {
  if (!encoded) return false;

  try {
    return await verify(encoded, password.normalize('NFKC'));
  } catch {
    return false;
  }
}

/** True when a stored hash predates the current cost parameters. */
export function needsRehash(encoded: string | null): boolean {
  if (!encoded) return false;
  return !encoded.startsWith(CURRENT_PREFIX);
}

/**
 * Burns the same work as a real verification. Called when the email is unknown,
 * so response timing does not reveal which accounts exist.
 */
export async function fakeVerify(password: string): Promise<void> {
  await hash(password.normalize('NFKC'), PARAMS);
}
