/**
 * Terms & conditions documents, and the products that sign them.
 *
 * This is the part the JSON importer never had: `defineTerms` and a product's
 * `terms` field have existed in the authoring API since it was written, and
 * `terms_documents`, `terms_document_translations` and `product_terms` have
 * existed in the schema, but nothing joined the two. A catalogue synced by the
 * old path had products whose rental conditions were simply absent.
 *
 * Documents are written FIRST, before any product, because `product_terms`
 * references them and the plan's cross-check (`unlinkedTerms`) only proves the
 * registry lists them, not that the row is in the table yet.
 *
 * `publishedAt` is stamped the first time a document is written as `published`
 * and never moved after: it is when these conditions took effect, which is the
 * date a dispute turns on, so a re-run must not quietly restamp it to today.
 */
import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import { productTerms, termsDocumentTranslations, termsDocuments } from '@mia/db/schema';

import type { CatalogPlan, PlannedTerms } from './planned.ts';
import { prune } from './rows.ts';

export interface TermsCounts {
  documents: number;
  translations: number;
  links: number;
  deleted: number;
}

export async function writeTerms(db: Database, plan: CatalogPlan): Promise<TermsCounts> {
  const counts: TermsCounts = { documents: 0, translations: 0, links: 0, deleted: 0 };

  for (const document of plan.terms) {
    await upsertDocument(db, document);
    counts.documents += 1;
    counts.translations += await writeTranslations(db, document);
    counts.deleted += await prune(
      db,
      termsDocumentTranslations,
      eq(termsDocumentTranslations.termsId, document.id),
      termsDocumentTranslations.languageCode,
      Object.keys(document.translations),
    );
  }

  return counts;
}

async function upsertDocument(db: Database, document: PlannedTerms): Promise<void> {
  const columns = {
    code: document.code,
    status: document.status,
    version: document.version,
    ...(document.status === 'published' ? { publishedAt: new Date() } : {}),
  };
  await db
    .insert(termsDocuments)
    .values({ id: document.id, ...columns })
    .onConflictDoUpdate({
      target: termsDocuments.id,
      // `publishedAt` stays out of the SET list — see the note at the top.
      set: { code: document.code, status: document.status, version: document.version },
    });
}

async function writeTranslations(db: Database, document: PlannedTerms): Promise<number> {
  let written = 0;
  for (const [language, translation] of Object.entries(document.translations) as [
    LanguageCode,
    PlannedTerms['translations'][LanguageCode],
  ][]) {
    if (!translation) continue;
    const columns = {
      title: translation.title,
      body: translation.body,
      slug: translation.slug,
    };
    await db
      .insert(termsDocumentTranslations)
      .values({ termsId: document.id, languageCode: language, ...columns })
      .onConflictDoUpdate({
        target: [termsDocumentTranslations.termsId, termsDocumentTranslations.languageCode],
        set: columns,
      });
    written += 1;
  }
  return written;
}

/**
 * The `product_terms` join, reconciled per product: a document dropped from a
 * product's `terms` list is unlinked, and the document itself is untouched —
 * `onDelete: 'restrict'` on the FK is the schema saying the same thing.
 *
 * Runs after the products exist, so it is separate from `writeTerms`.
 */
export async function writeTermsLinks(db: Database, plan: CatalogPlan): Promise<TermsCounts> {
  const counts: TermsCounts = { documents: 0, translations: 0, links: 0, deleted: 0 };

  for (const product of plan.products) {
    for (const [position, id] of product.termsIds.entries()) {
      await db
        .insert(productTerms)
        .values({ productId: product.id, termsId: id, position })
        .onConflictDoUpdate({
          target: [productTerms.productId, productTerms.termsId],
          set: { position },
        });
      counts.links += 1;
    }
    counts.deleted += await prune(
      db,
      productTerms,
      eq(productTerms.productId, product.id),
      productTerms.termsId,
      product.termsIds,
    );
  }

  return counts;
}
