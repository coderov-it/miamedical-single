import { styleText } from 'node:util';

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
 * `mediaReclaim` is whether the media sweep deletes unreferenced final objects
 * or only counts them — opt-in through `MEDIA_ORPHAN_SWEEP`, because deleting is
 * only safe on the deployment whose database owns the bucket.
 */
export const FEATURES = {
  mediaReclaim: env.MEDIA_ORPHAN_SWEEP === 'delete',
} as const;

/**
 * Printed once at startup, next to the listening line.
 *
 * The point is that a disabled feature is otherwise silent by design — a swallowed
 * order email is one log line among thousands. Stating the configuration at boot
 * means "why did no mail arrive" is answered by scrolling up, not by adding
 * logging.
 */
export function logFeatureSummary(): void {
  const rows: [string, State][] = [
    ['mail', mailState()],
    ['push', pushState()],
    ['object storage', objectStorageState()],
    ['translation', translationState()],
    ['media sweep', mediaSweepState()],
  ];

  for (const line of renderTable(rows)) console.log(line);
}

/**
 * `ok` is configured and live, `notice` is a deliberate stand-in (console mail, stub
 * translation), `error` is selected but unconfigured — every use of it will fail.
 */
type Tone = 'ok' | 'notice' | 'error';
type State = { tone: Tone; value: string; note?: string };

const TONE_COLOR = { ok: 'green', notice: 'yellow', error: 'red' } as const;

/*
  A two-column box with no header. Widths are measured on the plain text, before
  styling, because the escape codes `styleText` adds have length but no width.
  `styleText` drops colour when stdout is not a TTY or NO_COLOR is set, so a
  piped or pm2 log stays plain.
*/
function renderTable(rows: [string, State][]): string[] {
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  const stateWidth = Math.max(...rows.map(([, state]) => plainState(state).length));
  const border = (text: string) => styleText('gray', text);
  const rule = (left: string, middle: string, right: string) =>
    border(`  ${left}${'─'.repeat(labelWidth + 2)}${middle}${'─'.repeat(stateWidth + 2)}${right}`);

  const body = rows.map(([label, state]) => {
    const padding = ' '.repeat(stateWidth - plainState(state).length);
    const labelCell = styleText('bold', label.padEnd(labelWidth));
    return `  ${border('│')} ${labelCell} ${border('│')} ${styledState(state)}${padding} ${border('│')}`;
  });

  return [rule('┌', '┬', '┐'), ...body, rule('└', '┴', '┘')];
}

function plainState(state: State): string {
  if (!state.note) return `● ${state.value}`;
  return `● ${state.value} — ${state.note}`;
}

/* The dot and value carry the tone; the note is dimmed so the value reads first. */
function styledState(state: State): string {
  const color = TONE_COLOR[state.tone];
  const head = `${styleText(color, '●')} ${styleText(['bold', color], state.value)}`;
  if (!state.note) return head;
  return `${head}${styleText('dim', ` — ${state.note}`)}`;
}

/**
 * Push has no boot guard refusing production, unlike mail — a console transport
 * here costs a notification about a fact the feed already records, not a customer
 * locked out of their account. So this line is the only place an unfinished
 * Firebase setup announces itself, which makes naming the missing variable rather
 * than merely saying "disabled" the whole point of it.
 */
function pushState(): State {
  if (env.PUSH_TRANSPORT === 'console') {
    return { tone: 'notice', value: 'console', note: 'printed to this log, no device is notified' };
  }

  const missing = (
    [
      ['FCM_PROJECT_ID', env.FCM_PROJECT_ID],
      ['FCM_CLIENT_EMAIL', env.FCM_CLIENT_EMAIL],
      ['FCM_PRIVATE_KEY', env.FCM_PRIVATE_KEY],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    return {
      tone: 'error',
      value: 'fcm',
      note: `${missing.join(' and ')} unset, every send will fail`,
    };
  }

  return { tone: 'ok', value: 'fcm' };
}

function mailState(): State {
  if (env.MAIL_TRANSPORT === 'console') {
    return { tone: 'notice', value: 'console', note: 'printed to this log, nothing is sent' };
  }

  const missing = missingMailConfig();
  if (missing.length > 0) {
    return {
      tone: 'error',
      value: env.MAIL_TRANSPORT,
      note: `${missing.join(' and ')} unset, every send will fail`,
    };
  }

  return { tone: 'ok', value: env.MAIL_TRANSPORT };
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
function objectStorageState(): State {
  if (!env.R2_ACCOUNT_ID || !env.R2_BUCKET) {
    return { tone: 'error', value: 'unset', note: 'media uploads will fail' };
  }

  return { tone: 'ok', value: `R2 ${env.R2_BUCKET}` };
}

/**
 * Which engine will answer a translate request, or that nothing will. Worth a
 * line for the same reason mail gets one: "the translate button is missing" and
 * "the stub is filling the dev database with `[fr]`" are both answered here
 * rather than by reading the config file.
 */
function translationState(): State {
  if (env.TRANSLATION_PROVIDER === 'none') {
    return { tone: 'notice', value: 'off', note: 'operators fill each language by hand' };
  }
  if (env.TRANSLATION_PROVIDER === 'stub') {
    return { tone: 'notice', value: 'stub', note: 'placeholder text, development only' };
  }
  return { tone: 'ok', value: 'deepl' };
}

function mediaSweepState(): State {
  if (FEATURES.mediaReclaim) {
    return {
      tone: 'ok',
      value: 'delete',
      note: 'unreferenced photos and icons are removed hourly',
    };
  }
  return {
    tone: 'notice',
    value: 'report',
    note: 'unreferenced photos and icons are counted, never deleted',
  };
}
