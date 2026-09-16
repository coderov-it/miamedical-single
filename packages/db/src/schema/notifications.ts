import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import type { NotificationData } from '@mia/validators/notification';

import { adminUsers } from './admin-users.ts';
import { customerAccounts } from './customers.ts';
import { orders } from './orders.ts';

/**
 * The in-app feed — one row per person told, for both audiences.
 *
 * Written inside the transaction that produced the fact it reports, so a rolled
 * back order transition cannot leave a notification claiming it happened. The
 * push that follows is `pg_notify` from the same transaction; Postgres queues it
 * until COMMIT and discards it on ROLLBACK, which is what makes the pairing
 * free. See docs/code/notifications-live.md.
 *
 * The row is the truth and the stream is a hint: nothing is ever reconstructed
 * from the sequence of SSE frames, so a dropped connection is a re-read rather
 * than a correctness problem.
 *
 * The subpath import is deliberate, matching `i18n.ts`: `@mia/validators/
 * notification` is a pure type module, so the schema package gains no
 * dependency on valibot by reading it.
 */

export const notificationAudience = pgEnum('notification_audience', ['customer', 'admin']);

/**
 * One table rather than two, because a customer notification and an admin one
 * differ in who they point at and in nothing else. Two tables would duplicate
 * the hub, the route shape, the sweep and the read-state column to express that
 * single difference.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid().primaryKey().defaultRandom(),
    audience: notificationAudience().notNull(),
    /** Set for `customer`, null for `admin` — `notifications_recipient_check`. */
    customerAccountId: uuid().references(() => customerAccounts.id, { onDelete: 'cascade' }),
    /** Set for `admin`, null for `customer` — same check. */
    adminUserId: uuid().references(() => adminUsers.id, { onDelete: 'cascade' }),
    /**
     * `'order.status_changed'`. Text, not an enum: the catalogue grows with
     * every flow that learns to speak, and an unknown type must render as its
     * humanised key rather than fail a read written by a newer process.
     */
    type: text().notNull(),
    /**
     * Ids, dates and counts — never a finished sentence and never a translated
     * string. The language is chosen when the row is rendered, from the reader's
     * own locale, which is what lets one row read in four languages and a copy
     * fix reach rows written last year.
     */
    data: jsonb().$type<NotificationData>().notNull(),
    /** What to open. Null for a notification that points at nothing yet. */
    orderId: uuid().references(() => orders.id, { onDelete: 'cascade' }),
    /**
     * Idempotency for the time-derived events. The sweep sets it; an
     * event-driven caller passes none, because a transaction that ran twice is
     * a different problem from a clock that ticked twice.
     */
    dedupeKey: text(),
    readAt: timestamp({ withTimezone: true }),
    /**
     * When this row was handed to FCM — the claim marker that makes the table its
     * own outbox.
     *
     * `LISTEN` has no backlog, so a notification raised while the dispatcher was
     * restarting is simply gone. The SSE feed survives that because the next
     * screen load re-reads the table; a closed app has no next screen load, so
     * without a marker the push would be lost outright. With one, the sweep picks
     * up anything still NULL.
     *
     * It is also what makes a second process safe: the claim is
     * `UPDATE … WHERE id = $1 AND pushed_at IS NULL RETURNING`, which returns a
     * row to exactly one caller. And it answers "was this customer actually
     * pinged" from SQL, which the mail side still cannot.
     *
     * NULL on a row nobody was ever going to push — see `mayPush`. The sweep
     * therefore filters on the audience and the type too, or it would re-examine
     * every operator row forever.
     */
    pushedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Named explicitly, and kept well under the 63-byte identifier limit.
    index('notifications_customer_feed_idx').on(t.customerAccountId, t.createdAt.desc()),
    index('notifications_admin_feed_idx').on(t.adminUserId, t.createdAt.desc()),
    /**
     * Partial, so the millions of event-driven rows carrying no key cost
     * nothing here and only the sweep's rows are policed. `ON CONFLICT DO
     * NOTHING` against this index is what makes a restart, an overlapping tick
     * and a second API worker all converge on one row.
     */
    uniqueIndex('notifications_dedupe_key')
      .on(t.dedupeKey)
      .where(sql`${t.dedupeKey} IS NOT NULL`),
    /**
     * The push backlog, and nothing else. Partial on both conditions because the
     * interesting set is tiny and permanently so — a row is pushed within
     * milliseconds of being written — while the table it lives in grows forever.
     * A full index here would be almost entirely dead entries for rows that were
     * pushed years ago.
     */
    index('notifications_push_pending_idx')
      .on(t.createdAt)
      .where(sql`${t.pushedAt} IS NULL AND ${t.audience} = 'customer'`),
    /**
     * Follows `orders_customer_link_check`: two columns that must agree are made
     * unable to disagree in the database rather than in a service.
     */
    check(
      'notifications_recipient_check',
      sql`(${t.audience} = 'customer' AND ${t.customerAccountId} IS NOT NULL AND ${t.adminUserId} IS NULL)
        OR (${t.audience} = 'admin' AND ${t.adminUserId} IS NOT NULL AND ${t.customerAccountId} IS NULL)`,
    ),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  customerAccount: one(customerAccounts, {
    fields: [notifications.customerAccountId],
    references: [customerAccounts.id],
  }),
  adminUser: one(adminUsers, {
    fields: [notifications.adminUserId],
    references: [adminUsers.id],
  }),
  order: one(orders, { fields: [notifications.orderId], references: [orders.id] }),
}));
