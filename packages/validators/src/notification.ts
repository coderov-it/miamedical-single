/**
 * THE notification catalogue: every event the feed can carry, and the shape of
 * its payload.
 *
 * No valibot here on purpose, for two reasons. Nothing outside the server ever
 * *writes* a notification — payloads are built by the module that caused the
 * fact, never posted by a client — so there is no untrusted input to parse. And
 * keeping the file pure is what lets `@mia/db` type the jsonb column from it
 * without the schema package gaining a valibot dependency, exactly as
 * `language.ts` does for the language registry.
 *
 * ⚠️ A payload carries ids, dates, counts and proper nouns only — never a
 * translated string, never a product title. A sentence written into `data`
 * freezes that row into one language forever; the words live in `@mia/i18n` and
 * are chosen when the row is rendered. Anything localized is referenced by id.
 *
 * Adding an event is one entry here plus its two label entries in
 * `@mia/i18n`'s `NOTIFICATION_LABELS`, which fails `tsc` until both exist.
 */

/**
 * Who a notification is addressed to. The recipient column that must be set
 * follows from this, and `notifications_recipient_check` holds the pairing in
 * the database.
 */
export type NotificationAudience = 'customer' | 'admin';

/**
 * Event type → what its row carries.
 *
 * Several events reach both audiences with the same payload — `contract.signed`
 * tells the customer their copy is filed and tells the operator the order is
 * unblocked — so audience is a property of the row, not of the type.
 */
export interface NotificationPayloads {
  /** A storefront checkout completed. Operator-facing. */
  'order.placed': {
    orderNumber: string;
    /** As stored: `numeric(12,2)` comes back as a string, and must stay one. */
    total: string;
    currency: string;
    customerName: string;
  };
  /** An operator moved `status` or `paymentStatus`. Customer-facing. */
  'order.status_changed': {
    orderNumber: string;
    field: 'status' | 'paymentStatus';
    /** Enum members, never labels — the words are resolved at render. */
    from: string;
    to: string;
  };
  /** A booked rental starts within a couple of days. Customer-facing. */
  'order.upcoming': { orderNumber: string; startsOn: string; daysUntil: number };
  /** "I did not place this order" was filed against an order. Operator-facing. */
  'order.link_disputed': { orderNumber: string; disputeId: string };
  /** A rental reaches its end date at one of the reminder thresholds. Both. */
  'rental.ending_soon': {
    orderNumber: string;
    /** `YYYY-MM-DD`, a calendar day in Europe/Rome. */
    endsOn: string;
    daysLeft: number;
    customerName: string;
  };
  /** A rental's period was extended and a fresh contract went out. Customer-facing. */
  'rental.renewed': { orderNumber: string; from: string; to: string };
  /** A contract is waiting for the customer's signature. Customer-facing. */
  'contract.awaiting_signature': { contractNumber: string; orderNumber: string | null };
  /** The customer signed. Reaches both audiences. */
  'contract.signed': {
    contractNumber: string;
    orderNumber: string | null;
    customerName: string;
  };
  /**
   * A rental order has sat unsigned long enough that it is stalled rather than
   * merely waiting: the status machine refuses `pending → paid` until the
   * newest contract is signed. Operator-facing.
   */
  'contract.unsigned_blocking': {
    contractNumber: string;
    orderNumber: string;
    /** `YYYY-MM-DD` the contract went out. */
    sentOn: string;
    hoursWaiting: number;
  };
}

export type NotificationType = keyof NotificationPayloads;

/** The union a stored `data` column holds. */
export type NotificationData = NotificationPayloads[NotificationType];

/**
 * A row as a reader sees it: the discriminated pair, so narrowing on `type`
 * narrows `data` with it.
 */
export type NotificationBody = {
  [K in NotificationType]: { type: K; data: NotificationPayloads[K] };
}[NotificationType];

/** One feed entry over the wire. Dates are ISO strings, as everywhere else. */
export type NotificationView = NotificationBody & {
  id: string;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
};

/**
 * The feed's filter rail.
 *
 * Derived from the event's own name rather than declared as a second mapping:
 * `order.placed` belongs to orders *because of what it is called*, so a new
 * event joins a category by being named and the two can never drift apart. The
 * assertion below is what keeps that promise — name an event `payment.failed`
 * and this file stops compiling until `payment` is listed here.
 */
export const NOTIFICATION_CATEGORIES = ['order', 'rental', 'contract'] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

/** `'order.placed'` → `'order'`. */
type EventPrefix<T extends string> = T extends `${infer P}.${string}` ? P : never;

/** Fails to compile unless `T` is `never` — see the assertion under it. */
type AssertNoneLeft<T extends never> = T;

/**
 * Compile-time proof that every event has a category. Exported only so it is
 * not dead code: nothing reads it, and it is `never` whenever the list above is
 * complete.
 */
export type UnclassifiedNotificationPrefix = AssertNoneLeft<
  Exclude<EventPrefix<NotificationType>, NotificationCategory>
>;

export function isNotificationCategory(value: unknown): value is NotificationCategory {
  return (
    typeof value === 'string' && (NOTIFICATION_CATEGORIES as readonly string[]).includes(value)
  );
}

/** The category of a stored `type`, or null for one written by a newer process. */
export function notificationCategory(type: string): NotificationCategory | null {
  const prefix = type.split('.')[0] ?? '';
  return isNotificationCategory(prefix) ? prefix : null;
}

/** How many notifications sit in one category, and how many are still unread. */
export interface NotificationCategoryCount {
  total: number;
  unread: number;
}

/**
 * What a feed request answers with.
 *
 * `counts` is per category **and unfiltered** — the rail has to show what is
 * waiting under every tab, not only the one being looked at, or filtering would
 * hide the very badge that tells you to filter somewhere else.
 */
export interface NotificationFeed {
  data: NotificationView[];
  meta: {
    page: number;
    perPage: number;
    /** Rows matching the active filter. */
    total: number;
    /** Unread across every category, whatever the filter. This is the bell. */
    unread: number;
    counts: Record<NotificationCategory | 'all', NotificationCategoryCount>;
  };
}

export const NOTIFICATION_TYPES = [
  'order.placed',
  'order.status_changed',
  'order.upcoming',
  'order.link_disputed',
  'rental.ending_soon',
  'rental.renewed',
  'contract.awaiting_signature',
  'contract.signed',
  'contract.unsigned_blocking',
] as const satisfies readonly NotificationType[];

/** Runtime narrowing for a `type` read back out of the database. */
export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && (NOTIFICATION_TYPES as readonly string[]).includes(value);
}
