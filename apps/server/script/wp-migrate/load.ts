/**
 * Phase two: read the reviewed JSON chunks into PostgreSQL and R2.
 *
 *   pnpm --filter @mia/server wp:load -- --dry-run     validate only, write nothing
 *   pnpm --filter @mia/server wp:load -- --skip-media  rows only, no downloads
 *   pnpm --filter @mia/server wp:load -- --truncate    clear the catalog first
 *   pnpm --filter @mia/server wp:load -- --only-categories=carrozzine
 *                                                      load one category and nothing else
 *
 * Idempotent by construction: every id came from `ids.ts` as a UUIDv5 of the
 * WordPress row, so a second run updates the same rows instead of duplicating
 * them. Edit a chunk, re-run, and only what changed changes — which also makes
 * an interrupted run resumable by repeating it without `--truncate`.
 *
 * This file is the plan: flags, chunks, scope, order. The work lives next door
 * in `load/` — `validate.ts`, `rows.ts`, `media.ts`.
 *
 * Full walkthrough in docs/code/wp-migration.md.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDatabase, sql } from '@mia/db';

import { env } from '../../src/config/env.ts';
import { loadCategoryIcons, loadMedia } from './load/media.ts';
import { writeRows } from './load/rows.ts';
import { validatePlan } from './load/validate.ts';
import type {
  AddonChunk,
  CategoryChunk,
  LoadPlan,
  MediaChunk,
  ProductChunk,
  SpecChunk,
  SpecValueChunk,
  VariantGroupChunk,
} from './types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const IN_DIR = join(HERE, '../../../../docs/migration/wp');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const SKIP_MEDIA = args.has('--skip-media');
const TRUNCATE = args.has('--truncate');

/**
 * Category codes to load, or empty for all of them. The catalog is migrated one
 * category at a time — 15 wheelchairs reviewed and live beat 98 products landing
 * at once — so the filter is applied to every chunk before validation, not
 * during the writes: a scoped run then validates exactly what it will write and
 * its `--dry-run` counts are the real ones.
 */
const ONLY_CATEGORIES = new Set(
  [...args]
    .filter((arg) => arg.startsWith('--only-categories='))
    .flatMap((arg) => arg.slice('--only-categories='.length).split(','))
    .map((code) => code.trim())
    .filter((code) => code.length > 0),
);

const db = createDatabase({ url: env.DATABASE_URL, logger: false });

const read = <T>(name: string): T => JSON.parse(readFileSync(join(IN_DIR, name), 'utf8')) as T;

async function main(): Promise<void> {
  const all: LoadPlan = {
    categories: read<{ categories: CategoryChunk[] }>('01-categories.json').categories,
    specs: read<{ specs: SpecChunk[] }>('02-category-specs.json').specs,
    products: read<{ products: ProductChunk[] }>('03-products.json').products,
    specValues: read<{ specValues: SpecValueChunk[] }>('04-product-specs.json').specValues,
    variantGroups: read<{ variantGroups: VariantGroupChunk[] }>('05-variants.json').variantGroups,
    media: read<{ mediaBaseUrl: string; media: MediaChunk[] }>('06-media.json').media,
    addons: read<{ addons: AddonChunk[] }>('07-addons.json').addons,
  };

  const unknown = [...ONLY_CATEGORIES].filter(
    (code) => !all.categories.some((chunk) => chunk.code === code),
  );
  if (unknown.length > 0) {
    console.error(`Unknown category code(s): ${unknown.join(', ')}`);
    console.error(`Known: ${all.categories.map((chunk) => chunk.code).join(', ')}`);
    process.exit(1);
  }

  const plan = narrow(all);
  announce(all, plan);

  const problems = validatePlan(plan);
  if (problems.length > 0) {
    console.error(`${problems.length} validation problems:\n`);
    for (const problem of problems.slice(0, 60)) console.error(`  ${problem}`);
    if (problems.length > 60) console.error(`  … and ${problems.length - 60} more`);
    console.error('\nNothing was written. Fix the chunks and re-run.');
    process.exit(1);
  }
  console.log('validation           all chunks pass their API schemas');

  const unbound = plan.addons.filter((chunk) => chunk.productIds.length === 0);
  if (unbound.length > 0) {
    console.log(
      `addons               ${unbound.length} unbound, will be SKIPPED (fill productIds to load them)`,
    );
  }

  if (DRY_RUN) {
    printPlan(plan);
    await db.$client.end();
    return;
  }

  if (TRUNCATE) {
    // `admin_users` and `admin_sessions` are deliberately absent: losing them
    // means losing the admin login for no benefit. Orders go because their
    // lines point at SKUs that are about to be replaced.
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
    console.log('truncate             catalog + orders cleared, admin login kept');
  }

  await writeRows(db, plan);

  if (SKIP_MEDIA) {
    console.log('media                skipped (--skip-media)');
  } else {
    /* Announced before it starts, not only summarised after: everything above
       is one statement per row, this is minutes of network. */
    const icons = plan.categories.filter((chunk) => chunk.iconSource !== null).length;
    console.log(`\ncategory icons       ${icons} to check in R2`);
    const iconStats = await loadCategoryIcons(db, plan.categories);
    console.log(
      `category icons       ${iconStats.uploaded} uploaded, ${iconStats.reused} already in R2, ${iconStats.failed} failed`,
    );

    console.log(`\nmedia                ${plan.media.length} objects to check in R2`);
    const stats = await loadMedia(db, plan.media, plan.products);
    console.log(
      `media                ${stats.uploaded} uploaded, ${stats.reused} already in R2, ${stats.failed} failed`,
    );
  }

  await db.$client.end();
  console.log('\nDone.');
}

