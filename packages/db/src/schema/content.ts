import { relations } from 'drizzle-orm';
import { integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { termsStatus } from './enums.ts';
import { languageCode } from './i18n.ts';

/**
 * Terms & conditions documents, linkable to any number of products (the
 * `product_terms` join lives in catalog.ts, keeping this module import-free
 * of the catalog and the dependency graph acyclic).
 */

export const termsDocuments = pgTable(
  'terms_documents',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Stable machine handle, e.g. `noleggio-generale`. */
    code: text().notNull(),
    status: termsStatus().notNull().default('draft'),
    version: integer().notNull().default(1),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex('terms_documents_code_key').on(t.code)],
);

export const termsDocumentTranslations = pgTable(
  'terms_document_translations',
  {
    termsId: uuid()
      .notNull()
      .references(() => termsDocuments.id, { onDelete: 'cascade' }),
    languageCode: languageCode().notNull(),
    title: text().notNull(),
    body: text().notNull(),
    slug: text().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.termsId, t.languageCode] }),
    uniqueIndex('terms_document_translations_lang_slug_key').on(t.languageCode, t.slug),
  ],
);

export const termsDocumentsRelations = relations(termsDocuments, ({ many }) => ({
  translations: many(termsDocumentTranslations),
}));

export const termsDocumentTranslationsRelations = relations(
  termsDocumentTranslations,
  ({ one }) => ({
    terms: one(termsDocuments, {
      fields: [termsDocumentTranslations.termsId],
      references: [termsDocuments.id],
    }),
  }),
);
