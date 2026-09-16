import { relations } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { customerAccounts } from './customers.ts';
import { languageCode } from './i18n.ts';

/**
 * A phone we are allowed to interrupt.
 *
 * One row per installed app per account. The OS issues the token, reissues it
 * whenever it likes — reinstall, restore, its own schedule — and the app posts
 * whatever it currently holds on every launch, so writes are upserts and a row's
 * age means nothing.
 *
 * Why this table needs a session at all, and what it means for guest orders, is
 * in docs/code/push-notifications.md.
 */
export const devicePlatform = pgEnum('device_platform', ['android', 'ios']);

export const pushDevices = pgTable(
  'push_devices',
  {
    id: uuid().primaryKey().defaultRandom(),
    /**
     * Who this phone belongs to. NOT NULL and cascading: a device with no account
     * is a device nothing could ever address, and an erased account must take its
     * tokens with it — a surviving row would keep delivering somebody's orders to
     * a handset after the only record of who they were is gone.
     */
    customerAccountId: uuid()
      .notNull()
      .references(() => customerAccounts.id, { onDelete: 'cascade' }),
    token: text().notNull(),
    platform: devicePlatform().notNull(),
    /**
     * The device's own locale, for the server-rendered fallback only. Null is
     * normal: when localization keys are used the OS picks the language and we
     * are never asked.
     */
    language: languageCode(),
    /**
     * The installed build. Decides whether this device is sent a localization key
     * or a rendered sentence, so it is load-bearing rather than telemetry — see
     * `modules/push/message.ts`.
     */
    appVersion: text().notNull(),
    /**
     * Touched on every registration call. The only evidence we have that an app
     * is still installed, since FCM only tells us a token is dead when we try to
     * use it.
     */
    lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /**
     * Unique across the whole table, NOT per customer, and that is the point: a
     * shared, resold or handed-down phone would otherwise hold a row for each
     * person who ever signed in on it and receive all of their orders. The
     * upsert targets this index, so the newest sign-in simply takes the device.
     */
    uniqueIndex('push_devices_token_key').on(t.token),
    // The dispatcher's only read: every device for one account.
    index('push_devices_customer_idx').on(t.customerAccountId),
  ],
);

export const pushDevicesRelations = relations(pushDevices, ({ one }) => ({
  customerAccount: one(customerAccounts, {
    fields: [pushDevices.customerAccountId],
    references: [customerAccounts.id],
  }),
}));
