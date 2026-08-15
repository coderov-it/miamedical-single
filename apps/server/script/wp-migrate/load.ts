import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDatabase, eq, sql } from '@mia/db';
import {
  categories,
  categorySpecOptions,
  categorySpecs,
  categoryTranslations,
  productAddons,
  productSkuOptions,
  productSkus,
  productSpecValueOptions,
  productSpecValues,
  productTranslations,
  productVariantGroups,
  productVariantOptions,
  products,
  searchVectorFor,
} from '@mia/db/schema';
import {
  CreateProductSchema,
  RentalPackagesSchema,
  SpecValueInputSchema,
  VariantGroupInputSchema,
} from '@mia/validators';
import * as v from 'valibot';

import { env } from '../../src/config/env.ts';
import { richTextToPlain } from '../../src/shared/html/rich-text.ts';
import { imageConverter } from '../../src/infra/convert/sharp.ts';
import { r2FileUploader } from '../../src/infra/storage/r2.ts';
import {
  composeSku,
  generateCombinations,
  randomSuffix,
} from '../../src/modules/products/variants/sku.ts';
import type {
  AddonChunk,
  CategoryChunk,
  MediaChunk,
  ProductChunk,
  SpecChunk,
  SpecValueChunk,
  VariantGroupChunk,
} from './types.ts';

/**
 * Phase two: read the reviewed JSON chunks into PostgreSQL and R2.
 *
 *   pnpm --filter @mia/server wp:load -- --dry-run     validate only, write nothing
 *   pnpm --filter @mia/server wp:load -- --skip-media  rows only, no downloads
 *   pnpm --filter @mia/server wp:load -- --truncate    clear the catalog first
 *
 * Idempotent by construction: every id came from `ids.ts` as a UUIDv5 of the
 * WordPress row, so a second run updates the same rows instead of duplicating
 * them. Edit a chunk, re-run, and only what changed changes.
 *
 * Full walkthrough in docs/code/wp-migration.md.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const IN_DIR = join(HERE, '../../../../docs/migration/wp');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const SKIP_MEDIA = args.has('--skip-media');
const TRUNCATE = args.has('--truncate');

const db = createDatabase({ url: env.DATABASE_URL, logger: false });

const read = <T>(name: string): T => JSON.parse(readFileSync(join(IN_DIR, name), 'utf8')) as T;

const problems: string[] = [];
const fail = (where: string, detail: string): void => {
  problems.push(`${where}: ${detail}`);
};

/**
 * Validate a chunk row against the real API schema rather than a bespoke one,
 * so `--dry-run` proves the data would survive the admin's own contract. Errors
 * are collected, not thrown: one run should report every bad row, not the first.
 */
function check<TSchema extends v.GenericSchema>(
  schema: TSchema,
  value: unknown,
  where: string,
): boolean {
  const result = v.safeParse(schema, value);
  if (result.success) return true;
  for (const issue of result.issues) {
    const path = issue.path?.map((segment) => String(segment.key)).join('.') ?? '';
    fail(where, `${path ? `${path}: ` : ''}${issue.message}`);
  }
  return false;
}

