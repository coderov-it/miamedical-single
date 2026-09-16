/**
 * The wire shapes for push: what a device sends when it registers, and what the
 * preference screen writes back.
 *
 * The valibot half. Everything a schema-free consumer needs — the preference
 * type, the defaults, `mayPush` — lives in `push-preferences.ts`, which `@mia/db`
 * imports to type the jsonb column without taking on valibot.
 */
import * as v from 'valibot';

import { LANGUAGE_CODES, type LanguageCode } from './language.ts';
import { NOTIFICATION_CATEGORIES } from './notification.ts';

/**
 * The two platforms that can hold a token. No `web`: web push is a different
 * transport (VAPID and a service worker) rather than a third value here, and
 * listing it before it exists would let a device register for a delivery path
 * that silently drops every message.
 */
export const DEVICE_PLATFORMS = ['android', 'ios'] as const;

export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];

/**
 * FCM registration tokens are long, opaque and have no documented format, so the
 * bound is a sanity check against a body that is obviously not a token rather
 * than a validation of one. Real tokens sit around 160 characters today and the
 * length has changed before.
 */
const TokenSchema = v.pipe(v.string(), v.trim(), v.minLength(20), v.maxLength(512));

/**
 * Registration. Called on every launch and again whenever the OS reissues the
 * token, so it upserts rather than inserts — see `modules/push/repo.ts`.
 */
export const PushDeviceRegisterSchema = v.object({
  token: TokenSchema,
  platform: v.picklist(DEVICE_PLATFORMS),
  /**
   * The device's own locale. Only ever used for the server-rendered fallback:
   * when localization keys are in play the OS resolves the language itself and
   * this is not consulted. Narrowed to the registry, so a phone set to Japanese
   * is stored as nothing and falls through to the account's language.
   */
  language: v.optional(
    /* The registry is a readonly array and `picklist` wants a non-empty tuple.
       Cast the SHAPE, not the members, so the inferred output stays
       `LanguageCode` and a handler never has to widen it back. */
    v.picklist(LANGUAGE_CODES as unknown as [LanguageCode, ...LanguageCode[]]),
  ),
  /**
   * Which build is installed, so the dispatcher knows whether this device has the
   * string resources for a given key. Not telemetry: get it wrong and somebody
   * reads `order_status_changed_paid_body` on their lock screen.
   *
   * Free-form rather than a strict semver pattern — an app store build string is
   * whatever the app team ships — and compared by `compareVersions` in
   * `modules/push/message.ts`, which treats anything unparseable as "too old"
   * and therefore falls back to a rendered sentence.
   */
  appVersion: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(32)),
});

export type PushDeviceRegisterInput = v.InferOutput<typeof PushDeviceRegisterSchema>;

/**
 * Unregistration, called before sign-out clears the session.
 *
 * The token travels in the body rather than the path because a device token in a
 * URL ends up in nginx access logs, and a logged token is one somebody could send
 * a notification to.
 */
export const PushDeviceUnregisterSchema = v.object({ token: TokenSchema });

/**
 * A partial write: categories the body does not name are left alone, so the
 * screen can send one toggle rather than the whole object and two tabs cannot
 * clobber each other's unrelated changes.
 */
export const NotificationPreferencesSchema = v.object(
  Object.fromEntries(
    NOTIFICATION_CATEGORIES.map((category) => [
      category,
      v.optional(v.object({ push: v.boolean() })),
    ]),
  ) as Record<
    (typeof NOTIFICATION_CATEGORIES)[number],
    v.OptionalSchema<v.ObjectSchema<{ push: v.BooleanSchema<undefined> }, undefined>, undefined>
  >,
);

export type NotificationPreferencesInput = v.InferOutput<typeof NotificationPreferencesSchema>;

export * from './push-preferences.ts';
