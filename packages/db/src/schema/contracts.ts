import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  jsonb,
  numeric,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';
import { contractStatus, contractVariant } from './enums.ts';
import { orders } from './orders.ts';

export const contractNumberSeq = pgSequence('contract_number_seq', {
  startWith: 1000,
  increment: 1,
});

export const contracts = pgTable(
  'contracts',
  {
    id: uuid().primaryKey().defaultRandom(),
    number: text().notNull(),
    /* Nullable: a contract generated for a storefront order carries its id; a
       manual contract (walk-in or phone rental) has no order to point at. */
    orderId: uuid().references(() => orders.id, { onDelete: 'restrict' }),
    variant: contractVariant().notNull(),
    status: contractStatus().notNull().default('generated'),
    language: text().notNull(),
    requiresDeposit: boolean().notNull(),
    depositAmount: numeric({ precision: 12, scale: 2 }),
    contractData: jsonb().$type<Record<string, unknown>>().notNull(),
    signedAt: timestamp({ withTimezone: true }),
    signatureData: jsonb().$type<Record<string, unknown>>(),
    sentAt: timestamp({ withTimezone: true }),
    viewedAt: timestamp({ withTimezone: true }),
    voidedAt: timestamp({ withTimezone: true }),
    voidedByAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
    voidReason: text(),
    pdfStorageKey: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('contracts_number_key').on(t.number),
    index('contracts_order_idx').on(t.orderId),
    index('contracts_status_idx').on(t.status),
    index('contracts_created_at_idx').on(t.createdAt),
    check('contracts_signed_check', sql`${t.status} <> 'signed' OR ${t.signedAt} IS NOT NULL`),
    check('contracts_voided_check', sql`${t.status} <> 'voided' OR ${t.voidedAt} IS NOT NULL`),
  ],
);

export const contractSigningTokens = pgTable(
  'contract_signing_tokens',
  {
    id: text().primaryKey(),
    contractId: uuid()
      .notNull()
      .references(() => contracts.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    consumedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('contract_sign_tokens_contract_idx').on(t.contractId),
    index('contract_sign_tokens_expires_idx').on(t.expiresAt),
  ],
);

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  order: one(orders, { fields: [contracts.orderId], references: [orders.id] }),
  voidedByAdmin: one(adminUsers, {
    fields: [contracts.voidedByAdminUserId],
    references: [adminUsers.id],
  }),
  signingTokens: many(contractSigningTokens),
}));

export const contractSigningTokensRelations = relations(contractSigningTokens, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractSigningTokens.contractId],
    references: [contracts.id],
  }),
}));
