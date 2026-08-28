/**
 * Every row the migration writes, phase by phase, in dependency order:
 * categories → their specs → products → spec values → addons.
 *
 * Phases run in sequence because each points at the one before it. Inside a
 * phase the writes are independent and run `POOL` at a time — see `runPhase`
 * for why that is both safe and the difference between one minute and thirteen.
 */
import type { Database } from '@mia/db';
import {
  categories,
  categorySpecOptions,
  categorySpecs,
  categoryTranslations,
  productAddons,
  productSpecValueOptions,
  productSpecValues,
  productTranslations,
  products,
  searchVectorFor,
} from '@mia/db/schema';

import { richTextToPlain } from '../../../src/shared/html/rich-text.ts';
import type { LoadPlan } from '../types.ts';
import { runPhase } from './progress.ts';

export async function writeRows(db: Database, plan: LoadPlan): Promise<void> {
  await writeCategories(db, plan);
  await writeCategorySpecs(db, plan);
  await writeProducts(db, plan);
  await writeSpecValues(db, plan);
  await writeAddons(db, plan);
}

/** Categories, with their Italian translation and search vector. */
async function writeCategories(db: Database, plan: LoadPlan): Promise<void> {
  await runPhase('categories', plan.categories, async (chunk) => {
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
        // `icon` stays out of the SET list: it holds an R2 key the media pass
        // wrote, and the chunk's copy is always null.
        set: { code: chunk.code, position: chunk.position, isActive: chunk.isActive },
      });

    const vector = searchVectorFor('it', chunk.name.it, chunk.description) as unknown as string;

    await db
      .insert(categoryTranslations)
      .values({
        categoryId: chunk.id,
        languageCode: 'it',
        name: chunk.name.it,
        description: chunk.description,
        slug: chunk.slug,
        searchVector: vector,
      })
      .onConflictDoUpdate({
        target: [categoryTranslations.categoryId, categoryTranslations.languageCode],
        set: {
          name: chunk.name.it,
          description: chunk.description,
          slug: chunk.slug,
          searchVector: vector,
        },
      });
  });
}

async function writeCategorySpecs(db: Database, plan: LoadPlan): Promise<void> {
  await runPhase('category_specs', plan.specs, async (chunk) => {
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
  });
}

async function writeProducts(db: Database, plan: LoadPlan): Promise<void> {
  await runPhase('products', plan.products, async (chunk) => {
    const body = chunk.translation;
    await db
      .insert(products)
      .values({
        id: chunk.id,
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
        // the addons already priced against it.
        set: {
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
  });
}

/** Spec values, plus the option join rows that make select facets index-backed. */
async function writeSpecValues(db: Database, plan: LoadPlan): Promise<void> {
  await runPhase('spec_values', plan.specValues, async (chunk) => {
    const numbers = {
      numberValue: chunk.numberValue === null ? null : String(chunk.numberValue),
      numberMin: chunk.numberMin === null ? null : String(chunk.numberMin),
      numberMax: chunk.numberMax === null ? null : String(chunk.numberMax),
    };

    await db
      .insert(productSpecValues)
      .values({
        productId: chunk.productId,
        specId: chunk.specId,
        ...numbers,
        booleanValue: chunk.booleanValue,
        textValue: chunk.textValue,
      })
      .onConflictDoUpdate({
        target: [productSpecValues.productId, productSpecValues.specId],
        set: { ...numbers, booleanValue: chunk.booleanValue, textValue: chunk.textValue },
      });

    for (const optionId of chunk.optionIds) {
      await db
        .insert(productSpecValueOptions)
        .values({ productId: chunk.productId, specId: chunk.specId, optionId })
        .onConflictDoNothing();
    }
  });
}

async function writeAddons(db: Database, plan: LoadPlan): Promise<void> {
  const bound = plan.addons.flatMap((chunk) =>
    chunk.productIds.map((productId) => ({ chunk, productId })),
  );

  await runPhase('product_addons', bound, async ({ chunk, productId }) => {
    const product = plan.products.find((item) => item.id === productId);
    if (!product) return;
    await db
      .insert(productAddons)
      .values({
        id: chunk.productIds.length === 1 ? chunk.id : undefined,
        productId,
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
  });
}