/** Everything `--only-categories` keeps, cascaded down the chunk graph. */
function narrow(all: LoadPlan): LoadPlan {
  if (ONLY_CATEGORIES.size === 0) return all;

  const categories = all.categories.filter((chunk) => ONLY_CATEGORIES.has(chunk.code));
  const categoryIds = new Set(categories.map((chunk) => chunk.id));
  const products = all.products.filter((chunk) => categoryIds.has(chunk.categoryId));
  const productIds = new Set(products.map((chunk) => chunk.id));

  return {
    categories,
    specs: all.specs.filter((chunk) => categoryIds.has(chunk.categoryId)),
    products,
    specValues: all.specValues.filter((chunk) => productIds.has(chunk.productId)),
    variantGroups: all.variantGroups.filter((chunk) => productIds.has(chunk.productId)),
    media: all.media.filter((chunk) => productIds.has(chunk.productId)),
    // An addon bound to products on both sides of the filter keeps only the
    // ones in scope. One that loses every binding is out of scope and drops
    // out — but an addon that arrived unbound stays, because that is the YITH
    // backlog the run is supposed to keep complaining about.
    addons: all.addons.flatMap((chunk) => {
      const bound = chunk.productIds.filter((id) => productIds.has(id));
      if (chunk.productIds.length > 0 && bound.length === 0) return [];
      return [{ ...chunk, productIds: bound }];
    }),
  };
}

function announce(all: LoadPlan, plan: LoadPlan): void {
  if (ONLY_CATEGORIES.size > 0) {
    console.log(
      `scope: ${plan.categories.map((chunk) => `${chunk.code} (${chunk.name.it})`).join(', ')}\n` +
        `       ${all.products.length - plan.products.length} products in other categories ignored`,
    );
  }
  console.log(
    `Loading ${plan.categories.length} categories, ${plan.products.length} products, ` +
      `${plan.specs.length} specs, ${plan.specValues.length} spec values, ` +
      `${plan.variantGroups.length} variant groups, ${plan.media.length} media, ` +
      `${plan.addons.length} addons`,
  );
  console.log(
    `mode: ${DRY_RUN ? 'DRY RUN' : 'WRITE'}${SKIP_MEDIA ? ' +skip-media' : ''}${TRUNCATE ? ' +truncate' : ''}\n`,
  );
}

function printPlan(plan: LoadPlan): void {
  const skuCount = plan.variantGroups.reduce(
    (sum, group) => sum + (group.affectsSku ? group.options.length : 0),
    0,
  );
  const icons = plan.categories.filter((chunk) => chunk.iconSource !== null).length;
  const bound = plan.addons.filter((chunk) => chunk.productIds.length > 0).length;

  console.log('\nwould write:');
  console.log(`  categories             ${plan.categories.length}`);
  console.log(`  category_translations  ${plan.categories.length}`);
  console.log(`  category_specs         ${plan.specs.length}`);
  console.log(
    `  category_spec_options  ${plan.specs.reduce((sum, chunk) => sum + chunk.options.length, 0)}`,
  );
  console.log(`  products               ${plan.products.length}`);
  console.log(`  product_translations   ${plan.products.length}`);
  console.log(`  product_spec_values    ${plan.specValues.length}`);
  console.log(`  product_variant_groups ${plan.variantGroups.length}`);
  console.log(
    `  product_variant_options ${plan.variantGroups.reduce((sum, group) => sum + group.options.length, 0)}`,
  );
  console.log(`  product_skus           ~${skuCount || plan.products.length}`);
  console.log(`  product_addons         ${bound}`);
  console.log(
    `  R2 objects             ${SKIP_MEDIA ? 0 : plan.media.length + icons}` +
      `${SKIP_MEDIA ? '' : ` (${icons} category icons)`}`,
  );
  console.log('\nDry run — nothing written.');
}

await main().catch(async (error: unknown) => {
  console.error('\nLoad failed:', error);
  await db.$client.end().catch(() => undefined);
  process.exit(1);
});