async function main(): Promise<void> {
  const categoryChunks = read<{ categories: CategoryChunk[] }>('01-categories.json').categories;
  const specChunks = read<{ specs: SpecChunk[] }>('02-category-specs.json').specs;
  const productChunks = read<{ products: ProductChunk[] }>('03-products.json').products;
  const specValueChunks = read<{ specValues: SpecValueChunk[] }>(
    '04-product-specs.json',
  ).specValues;
  const variantChunks = read<{ variantGroups: VariantGroupChunk[] }>(
    '05-variants.json',
  ).variantGroups;
  const mediaDoc = read<{ mediaBaseUrl: string; media: MediaChunk[] }>('06-media.json');
  const addonChunks = read<{ addons: AddonChunk[] }>('07-addons.json').addons;

  console.log(
    `Loading ${categoryChunks.length} categories, ${productChunks.length} products, ` +
      `${specChunks.length} specs, ${specValueChunks.length} spec values, ` +
      `${variantChunks.length} variant groups, ${mediaDoc.media.length} media, ` +
      `${addonChunks.length} addons`,
  );
  console.log(
    `mode: ${DRY_RUN ? 'DRY RUN' : 'WRITE'}${SKIP_MEDIA ? ' +skip-media' : ''}${TRUNCATE ? ' +truncate' : ''}\n`,
  );

  // --- validate everything before touching the database ---------------------

  const categoryIds = new Set(categoryChunks.map((chunk) => chunk.id));
  const productIds = new Set(productChunks.map((chunk) => chunk.id));
  const specIds = new Set(specChunks.map((chunk) => chunk.id));
  const specOptionIds = new Set(specChunks.flatMap((chunk) => chunk.options.map((o) => o.id)));

  for (const chunk of productChunks) {
    const where = `product ${chunk.wpPostId} (${chunk.translation.title.slice(0, 40)})`;
    if (!categoryIds.has(chunk.categoryId))
      fail(where, `categoryId ${chunk.categoryId} not in chunk 01`);

    // The create contract covers every column this loader writes except media
    // and packages, which have schemas of their own.
    check(
      CreateProductSchema,
      {
        baseSku: chunk.baseSku,
        categoryId: chunk.categoryId,
        status: chunk.status,
        brand: chunk.brand,
        pricingMode: chunk.pricingMode,
        basePrice: chunk.basePrice,
        marketingRate: chunk.marketingRate,
        currency: chunk.currency,
        rentalUnit: chunk.rentalUnit,
        rentalPackages: chunk.pricingMode === 'rental' ? chunk.rentalPackages : undefined,
        isFeatured: chunk.isFeatured,
        translations: { it: chunk.translation },
      },
      where,
    );
    /* `RentalPackagesSchema` requires at least one, which is only true of a
       rental — a fixed product's list is legitimately empty. */
    if (chunk.pricingMode === 'rental') {
      check(RentalPackagesSchema, chunk.rentalPackages, `${where} packages`);
    } else if (chunk.rentalPackages.length > 0) {
      fail(where, 'fixed product carries rental packages — the database CHECK will reject it');
    }
  }

  for (const chunk of variantChunks) {
    const where = `variant group ${chunk.key} on product ${chunk.wpPostId}`;
    if (!productIds.has(chunk.productId)) fail(where, 'productId not in chunk 03');
    check(
      VariantGroupInputSchema,
      {
        key: chunk.key,
        label: chunk.label,
        valueType: chunk.valueType,
        unit: chunk.unit,
        isRequired: chunk.isRequired,
        affectsSku: chunk.affectsSku,
        position: chunk.position,
        options: chunk.options.map((option) => ({
          value: option.value,
          label: option.label,
          skuCode: option.skuCode,
          priceModifier: option.priceModifier,
          isDefault: option.isDefault,
          position: option.position,
        })),
      },
      where,
    );
  }

  for (const chunk of specValueChunks) {
    const where = `spec value ${chunk.categoryCode}/${chunk.specKey} on product ${chunk.wpPostId}`;
    if (!productIds.has(chunk.productId)) fail(where, 'productId not in chunk 03');
    if (!specIds.has(chunk.specId)) fail(where, 'specId not in chunk 02');
    for (const optionId of chunk.optionIds) {
      if (!specOptionIds.has(optionId)) fail(where, `optionId ${optionId} not in chunk 02`);
    }
    check(
      SpecValueInputSchema,
      {
        specId: chunk.specId,
        numberValue: chunk.numberValue,
        numberMin: chunk.numberMin,
        numberMax: chunk.numberMax,
        booleanValue: chunk.booleanValue,
        textValue: chunk.textValue,
        optionIds: chunk.optionIds,
      },
      where,
    );
  }

  for (const chunk of mediaDoc.media) {
    if (!productIds.has(chunk.productId)) {
      fail(`media ${chunk.wpAttachmentId}`, 'productId not in chunk 03');
    }
  }

  if (problems.length > 0) {
    console.error(`${problems.length} validation problems:\n`);
    for (const problem of problems.slice(0, 60)) console.error(`  ${problem}`);
    if (problems.length > 60) console.error(`  … and ${problems.length - 60} more`);
    console.error('\nNothing was written. Fix the chunks and re-run.');
    process.exit(1);
  }
  console.log('validation           all chunks pass their API schemas');

  const unbound = addonChunks.filter((chunk) => chunk.productIds.length === 0);
  if (unbound.length > 0) {
    console.log(
      `addons               ${unbound.length} unbound, will be SKIPPED (fill productIds to load them)`,
    );
  }

  if (DRY_RUN) {
    const skuCount = variantChunks.reduce(
      (sum, group) => sum + (group.affectsSku ? group.options.length : 0),
      0,
    );
    console.log('\nwould write:');
    console.log(`  categories             ${categoryChunks.length}`);
    console.log(`  category_translations  ${categoryChunks.length}`);
    console.log(`  category_specs         ${specChunks.length}`);
    console.log(`  category_spec_options  ${specChunks.reduce((s, c) => s + c.options.length, 0)}`);
    console.log(`  products               ${productChunks.length}`);
    console.log(`  product_translations   ${productChunks.length}`);
    console.log(`  product_spec_values    ${specValueChunks.length}`);
    console.log(`  product_variant_groups ${variantChunks.length}`);
    console.log(
      `  product_variant_options ${variantChunks.reduce((s, g) => s + g.options.length, 0)}`,
    );
    console.log(`  product_skus           ~${skuCount}`);
    console.log(`  product_addons         ${addonChunks.length - unbound.length}`);
    console.log(`  R2 objects             ${SKIP_MEDIA ? 0 : mediaDoc.media.length}`);
    console.log('\nDry run — nothing written.');
    await db.$client.end();
    return;
  }

  // --- write ----------------------------------------------------------------

  if (TRUNCATE) {
    // `users` and `sessions` are deliberately absent: losing them means losing
    // the admin login for no benefit. Orders go because their lines point at
    // SKUs that are about to be replaced.
    await db.execute(sql`
      TRUNCATE TABLE
        order_items, order_status_events, orders, cart_items, carts,
        product_sku_options, product_skus, product_spec_value_options,
        product_spec_values, product_variant_options, product_variant_groups,
        product_addons, product_faqs, product_question_options, product_questions,
        product_terms, product_translations, products,
        category_spec_options, category_specs, category_translations, categories
      RESTART IDENTITY CASCADE
    `);
    console.log('truncate             catalog + orders cleared, users kept');
  }

  // Categories, with their Italian translation and search vector.
  for (const chunk of categoryChunks) {
    await db
      .insert(categories)
      .values({
        id: chunk.id,
        code: chunk.code,
        icon: chunk.icon,
        position: chunk.position,
        isActive: chunk.isActive,
      })
      .onConflictDoUpdate({
        target: categories.id,
        set: { code: chunk.code, position: chunk.position, isActive: chunk.isActive },
      });

    await db
      .insert(categoryTranslations)
      .values({
        categoryId: chunk.id,
        languageCode: 'it',
        name: chunk.name.it,
        description: chunk.description,
        slug: chunk.slug,
        searchVector: searchVectorFor('it', chunk.name.it, chunk.description) as unknown as string,
      })
      .onConflictDoUpdate({
        target: [categoryTranslations.categoryId, categoryTranslations.languageCode],
        set: {
          name: chunk.name.it,
          description: chunk.description,
          slug: chunk.slug,
          searchVector: searchVectorFor(
            'it',
            chunk.name.it,
            chunk.description,
          ) as unknown as string,
        },
      });
  }
  console.log(`categories           ${categoryChunks.length}`);

  for (const chunk of specChunks) {
    await db
      .insert(categorySpecs)
      .values({
        id: chunk.id,
        categoryId: chunk.categoryId,
        key: chunk.key,
        label: chunk.label,
        valueType: chunk.valueType as 'string',
        unit: chunk.unit,
        isRequired: chunk.isRequired,
        isFilterable: chunk.isFilterable,
        isComparable: chunk.isComparable,
        position: chunk.position,
      })
      .onConflictDoUpdate({
        target: categorySpecs.id,
        set: {
          label: chunk.label,
          valueType: chunk.valueType as 'string',
          unit: chunk.unit,
          isFilterable: chunk.isFilterable,
          isComparable: chunk.isComparable,
          position: chunk.position,
        },
      });

    for (const option of chunk.options) {
      await db
        .insert(categorySpecOptions)
        .values({
          id: option.id,
          specId: chunk.id,
          value: option.value,
          label: option.label,
          position: option.position,
        })
        .onConflictDoUpdate({
          target: categorySpecOptions.id,
          set: { label: option.label, position: option.position },
        });
    }
  }
  console.log(`category_specs       ${specChunks.length}`);

  for (const chunk of productChunks) {
    const body = chunk.translation;
    await db
      .insert(products)
      .values({
        id: chunk.id,
        baseSku: chunk.baseSku,
        status: chunk.status,
        categoryId: chunk.categoryId,
        brand: chunk.brand,
        pricingMode: chunk.pricingMode,
        basePrice: chunk.basePrice,
        marketingRate: chunk.marketingRate,
        currency: chunk.currency,
        rentalUnit: chunk.rentalUnit,
        rentalPackages: chunk.rentalPackages,
        isFeatured: chunk.isFeatured,
      })
      .onConflictDoUpdate({
        target: products.id,
        // `pricingMode` is write-once everywhere else and stays out of the SET
        // list here too — a re-run must not flip a product's mode underneath
        // the addons and SKUs already priced against it.
        set: {
          baseSku: chunk.baseSku,
          status: chunk.status,
          categoryId: chunk.categoryId,
          brand: chunk.brand,
          basePrice: chunk.basePrice,
          marketingRate: chunk.marketingRate,
          currency: chunk.currency,
          rentalUnit: chunk.rentalUnit,
          rentalPackages: chunk.rentalPackages,
          isFeatured: chunk.isFeatured,
        },
      });

    // `description` is HTML; the tsvector gets its words, never its tags.
    const vector = searchVectorFor(
      'it',
      body.title,
      [body.shortDescription, richTextToPlain(body.description)].filter(Boolean).join(' ') || null,
    ) as unknown as string;

    await db
      .insert(productTranslations)
      .values({
        productId: chunk.id,
        languageCode: 'it',
        title: body.title,
        shortDescription: body.shortDescription,
        description: body.description,
        slug: body.slug,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        searchVector: vector,
      })
      .onConflictDoUpdate({
        target: [productTranslations.productId, productTranslations.languageCode],
        set: {
          title: body.title,
          shortDescription: body.shortDescription,
          description: body.description,
          slug: body.slug,
          metaTitle: body.metaTitle,
          metaDescription: body.metaDescription,
          searchVector: vector,
        },
      });
  }
  console.log(`products             ${productChunks.length}`);

  for (const chunk of variantChunks) {
    await db
      .insert(productVariantGroups)
      .values({
        id: chunk.id,
        productId: chunk.productId,
        key: chunk.key,
        label: chunk.label,
        valueType: chunk.valueType as 'single_select',
        unit: chunk.unit,
        isRequired: chunk.isRequired,
        affectsSku: chunk.affectsSku,
        position: chunk.position,
      })
      .onConflictDoUpdate({
        target: productVariantGroups.id,
        set: { label: chunk.label, position: chunk.position, affectsSku: chunk.affectsSku },
      });

    for (const option of chunk.options) {
      await db
        .insert(productVariantOptions)
        .values({
          id: option.id,
          groupId: chunk.id,
          value: option.value,
          label: option.label,
          skuCode: option.skuCode,
          priceModifier: option.priceModifier,
          isDefault: option.isDefault,
          position: option.position,
        })
        .onConflictDoUpdate({
          target: productVariantOptions.id,
          set: {
            label: option.label,
            skuCode: option.skuCode,
            priceModifier: option.priceModifier,
            isDefault: option.isDefault,
            position: option.position,
          },
        });
    }
  }
  console.log(`variant_groups       ${variantChunks.length}`);

  // Spec values, plus the option join rows that make select facets index-backed.
  for (const chunk of specValueChunks) {
    await db
      .insert(productSpecValues)
      .values({
        productId: chunk.productId,
        specId: chunk.specId,
        numberValue: chunk.numberValue === null ? null : String(chunk.numberValue),
        numberMin: chunk.numberMin === null ? null : String(chunk.numberMin),
        numberMax: chunk.numberMax === null ? null : String(chunk.numberMax),
        booleanValue: chunk.booleanValue,
        textValue: chunk.textValue,
      })
      .onConflictDoUpdate({
        target: [productSpecValues.productId, productSpecValues.specId],
        set: {
          numberValue: chunk.numberValue === null ? null : String(chunk.numberValue),
          numberMin: chunk.numberMin === null ? null : String(chunk.numberMin),
          numberMax: chunk.numberMax === null ? null : String(chunk.numberMax),
          booleanValue: chunk.booleanValue,
          textValue: chunk.textValue,
        },
      });

    for (const optionId of chunk.optionIds) {
      await db
        .insert(productSpecValueOptions)
        .values({ productId: chunk.productId, specId: chunk.specId, optionId })
        .onConflictDoNothing();
    }
  }
  console.log(`spec_values          ${specValueChunks.length}`);

  // SKUs, through the app's own matrix generator so the strings match what the
  // admin would produce for the same groups.
  let skuTotal = 0;
  for (const chunk of productChunks) {
    const groups = variantChunks
      .filter((group) => group.productId === chunk.id)
      .map((group) => ({
        id: group.id,
        productId: group.productId,
        key: group.key,
        affectsSku: group.affectsSku,
        position: group.position,
        options: group.options.map((option) => ({
          id: option.id,
          groupId: group.id,
          value: option.value,
          skuCode: option.skuCode,
          position: option.position,
        })),
      }));

    /**
     * `generateCombinations` is typed for full database rows but only reads
     * `affectsSku`, `position` and each option's `id` / `value` / `skuCode` /
     * `position` — all of which the chunk carries. Casting here reuses the
     * app's own generator rather than reimplementing SKU composition, which is
     * the point: the strings must match what the admin would produce.
     */
    const combos = generateCombinations(
      groups as unknown as Parameters<typeof generateCombinations>[0],
    );
    const groupOfOption = new Map(
      groups.flatMap((group) => group.options.map((option) => [option.id, group.id])),
    );

    for (const [index, combo] of combos.entries()) {
      const suffix = randomSuffix();
      const [row] = await db
        .insert(productSkus)
        .values({
          productId: chunk.id,
          sku: composeSku(chunk.baseSku, combo.codes, suffix),
          suffix,
          comboKey: combo.comboKey,
          stock: 0,
          position: index,
        })
        .onConflictDoNothing({ target: [productSkus.productId, productSkus.comboKey] })
        .returning({ id: productSkus.id });
      if (!row) continue;
      skuTotal++;
      await db
        .insert(productSkuOptions)
        .values(
          combo.optionIds.map((optionId) => ({
            skuId: row.id,
            optionId,
            groupId: groupOfOption.get(optionId)!,
          })),
        )
        .onConflictDoNothing();
    }
  }
  console.log(`product_skus         ${skuTotal}`);

  let addonTotal = 0;
  for (const chunk of addonChunks) {
    for (const boundProductId of chunk.productIds) {
      const product = productChunks.find((item) => item.id === boundProductId);
      if (!product) continue;
      await db
        .insert(productAddons)
        .values({
          id: chunk.productIds.length === 1 ? chunk.id : undefined,
          productId: boundProductId,
          name: chunk.name,
          description: chunk.description,
          pricingMode: chunk.pricingMode,
          // The denormalised copy the composite FK keeps provably in sync.
          productPricingMode: product.pricingMode,
          price: chunk.price,
          currency: product.currency,
          rentalUnit: chunk.pricingMode === 'rental' ? (product.rentalUnit ?? 'day') : null,
          minQuantity: chunk.minQuantity,
          maxQuantity: chunk.maxQuantity,
          position: chunk.position,
        })
        .onConflictDoNothing();
      addonTotal++;
    }
  }
  console.log(`product_addons       ${addonTotal}`);

  // --- media ----------------------------------------------------------------

  if (SKIP_MEDIA) {
    console.log('media                skipped (--skip-media)');
  } else {
    const stats = await loadMedia(mediaDoc.media, productChunks);
    console.log(
      `media                ${stats.uploaded} uploaded, ${stats.reused} already in R2, ${stats.failed} failed`,
    );
  }

  await db.$client.end();
  console.log('\nDone.');
}

