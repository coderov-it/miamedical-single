import { notificationKeys, notificationLabel, PUSH_ARG_ORDER, pushStringKey } from '@mia/i18n';
import type { NotificationData, NotificationType } from '@mia/validators';
import type { LanguageCode } from '@mia/validators/language';

import type { PushAlert } from '../../infra/push/port.ts';

/**
 * Turning one notification row into the alert a phone will draw.
 *
 * Two shapes, chosen per DEVICE rather than per message, which is the only
 * interesting decision in this file — see `LOCALIZED_STRINGS_SINCE`.
 */

/**
 * The first app version that ships the generated string resources.
 *
 * ⚠️ BUMP THIS whenever a new key is added to the generated files, in the same
 * commit, and set it to the app version that will carry them. A key the installed
 * build has never heard of renders as the raw key on iOS — a customer reading
 * `order_status_changed_paid_body` on their lock screen — and that is the one
 * failure mode of the whole localization approach.
 *
 * It is a constant rather than an environment variable on purpose. What it
 * describes is a property of the string files this repository generates, not of
 * a deployment, so it belongs in the commit that changes them and not in a .env
 * somebody has to remember.
 */
export const LOCALIZED_STRINGS_SINCE = '1.0.0';

/**
 * `'1.10.0'` vs `'1.9.0'` → newer, which a string comparison gets wrong.
 *
 * Anything unparseable — a build name, an empty string, a hash — is treated as
 * OLDER, so the fallback is what an unrecognised client gets. That direction
 * matters: guessing "new" on a version we cannot read would send keys to a build
 * that may not have them, which is the failure this whole mechanism exists to
 * avoid. A rendered sentence to a modern app is merely a missed optimisation.
 */
export function atLeastVersion(actual: string, minimum: string): boolean {
  /* Every segment must be digits and nothing else. `Number.parseInt` is the
     trap here: it stops at the first non-digit, so `'1.0.0-rc1'` would parse as
     `[1, 0, 0]` and a release candidate would be treated as the release it is a
     candidate for — sent keys the build may not carry. */
  const parse = (value: string) => {
    const parts = value.split('.');
    if (!parts.every((part) => /^\d+$/.test(part))) return null;
    return parts.map((part) => Number.parseInt(part, 10));
  };

  const left = parse(actual);
  const right = parse(minimum);
  if (!left || !right) return false;

  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const a = left[i] ?? 0;
    const b = right[i] ?? 0;
    if (a !== b) return a > b;
  }
  return true;
}

/**
 * The values spliced into a localized string, in the order its placeholders
 * expect.
 *
 * ⚠️ POSITIONAL AND NEVER TRANSLATED. The OS formatter prints these verbatim, so
 * an argument may only ever be an order number, a contract number, a count or a
 * proper noun. A status code or a formatted date passed through here would appear
 * in whatever language the server happened to be thinking in, inside a sentence
 * the phone rendered in another — which is precisely the bug the per-status keys
 * in `@mia/i18n`'s `pushStringKey` exist to prevent.
 *
 * The order is READ FROM `PUSH_ARG_ORDER` rather than restated here, because it
 * is the same contract the generated `%1$s` / `%1$@` placeholders are built
 * from. Two lists would be one rename away from putting a contract number where
 * a sentence expects an order number, in a string nothing type-checks.
 */
export function localizedArgs(type: NotificationType, data: NotificationData): string[] {
  const order = PUSH_ARG_ORDER[type as keyof typeof PUSH_ARG_ORDER] as
    readonly string[] | undefined;
  if (!order) return [];

  const payload = data as Record<string, unknown>;
  return order.map((field) => String(payload[field] ?? ''));
}

export interface AlertInput {
  type: NotificationType;
  data: NotificationData;
  /** The installed build, from `push_devices.app_version`. */
  appVersion: string;
  /** Only consulted for the rendered fallback. */
  language: LanguageCode;
}

export function buildAlert(input: AlertInput): PushAlert {
  const keys = pushStringKey(input.type, input.data);

  if (keys && atLeastVersion(input.appVersion, LOCALIZED_STRINGS_SINCE)) {
    return {
      kind: 'localized',
      titleKey: `${keys}_title`,
      bodyKey: `${keys}_body`,
      bodyArgs: localizedArgs(input.type, input.data),
    };
  }

  /* The fallback. Renders through exactly the same catalogue the feed uses, so
     the two surfaces cannot say different things about one row. */
  const label = notificationKeys(input.type, 'customer');
  const params = input.data as unknown as Record<string, string | number>;

  return {
    kind: 'rendered',
    title: notificationLabel(label.title, input.language, params),
    body: notificationLabel(label.body, input.language, params),
  };
}

/**
 * Where a tap should land, as a path rather than a screen name.
 *
 * A path means adding an event type later changes nothing in the app: it follows
 * whatever it is given. A screen name would be a second vocabulary to keep in
 * step across two repositories, and the one that drifts is always the one nobody
 * can deploy quickly.
 *
 * `contract.awaiting_signature` deliberately does NOT point at the signing page.
 * That page needs a one-time token which lives nowhere in this row — correctly,
 * because a stored notification is not where a signing secret belongs — so the
 * tap lands on the order and the app mints the link from
 * `/api/customer/contracts/{number}/signing-link`.
 */
export function tapRoute(type: NotificationType, data: NotificationData): string | null {
  const payload = data as Record<string, unknown>;
  const orderNumber = payload.orderNumber;

  if (typeof orderNumber === 'string' && orderNumber !== '') {
    return `/area-clienti/ordini/${encodeURIComponent(orderNumber)}/`;
  }
  return '/area-clienti/notifiche/';
}
