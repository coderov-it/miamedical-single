import { notificationKeys, notificationLabel } from '@mia/i18n';
import {
  notificationCategory,
  type LanguageCode,
  type NotificationCategory,
  type NotificationView,
} from '@mia/validators';

import { routes } from '~/lib/routes';

/**
 * A stored row becomes words here, and nowhere else.
 *
 * The row holds `type: 'order.placed'` and `{ orderNumber, total, currency }` —
 * never a sentence — so this is where the operator's interface language decides
 * what it says. Switching the topbar picker re-renders the whole feed, including
 * rows written months ago, because nothing about a row was ever in a language.
 */

export interface RenderedNotification {
  title: string;
  body: string;
  /** Where clicking the row goes, or null when there is nothing to open. */
  href: string | null;
  /** Null for a type written by a newer process than this bundle. */
  category: NotificationCategory | null;
  /** Tone for the row's category dot. One per category, stable across screens. */
  accent: string;
}

/**
 * Payload values, as interpolation parameters.
 *
 * Only strings and numbers pass. A payload should contain nothing else — see
 * the rule in `@mia/validators/notification` — and anything that slips through
 * would otherwise render as `[object Object]` inside a sentence.
 */
function toParams(data: Record<string, unknown>): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' || typeof value === 'number') params[key] = value;
  }
  return params;
}

/**
 * The most specific screen this notification is about.
 *
 * A dispute goes to the dispute queue rather than to the order it names: the
 * operator's next action is on the report, and the order is one click further.
 * Everything else with an order goes to that order — including the two contract
 * events, because the order detail is where a contract's state is read in
 * context.
 */
function hrefFor(row: NotificationView): string | null {
  if (row.type === 'order.link_disputed') return routes.orderDisputes;
  return row.orderId ? routes.orderDetail(row.orderId) : null;
}

/**
 * One colour per category, so the same kind of notice looks the same in the
 * dropdown and in the inbox. Muted for an unknown type rather than absent — a
 * missing dot would misalign the row against its neighbours.
 */
const ACCENT: Record<NotificationCategory, string> = {
  order: 'bg-sky-500',
  rental: 'bg-amber-500',
  contract: 'bg-violet-500',
};

export function renderNotification(
  row: NotificationView,
  locale: LanguageCode,
): RenderedNotification {
  const keys = notificationKeys(row.type, 'admin');
  const params = toParams(row.data as unknown as Record<string, unknown>);
  const category = notificationCategory(row.type);

  return {
    title: notificationLabel(keys.title, locale, params),
    body: notificationLabel(keys.body, locale, params),
    href: hrefFor(row),
    category,
    accent: category ? ACCENT[category] : 'bg-muted-foreground/40',
  };
}
