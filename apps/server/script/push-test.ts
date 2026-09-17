/**
 * One push, by hand, through the code path a real notification takes.
 *
 * Push is the only channel whose last hop is a device we do not have while the
 * app does not exist. `ConsolePushSender` proves every decision up to the
 * transport but never builds the JSON Google sees, and the FCM adapter otherwise
 * runs only from a dispatcher that needs a committed row and a registered device.
 * This is the missing middle: it takes a token, builds the alert exactly as
 * `dispatch.ts` would for a device of the shape you describe, prints the body it
 * is about to POST, and sends it. Usage: `docs/code/push-notifications.md`.
 *
 * It constructs `FcmPushSender` directly rather than reading `pushSender`, so it
 * tests FCM whatever `PUSH_TRANSPORT` happens to be. It touches no table unless
 * `--register` says so, and nothing in the API routes to it, so production cannot
 * reach it.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';

import {
  DEVICE_PLATFORMS,
  isNotificationType,
  mayPush,
  NOTIFICATION_TYPES,
  type DevicePlatform,
  type NotificationData,
  type NotificationType,
} from '@mia/validators';

import { db } from '../src/infra/db/client.ts';
import { buildPayload, FcmPushSender } from '../src/infra/push/fcm.ts';
import type { PushAlert, PushMessage, PushResult } from '../src/infra/push/port.ts';
import { deviceLanguage } from '../src/modules/push/language.ts';
import { buildAlert, LOCALIZED_STRINGS_SINCE, tapRoute } from '../src/modules/push/message.ts';
import * as repo from '../src/modules/push/repo.ts';

const DEFAULT_TYPE = 'order.status_changed';

const USAGE = `mia push test — one message, by hand.

  pnpm --filter @mia/server run push:test -- --token=<fcm-token> [options]

  --token=<string>          the registration token to send to; without it a
                            throwaway one is used and nothing can be delivered
  --type=<event>            default ${DEFAULT_TYPE}
  --app-version=<string>    default 0.9.0 — below ${LOCALIZED_STRINGS_SINCE} the server renders the
                            sentence, at ${LOCALIZED_STRINGS_SINCE} and above it sends keys
  --language=<it|en|fr|de>  default it
  --platform=<android|ios>  default android
  --dry-run                 FCM validates the request and delivers nothing
  --register=<account-id>   put the token in push_devices for this customer
                            first, so the real dispatcher can reach it after this`;

/**
 * One payload per event, so `--type` can exercise any of them.
 *
 * The values obey the catalogue's own rule — ids, dates, counts and proper nouns,
 * never a translated word — because a word that reaches a phone through `data`
 * arrives in this file's language whatever the device asked for. That is why the
 * names below are Italian: they are data, and a real one would be too.
 *
 * `satisfies` rather than an annotation, so a new event fails `tsc` here until it
 * is given a sample to send.
 */
const SAMPLES = {
  'order.placed': {
    orderNumber: 'ORD-2026-0001',
    total: '1560.00',
    currency: 'EUR',
    customerName: 'Giulia Rossi',
  },
  'order.status_changed': {
    orderNumber: 'ORD-2026-0001',
    field: 'status',
    from: 'pending',
    to: 'paid',
  },
  'order.upcoming': { orderNumber: 'ORD-2026-0001', startsOn: '2026-07-14', daysUntil: 2 },
  'order.link_disputed': { orderNumber: 'ORD-2026-0001', disputeId: 'DSP-2026-0001' },
  'rental.ending_soon': {
    orderNumber: 'ORD-2026-0001',
    endsOn: '2026-07-20',
    daysLeft: 3,
    customerName: 'Giulia Rossi',
  },
  'rental.renewed': { orderNumber: 'ORD-2026-0001', from: '2026-07-20', to: '2026-08-20' },
  'contract.awaiting_signature': {
    contractNumber: 'CTR-2026-0001',
    orderNumber: 'ORD-2026-0001',
  },
  'contract.signed': {
    contractNumber: 'CTR-2026-0001',
    orderNumber: 'ORD-2026-0001',
    customerName: 'Giulia Rossi',
  },
  'contract.unsigned_blocking': {
    contractNumber: 'CTR-2026-0001',
    orderNumber: 'ORD-2026-0001',
    sentOn: '2026-07-10',
    hoursWaiting: 52,
  },
} satisfies Record<NotificationType, NotificationData>;

