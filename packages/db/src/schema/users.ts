import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { addressKind, userRole } from './enums.ts';

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull(),
    /** scrypt hash, encoded by `shared/auth/password.ts`. Null = cannot log in. */
    passwordHash: text(),
    fullName: text(),
    phone: text(),
    role: userRole().notNull().default('customer'),
    /**
     * Permission codes from `@mia/permissions`. Deliberately an unindexed
     * `int[]`: it is only ever read as part of loading the session user, never
     * filtered on. Ignored entirely for `super_admin`.
     */
    permissions: integer().array().notNull().default([]),
    emailVerifiedAt: timestamp({ withTimezone: true }),
    isActive: boolean().notNull().default(true),
    lastLoginAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex('users_email_key').on(t.email), index('users_role_idx').on(t.role)],
);

export const sessions = pgTable(
  'sessions',
  {
    /** Store a hash of the session token, never the token itself. */
    id: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sessions_user_id_idx').on(t.userId),
    index('sessions_expires_at_idx').on(t.expiresAt),
  ],
);

export const addresses = pgTable(
  'addresses',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: addressKind().notNull(),
    fullName: text().notNull(),
    line1: text().notNull(),
    line2: text(),
    city: text().notNull(),
    region: text(),
    postalCode: text().notNull(),
    /** ISO 3166-1 alpha-2. */
    country: text().notNull(),
    phone: text(),
    isDefault: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('addresses_user_id_idx').on(t.userId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  addresses: many(addresses),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));
