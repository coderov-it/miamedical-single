import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';
import { localized, localizedCheck, optionalLocalizedCheck } from './i18n.ts';

/**
 * The site's own policies — the privacy notice, and whatever joins it.
 *
 * ── Why this is not `terms_documents` ──────────────────────────────────────
 * That table is a POOL: a rental-conditions text, a warranty text, each linked
 * to any number of products through `product_terms`, each with its own slug and
 * a draft → published → archived life. A privacy notice is none of that. It is
 * one text, at one URL the storefront already declares, that must always be
 * reachable — so it has no slug column (`code` maps to a route key), no status
 * (there is no legitimate state in which the site serves no privacy notice) and
 * no list.
 *
 * ── Why the text is inline jsonb ───────────────────────────────────────────
 * The rule in `i18n.ts`: a `*_translations` table only when PostgreSQL indexes
 * the text — full-text search, or a per-locale unique slug. Neither applies, so
 * each field is one `{ it, en, fr, de }` column, a new language is a key rather
 * than a migration, and the admin's localized field components bind to it with
 * no pivot.
 *
 * `body` holds sanitised HTML per language (`sanitizeRichText`, the same gate
 * the product description passes through). The storefront renders it with
 * `set:html`; nothing else may write this column.
 */
export const legalPages = pgTable(
  'legal_pages',
  {
    /** `privacy-policy` — the storefront route key this page renders at. */
    code: text().primaryKey(),
    title: localized().notNull(),
    body: localized().notNull(),
    metaTitle: localized(),
    metaDescription: localized(),
    /**
     * "In vigore dal", set by the operator. Not `updated_at`: correcting a typo
     * does not move the date a notice took effect, and that date is the one
     * with legal meaning.
     */
    effectiveAt: timestamp({ withTimezone: true }),
    updatedByAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    /* The source language is mandatory in the database, not only in valibot —
       it is what every other language falls back to. */
    localizedCheck('legal_pages_title_it_check', t.title),
    localizedCheck('legal_pages_body_it_check', t.body),
    optionalLocalizedCheck('legal_pages_meta_title_it_check', t.metaTitle),
    optionalLocalizedCheck('legal_pages_meta_desc_it_check', t.metaDescription),
  ],
);

export const legalPagesRelations = relations(legalPages, ({ one }) => ({
  updatedByAdminUser: one(adminUsers, {
    fields: [legalPages.updatedByAdminUserId],
    references: [adminUsers.id],
  }),
}));
