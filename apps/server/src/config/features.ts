import { env } from './env.ts';

/**
 * Which optional features this process starts with, decided ONCE at boot.
 *
 * WHY BOOT AND NOT PER REQUEST: a capability re-read on every request is a
 * capability that can differ between two requests a second apart, with nothing in
 * the log to say when it changed or why. Resolving here makes "is autocomplete on"
 * a property of the process — printable at startup, true for its whole lifetime,
 * and answerable without reproducing a request.
 *
 * RESOLVED, NOT FLAGGED: where a feature needs a credential, the credential is
 * captured with it — either `null` or an object holding the key, so there is no
 * reachable state where a feature is on and its credential is missing. The type
 * says so, rather than a comment asking callers to check first.
 *
 * This is not the same as failing at boot. A missing optional credential disables
 * one feature and leaves the rest of the API serving. What production must not
 * start without is guarded in `env.ts`, which does refuse.
 *
 * EMPTY, DELIBERATELY. The one entry here was `addressSuggestions`, holding a HERE
 * key for the checkout's street autocomplete; the checkout now takes the delivery
 * address as one free-text block and completes nothing, so the feature, its key and
 * its endpoint are gone. This stays as the place the next optional feature is
 * resolved — see the RULES section of AGENTS.md.
 */
export const FEATURES = {} as const;

/**
 * Printed once at startup, next to the listening line.
 *
 * The point is that a disabled feature is otherwise silent by design — a swallowed
 * order email is one log line among thousands. Stating the configuration at boot
 * means "why did no mail arrive" is answered by scrolling up, not by adding
 * logging.
 */
export function logFeatureSummary(): void {
  const rows: [string, string][] = [
    ['mail', mailState()],
    ['object storage', objectStorageState()],
  ];

  const width = Math.max(...rows.map(([label]) => label.length));
  for (const [label, state] of rows) {
    console.log(`  ${label.padEnd(width)}  ${state}`);
  }
}

function mailState(): string {
  if (env.MAIL_TRANSPORT === 'console') {
    return 'console — printed to this log, nothing is sent';
  }

  const missing = missingMailConfig();
  if (missing.length > 0) {
    return `${env.MAIL_TRANSPORT} — ${missing.join(' and ')} unset, every send will fail`;
  }

  return env.MAIL_TRANSPORT;
}

/**
 * What the selected transport still needs. Worth naming at boot rather than leaving
 * to the first send: order mail is swallowed by `sendQuietly`, so an unconfigured
 * provider looks exactly like a quiet afternoon.
 */
function missingMailConfig(): string[] {
  const missing: string[] = [];

  if (!env.MAIL_FROM_ADDRESS) missing.push('MAIL_FROM_ADDRESS');

  if (env.MAIL_TRANSPORT === 'plunk' && !env.PLUNK_API_KEY) {
    missing.push('PLUNK_API_KEY');
  }
  if (env.MAIL_TRANSPORT === 'cloudflare') {
    if (!env.CLOUDFLARE_ACCOUNT_ID) missing.push('CLOUDFLARE_ACCOUNT_ID');
    if (!env.CLOUDFLARE_EMAIL_API_TOKEN) missing.push('CLOUDFLARE_EMAIL_API_TOKEN');
  }
  if (env.MAIL_TRANSPORT === 'ses' && !env.AWS_SES_REGION) {
    missing.push('AWS_SES_REGION');
  }

  return missing;
}

/*
  Reported rather than resolved: R2 still constructs on first use and throws then, so
  this line reads the environment and is not a wired capability like the one above.
  Making it one means the media routes consulting FEATURES instead of discovering the
  problem mid-upload — a change to that module, not to this file.
*/
function objectStorageState(): string {
  if (!env.R2_ACCOUNT_ID || !env.R2_BUCKET) {
    return 'unset — media uploads will fail';
  }

  return `R2 ${env.R2_BUCKET}`;
}
