import type { Database } from '@mia/db';
import {
  blogPosts,
  blogPostTranslations,
  categories,
  categorySpecs,
  categoryTranslations,
  contracts,
  legalPages,
  platformSettings,
  productAddons,
  productFaqs,
  products,
  productTranslations,
  termsDocumentTranslations,
} from '@mia/db/schema';

/**
 * Every stored string that may name a bucket object — what the final-object
 * sweep (orphans.ts) checks a key against before it may delete it.
 *
 *   products.media            thumbnail, cleanPng, gallery, uploaded videos, documents
 *   products.chips            walked anyway — cheap, and a chip may grow an icon
 *   categories.icon           categorySpecs.icon       productAddons.icon
 *   blog_posts.featuredImage  contracts.pdfStorageKey  platform_settings.value
 *   rich text and localized copy an admin could paste a link into: product and
 *   category descriptions, product FAQ answers, blog bodies, terms, legal pages
 *
 * The list errs wide on purpose. A string here that names no object costs a
 * substring test; a column missing here deletes a live file. A new column that
 * stores an object key belongs in this list in the same change.
 */
export async function loadMediaReferences(db: Database): Promise<string[]> {
  const [
    productRows,
    categoryRows,
    specRows,
    addonRows,
    productCopy,
    categoryCopy,
    faqRows,
    postRows,
    postCopy,
    termsCopy,
    legalRows,
    settingRows,
    contractRows,
  ] = await Promise.all([
    db.select({ media: products.media, chips: products.chips }).from(products),
    db.select({ icon: categories.icon }).from(categories),
    db.select({ icon: categorySpecs.icon }).from(categorySpecs),
    db.select({ icon: productAddons.icon }).from(productAddons),
    db
      .select({
        short: productTranslations.shortDescription,
        description: productTranslations.description,
      })
      .from(productTranslations),
    db.select({ description: categoryTranslations.description }).from(categoryTranslations),
    db.select({ answer: productFaqs.answer }).from(productFaqs),
    db.select({ image: blogPosts.featuredImage }).from(blogPosts),
    db.select({ body: blogPostTranslations.body }).from(blogPostTranslations),
    db.select({ body: termsDocumentTranslations.body }).from(termsDocumentTranslations),
    db.select({ body: legalPages.body }).from(legalPages),
    db.select({ value: platformSettings.value }).from(platformSettings),
    db.select({ key: contracts.pdfStorageKey }).from(contracts),
  ]);

  const strings: string[] = [];
  const rowSets: object[][] = [
    productRows,
    categoryRows,
    specRows,
    addonRows,
    productCopy,
    categoryCopy,
    faqRows,
    postRows,
    postCopy,
    termsCopy,
    legalRows,
    settingRows,
    contractRows,
  ];
  for (const rows of rowSets) for (const row of rows) collectStrings(row, strings);
  return strings;
}

/** Every string leaf of a row, however deep its jsonb nests. */
export function collectStrings(value: unknown, into: string[]): void {
  if (typeof value === 'string') {
    if (value.length > 0) into.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, into);
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, into);
  }
}
