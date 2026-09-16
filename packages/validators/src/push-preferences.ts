/**
 * Who gets pushed what — the pure half, so `@mia/db` can type the jsonb column
 * from it without gaining a valibot dependency, exactly as `notification.ts`
 * does for the payload catalogue.
 *
 * Two independent gates, and keeping them separate is the whole design:
 *
 *   PUSH_BY_DEFAULT   is ours. Is this event worth a lock screen at all?
 *   NotificationPreferences  is the customer's. May this CATEGORY interrupt me?
 *
 * A notification is pushed only when both say yes. Collapsing them into one
 * stored flag per event would mean a customer's stored answer deciding something
 * they were never asked — and would freeze today's editorial judgement into every
 * row written before we changed our minds about it.
 */
import {
  NOTIFICATION_CATEGORIES,
  notificationCategory,
  type NotificationCategory,
  type NotificationType,
} from './notification.ts';

/**
 * Which events are worth interrupting somebody for, before the customer has said
 * anything. Almost nobody opens a preference screen, so this table is what the
 * feature actually does for most people.
 *
 * The `false` rows are not less important, they are events the customer caused
 * seconds earlier and is already looking at the result of. A push that says
 * "you signed the thing you just signed" teaches people to ignore the next one.
 *
 * `satisfies Record<NotificationType, boolean>` rather than an annotation: a new
 * event fails `tsc` here until somebody decides whether it may reach a phone.
 */
export const PUSH_BY_DEFAULT = {
  /* Operator-facing. There is no operator app, and these never address a
     customer account, so they can never be selected for push anyway — listed
     only because the exhaustive check demands an answer for every event. */
  'order.placed': false,
  'order.link_disputed': false,
  'contract.unsigned_blocking': false,

  /* We are blocked on the customer. This is the event that pays for the feature. */
  'contract.awaiting_signature': true,
  /* Shipped, paid, ready — the reason people open the app at all. */
  'order.status_changed': true,
  /* A deadline with money attached. */
  'rental.ending_soon': true,
  /* A delivery they need to be at home for. */
  'order.upcoming': true,

  /* Confirms something the customer did moments ago. */
  'contract.signed': false,
  'rental.renewed': false,
} as const satisfies Record<NotificationType, boolean>;

/** One category's switches. An object, not a bare boolean — see the note below. */
export interface NotificationChannelPreference {
  push: boolean;
}

/**
 * What `customer_accounts.notification_preferences` holds.
 *
 * ⚠️ DEVIATIONS ONLY. An absent category means "whatever the default says", so
 * `{}` is the correct value for every account that has never touched the screen
 * — which is all of them — and a category added later is live for everyone on
 * the day it ships, with no backfill and nobody silently missing it.
 *
 * The value is `{ push: false }` rather than `false` even though push is the only
 * channel today. Per-channel control is the shape this grows into the moment
 * somebody asks to mute email, and a stored bare boolean would have to be
 * reinterpreted — a migration over live rows — rather than extended.
 */
export type NotificationPreferences = Partial<
  Record<NotificationCategory, Partial<NotificationChannelPreference>>
>;

/** Every category answered, defaults applied. What the API returns and the UI renders. */
export type EffectiveNotificationPreferences = Record<
  NotificationCategory,
  NotificationChannelPreference
>;

/**
 * A category is on unless the customer turned it off.
 *
 * Opt-out rather than opt-in, because the OS permission prompt is the real
 * consent gate and it has already been answered by the time any of this is
 * reachable. Asking twice would mean a customer who granted permission still
 * hears nothing until they find a second screen.
 */
export function effectivePreferences(
  stored: NotificationPreferences | null | undefined,
): EffectiveNotificationPreferences {
  const effective = {} as EffectiveNotificationPreferences;
  for (const category of NOTIFICATION_CATEGORIES) {
    effective[category] = { push: stored?.[category]?.push !== false };
  }
  return effective;
}

/**
 * The one question the dispatcher asks: may this row light up a lock screen?
 *
 * An event whose type has no category — written by a newer process than this one
 * — is not pushed. The feed still records it, so nothing is lost; we simply do
 * not interrupt somebody over a row we cannot classify, and therefore cannot
 * honour a preference about.
 */
export function mayPush(type: string, stored: NotificationPreferences | null | undefined): boolean {
  if (!(type in PUSH_BY_DEFAULT)) return false;
  if (!PUSH_BY_DEFAULT[type as NotificationType]) return false;

  const category = notificationCategory(type);
  if (!category) return false;

  return stored?.[category]?.push !== false;
}