/**
 * What each answer from FCM is actually telling us.
 *
 * Keyed by the error code the API returns rather than by the sentence in
 * `reason`, because the sentence is Google's and can be reworded any release,
 * while these codes are the contract. A code that is not listed still prints its
 * verbatim message — a longer list here would only be a place to be wrong in.
 */
const CODE_MEANINGS: Record<string, string> = {
  UNAUTHENTICATED:
    'The service account was refused: a key from another project, a clock more than an hour ' +
    'out, or FCM_CLIENT_EMAIL not matching FCM_PRIVATE_KEY.',
  PERMISSION_DENIED:
    'The credentials are real but may not send. The service account needs the Firebase ' +
    'Messaging Admin role on the project.',
  SENDER_ID_MISMATCH:
    'The token belongs to a different Firebase project than FCM_PROJECT_ID — usually a log ' +
    'from one environment checked against another.',
  THIRD_PARTY_AUTH_ERROR:
    'Firebase took the message and APNs refused it. The iOS side needs the APNs key, team ' +
    'id and key id in the Firebase project.',
  INVALID_ARGUMENT:
    'Google refused the request itself: a malformed payload, or a token that was never ' +
    'valid. The message above says which.',
  UNREGISTERED:
    'The app was uninstalled or the OS retired the token. The only code here that is a fact ' +
    'about the device rather than about our code.',
  NOT_FOUND:
    'No such project, or the FCM API is not enabled on it. Check FCM_PROJECT_ID against ' +
    'the Firebase console.',
  QUOTA_EXCEEDED: 'A per-device rate limit or the project quota. Transient — wait and re-run.',
  UNAVAILABLE:
    'Google was unavailable. Transient: the sweep retries while the row is inside its 6 ' +
    'hour window.',
  INTERNAL: 'Google failed on its side. Transient, like UNAVAILABLE.',
};

function isPlatform(value: string): value is DevicePlatform {
  return (DEVICE_PLATFORMS as readonly string[]).includes(value);
}

/**
 * Shaped like a real token so the payload stays realistic, random so nobody
 * mistakes it for one that could deliver anything.
 */
function throwawayToken(): string {
  return `d${randomBytes(90).toString('base64url')}`;
}

function fail(message: string): never {
  console.error(`push:test — ${message}\n\n${USAGE}`);
  process.exit(1);
}

function heading(text: string): void {
  console.log(`\n${text}`);
}

function noReply(result: PushResult, dryRun: boolean): string[] {
  if (result.ok) {
    if (dryRun) {
      return [
        'Google accepts this payload: the field names, the structure and the project all check out.',
        'Nothing was delivered, and whether the token is a real device is not answered by this run.',
      ];
    }
    return [
      'Google accepted the message and took it from there.',
      'If no phone drew anything, the break is past here: an app that is not installed, an iOS',
      'project without the APNs key, a phone whose notifications are muted, or a token issued to a',
      'build of a different Firebase project.',
    ];
  }

  /* Credentials and minting fail before FCM is reached, so they have no code. */
  if (result.reason.startsWith('FCM_PROJECT_ID')) {
    return [
      'The process has no service account at all: .env is missing one of FCM_PROJECT_ID,',
      'FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY — or the file was not read. The boot line from `pnpm dev`',
      'reports the same thing as `push  fcm — <MISSING VARS> unset`.',
    ];
  }
  if (result.reason.startsWith('OAuth token mint failed')) {
    return [
      'The service account never reached the message endpoint. The usual cause is FCM_PRIVATE_KEY',
      'with its newlines lost: it must keep the \\n escapes from the JSON key file, on one line,',
      'in quotes. `openssl rsa -check` on the decoded key says whether it survives being read.',
    ];
  }

  const [code = ''] = result.reason.split(': ');
  const meaning = CODE_MEANINGS[code];
  if (meaning) return [meaning];
  return [
    'An answer this script has no mapped meaning for. It is above, verbatim, and the code is the',
    "part worth searching for: the sentence around it is Google's to reword.",
  ];
}

function alertLines(alert: PushAlert): string[] {
  if (alert.kind === 'rendered') {
    return [`  title  ${alert.title}`, `  body   ${alert.body}`];
  }
  return [
    `  title  ${alert.titleKey}`,
    `  body   ${alert.bodyKey}`,
    `  args   [${alert.bodyArgs.join(', ')}]`,
    "  (keys, not words: the phone renders these from the app's own bundle, so nothing",
    '   here can show you the sentence a customer will read)',
  ];
}