// --- media ------------------------------------------------------------------

/**
 * Download from the live site, convert images to WebP through the same
 * `SharpImageConverter` the upload route uses, and store under the product's
 * own scope. PDFs and MP4s pass through untouched, matching `MEDIA_PROFILES`.
 *
 * `head()` before every upload makes a re-run cheap: the object key is derived
 * from the WordPress attachment id, so a completed download is never fetched
 * twice.
 */
async function loadMedia(
  media: MediaChunk[],
  productChunks: ProductChunk[],
): Promise<{ uploaded: number; reused: number; failed: number }> {
  const MAX_EDGE = 2048;
  let uploaded = 0;
  let reused = 0;
  let failed = 0;

  const byProduct = new Map<string, MediaChunk[]>();
  for (const item of media) {
    const list = byProduct.get(item.productId) ?? [];
    list.push(item);
    byProduct.set(item.productId, list);
  }

  for (const [productKey, items] of byProduct) {
    const product = productChunks.find((chunk) => chunk.id === productKey);
    if (!product) continue;

    const blob: {
      thumbnail: MediaEntry | null;
      cleanPng: MediaEntry | null;
      gallery: MediaEntry[];
      videos: MediaEntry[];
      documents: MediaEntry[];
    } = { thumbnail: null, cleanPng: null, gallery: [], videos: [], documents: [] };

    for (const item of items.sort((a, b) => a.position - b.position)) {
      const isImage = item.mimeType.startsWith('image/') && item.mimeType !== 'image/svg+xml';
      const fileName = item.sourceUrl.split('/').pop() ?? `${item.wpAttachmentId}`;
      const stem = fileName.replace(/\.[^.]+$/, '');
      const key = isImage
        ? `products/${product.id}/${item.wpAttachmentId}-${stem}.webp`
        : `products/${product.id}/${item.wpAttachmentId}-${fileName}`;
      const mimeType = isImage ? 'image/webp' : item.mimeType;

      const existing = await r2FileUploader.head(key);
      if (existing) {
        reused++;
      } else {
        try {
          const response = await fetch(item.sourceUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const source = new Uint8Array(await response.arrayBuffer());
          if (isImage) {
            const converted = await imageConverter.toWebp(source, { maxEdge: MAX_EDGE });
            await r2FileUploader.upload(key, converted.bytes, converted.mimeType);
          } else {
            await r2FileUploader.upload(key, source, item.mimeType);
          }
          uploaded++;
        } catch (error) {
          failed++;
          console.warn(
            `  media ${item.wpAttachmentId} (${item.sourceUrl}): ${(error as Error).message}`,
          );
          continue;
        }
      }

      const entry: MediaEntry = {
        path: key,
        mimeType,
        ...(item.alt ? { alt: { it: item.alt.slice(0, 300) } } : {}),
      };
      if (item.role === 'thumbnail' && !blob.thumbnail) blob.thumbnail = entry;
      else if (item.role === 'document') blob.documents.push(entry);
      else if (item.role === 'video') blob.videos.push(entry);
      else blob.gallery.push(entry);
    }

    // Schema caps: gallery 30, videos 10, documents 20.
    blob.gallery = blob.gallery.slice(0, 30);
    blob.videos = blob.videos.slice(0, 10);
    blob.documents = blob.documents.slice(0, 20);

    await db.update(products).set({ media: blob }).where(eq(products.id, product.id));
  }

  return { uploaded, reused, failed };
}

interface MediaEntry {
  path: string;
  mimeType: string;
  alt?: { it: string };
}

await main().catch(async (error: unknown) => {
  console.error('\nLoad failed:', error);
  await db.$client.end().catch(() => undefined);
  process.exit(1);
});
