import { relations } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { addressKind } from './enums.ts';

/**
 * Storefront accounts. Created by the checkout, not by a signup form: ordering is
 * the only way one comes into existence, and the customer claims it afterwards by
 * clicking a link we email them. How that works, and how an order gets attached to
 * an account, is documented in docs/code/customer-accounts.md.
 */
export const customerAccounts = pgTable(
  'customer_accounts',
  {
    id: uuid().primaryKey().defaultRandom(),
    /**
     * The identity. A plain unique index rather than one on `lower(email)`:
     * `EmailSchema` in `@mia/validators` trims and lowercases, and every write
     * path goes through it, so the stored value is already normalised.
     */
    email: text().notNull(),
    /**
     * Argon2id PHC string, same encoder as the back office. Null is a normal
     * state, not a broken one — a customer who only ever uses magic links never
     * sets a password.
     */
    passwordHash: text(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    /**
     * The WhatsApp number. Deliberately NOT unique: a clinic or a hotel places
     * orders for several people on one number, and making it unique would refuse
     * the second one.
     */
    phone: text(),
    /**
     * When the customer first proved they own the inbox, by redeeming any emailed
     * token. Null = auto-created by an order and never claimed.
     *
     * There is no separate `emailVerifiedAt`: redeeming a token IS the proof, and
     * the profile form cannot change the email, so the two would never disagree.
     */
    activatedAt: timestamp({ withTimezone: true }),
    lastLoginAt: timestamp({ withTimezone: true }),
    /** Cleared by an operator to lock an account out without deleting it. */
    isActive: boolean().notNull().default(true),
    /**
     * Soft delete. An erasure request rewrites `email` to a tombstone rather than
     * nulling it, so the unique index still holds and a returning customer on the
     * same address gets a clean new row instead of a conflict.
     */
    deletedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('customer_accounts_email_key').on(t.email),
    index('customer_accounts_phone_idx').on(t.phone),
    index('customer_accounts_created_at_idx').on(t.createdAt),
  ],
);

/**
 * Sliding expiry, unlike `admin_sessions`: any authenticated request more than
 * `CUSTOMER_SESSION_REFRESH_HOURS` old pushes `expiresAt` back out to a full TTL.
 * A customer who orders twice a year should not meet a login form; an operator
 * being asked to sign in weekly is fine.
 */
export const customerSessions = pgTable(
  'customer_sessions',
  {
    /** Store a hash of the session token, never the token itself. */
    id: text().primaryKey(),
    customerAccountId: uuid()
      .notNull()
      .references(() => customerAccounts.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('customer_sessions_account_idx').on(t.customerAccountId),
    index('customer_sessions_expires_at_idx').on(t.expiresAt),
  ],
);

/**
 * Saved addresses. Built but not yet surfaced: the checkout does not offer to
 * reuse one, and nothing writes here. It hangs off `customer_accounts` rather
 * than the back office because a saved shipping address is a customer's, never an
 * operator's.
 */
export const addresses = pgTable(
  'addresses',
  {
    id: uuid().primaryKey().defaultRandom(),
    customerAccountId: uuid()
      .notNull()
      .references(() => customerAccounts.id, { onDelete: 'cascade' }),
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
  (t) => [index('addresses_customer_account_idx').on(t.customerAccountId)],
);

export const customerAccountsRelations = relations(customerAccounts, ({ many }) => ({
  sessions: many(customerSessions),
  addresses: many(addresses),
}));

export const customerSessionsRelations = relations(customerSessions, ({ one }) => ({
  customerAccount: one(customerAccounts, {
    fields: [customerSessions.customerAccountId],
    references: [customerAccounts.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customerAccount: one(customerAccounts, {
    fields: [addresses.customerAccountId],
    references: [customerAccounts.id],
  }),
}));