async function main(): Promise<number> {
  /* `pnpm run … -- --token x` forwards the `--` itself, which parseArgs would read
     as an argument terminator and reject everything after it — the same fix as
     `create-admin.ts`. */
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((argument) => argument !== '--'),
    options: {
      token: { type: 'string' },
      type: { type: 'string', default: DEFAULT_TYPE },
      'app-version': { type: 'string', default: '0.9.0' },
      language: { type: 'string', default: 'it' },
      platform: { type: 'string', default: 'android' },
      register: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(USAGE);
    return 0;
  }

  const type = values.type;
  if (!isNotificationType(type)) {
    fail(`--type must be one of ${NOTIFICATION_TYPES.join(', ')}; got '${type}'`);
  }
  const platform = values.platform;
  if (!isPlatform(platform)) {
    fail(`--platform must be one of ${DEVICE_PLATFORMS.join(', ')}; got '${platform}'`);
  }

  const appVersion = values['app-version'];
  const dryRun = values['dry-run'];
  const given = values.token;
  const token = given ?? throwawayToken();
  const sample = SAMPLES[type];
  const language = deviceLanguage(values.language, null);
  const alert = buildAlert({ type, data: sample, appVersion, language });
  const route = tapRoute(type, sample);

  /* The same keys `dispatch.ts` puts on every message, from a stand-in id: the app
     uses `notificationId` to open the row and `route` to know where it lands, so a
     message without them would test a payload nobody sends. */
  const data: Record<string, string> = {
    notificationId: randomUUID(),
    type,
    ...(route ? { route } : {}),
  };
  const message: PushMessage = { token, alert, data };
  const payload = buildPayload(message);

  heading(`mia push test — ${type} → ${platform}, app ${appVersion}, ${language}`);
  if (given === undefined) {
    console.log('  token     throwaway: nothing can be delivered to it');
  }
  console.log(`  transport ${dryRun ? 'FCM, validate_only (no delivery)' : 'FCM'}`);
  console.log(`  route     ${route ?? 'none'}`);
  console.log(alertLines(alert).join('\n'));

  if (!mayPush(type, null)) {
    console.log(
      `\n  ⚠ ${type} is not pushed by default: no real notification of this type reaches a\n` +
        '    device, so an answer below says nothing about the live path.',
    );
  }
  if (values.language !== language) {
    console.log(`\n  ⚠ '${values.language}' is not a language we speak; fell back to ${language}.`);
  }
  /* The two paths produce different payloads, and the difference is exactly where
     a field name goes wrong unseen — `${key}_title` and a raw key both look like
     strings in a log. Point at the other one rather than assume it was wanted. */
  if (alert.kind === 'rendered') {
    console.log(
      `\n  app ${appVersion} predates ${LOCALIZED_STRINGS_SINCE}, so this is the rendered fallback.\n` +
        '  Re-run with --app-version=1.0.0 for the localization-key payload a shipped app gets.',
    );
  }

  if (values.register !== undefined) {
    await repo.register(db, {
      customerAccountId: values.register,
      token,
      platform,
      language,
      appVersion,
    });
    heading('Registered');
    console.log(`  ${token.slice(0, 12)}…${token.slice(-6)} → customer ${values.register}`);
    console.log('  A notification committed for that account now reaches this token within a');
    console.log(
      '  minute, through the real dispatcher. Undo with DELETE /api/customer/push/devices.',
    );
  }

  heading('Body of the POST');
  console.log(JSON.stringify(payload, null, 2));
  if (dryRun) {
    console.log('\n  (`validate_only: true` is sent next to `message`, not shown above.)');
  }

  const result = await new FcmPushSender({ dryRun }).send(message);

  heading('FCM answered');
  if (result.ok) {
    console.log(`  ok${dryRun ? ', request validated' : ''}`);
  } else {
    console.log(`  ${result.reason}`);
    if (result.deadToken) {
      console.log('  (a dead-token code: the dispatcher deletes the device row on this answer)');
    }
  }

  heading('What that means');
  for (const line of noReply(result, dryRun)) console.log(`  ${line}`);

  return result.ok ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  },
);
