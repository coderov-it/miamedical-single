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

/**
 * Back-office accounts. Customers are a separate table (`customer_accounts`) with
 * a separate session table and a separate cookie, so that nothing about the panel
 * is reachable by the storefront's auth and vice versa. Neither table is a
 * superset of the other: an admin holds permission codes, a customer has order
 * history.
 *
 * Access is attribute-based and there is no role column — see the note in
 * `enums.ts` and the reasoning in `@mia/permissions`.
 */
export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull(),
    /** Argon2id PHC string, encoded by `shared/auth/password.ts`. Null = cannot log in. */
    passwordHash: text(),
    fullName: text(),
    phone: text(),
    /**
     * Holds every permission code, including ones added to the catalog later.
     * The only non-code attribute in the system, and the reason a new permission
     * does not silently lock an all-access operator out of the new area.
     */
    isSuperuser: boolean().notNull().default(false),
    /**
     * Permission codes from `@mia/permissions`. Deliberately an unindexed
     * `int[]`: it is only ever read as part of loading the session user, never
     * filtered on. Ignored entirely when `isSuperuser` is set.
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
  (t) => [
    uniqueIndex('admin_users_email_key').on(t.email),
    index('admin_users_superuser_idx').on(t.isSuperuser),
  ],
);

/**
 * Fixed expiry, deliberately: a back-office session ends `SESSION_TTL_DAYS` after
 * sign-in whatever the operator does. `customer_sessions` slides instead, because
 * logging a customer out of their own order history is a support call and logging
 * an operator out is not.
 */
export const adminSessions = pgTable(
  'admin_sessions',
  {
    /** Store a hash of the session token, never the token itself. */
    id: text().primaryKey(),
    adminUserId: uuid()
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('admin_sessions_user_idx').on(t.adminUserId),
    index('admin_sessions_expires_at_idx').on(t.expiresAt),
  ],
);

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  adminUser: one(adminUsers, { fields: [adminSessions.adminUserId], references: [adminUsers.id] }),
}));
