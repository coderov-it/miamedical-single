import { relations } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';

/**
 * Operator-editable platform configuration, one row per setting.
 *
 * A key→jsonb bag rather than a single wide row: the next setting should cost an
 * INSERT, not a migration, and settings have nothing in common with each other
 * beyond being editable. Keys are English identifiers (`notificationRecipients`),
 * per the naming rule in AGENTS.md — only the values a human reads are Italian.
 *
 * Value shapes are validated at the service layer against schemas in
 * `@mia/validators`; the database only guarantees "some jsonb".
 *
 * Known keys:
 *   notificationRecipients  { emails: string[] }  who gets platform alerts
 */
export const platformSettings = pgTable('platform_settings', {
  key: text().primaryKey(),
  value: jsonb().$type<Record<string, unknown>>().notNull(),
  updatedByAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const platformSettingsRelations = relations(platformSettings, ({ one }) => ({
  updatedByAdminUser: one(adminUsers, {
    fields: [platformSettings.updatedByAdminUserId],
    references: [adminUsers.id],
  }),
}));
