/**
 * Hand-written catalogue → PostgreSQL and R2.
 *
 *   pnpm --filter @mia/server catalog:import -- --dry-run
 *                                        validate and report, write nothing
 *   pnpm --filter @mia/server catalog:import -- --skip-media
 *                                        rows only, no encoding and no uploads
 *   pnpm --filter @mia/server catalog:import -- --only=carrozzine
 *                                        one category file and nothing else
 *   pnpm --filter @mia/server catalog:import -- --assets=/mnt/photos
 *                                        take the images from somewhere else
 *
 * Idempotent by construction: every id is a UUIDv5 of the `code` in the JSON,
 * so a second run updates the same rows instead of duplicating them. Edit a
 * file, run again, and only what changed changes — which also makes an
 * interrupted run resumable by repeating it.
 *
 * This file is the plan: flags, scope, order, and what the run says out loud.
 * The work lives next door — `read`, `plan-category`, `validate`, `conflicts`,
 * `rows`, `rows-details`, `media`.
 *
 * The format itself is documented in docs/code/catalog-import.md.
 */
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDatabase } from '@mia/db';

import { env } from '../../src/config/env.ts';
import { preflight } from './conflicts.ts';
import { countObjects, loadMedia } from './media.ts';
import { planCatalog } from './plan-category.ts';
import type { CatalogPlan } from './planned.ts';
import { CatalogReadError, readCatalogFiles } from './read.ts';
import { writeCategories } from './rows.ts';
import { writeDetails } from './rows-details.ts';
import { validatePlan } from './validate.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../../..');

const argv = process.argv.slice(2);
const has = (flag: string): boolean => argv.includes(flag);
const value = (name: string): string | undefined =>
  argv.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);

const DRY_RUN = has('--dry-run');
const SKIP_MEDIA = has('--skip-media');
const CATALOG_DIR = resolveDir(value('--catalog') ?? 'docs/catalog');
const ASSETS_DIR = resolveDir(value('--assets') ?? 'docs/assets/catalog');
const ONLY = new Set(
  (value('--only') ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean),
);

const db = createDatabase({ url: env.DATABASE_URL, logger: false });

async function main(): Promise<void> {
  const files = readCatalogFiles(CATALOG_DIR, ONLY);
  const plan = planCatalog(files, ASSETS_DIR);

  console.log(`catalog              ${CATALOG_DIR}`);
  console.log(`assets               ${ASSETS_DIR}`);
  console.log(`scope                ${ONLY.size > 0 ? [...ONLY].join(', ') : 'every file'}`);
  console.log(
    `mode                 ${DRY_RUN ? 'DRY RUN' : 'WRITE'}${SKIP_MEDIA ? ' +skip-media' : ''}\n`,
  );

  const problems = validatePlan(plan);
  if (problems.length > 0) {
    report('validation failed', problems);
    console.error('\nNothing was written. Fix the files and run again.');
    process.exit(1);
  }
  console.log('validation           every file passes the API schemas');

  const { conflicts, orphans } = await preflight(db, plan);
  if (conflicts.length > 0) {
    report('conflicts with rows already in the database', conflicts);
    console.error('\nNothing was written.');
    process.exit(1);
  }

  announceDerivedSlugs(plan);
  if (orphans.length > 0) {
    console.log(
      `\northans              ${orphans.length} in the database, in no file — NOT deleted:`,
    );
    for (const orphan of orphans.slice(0, 20)) console.log(`  ${orphan}`);
    if (orphans.length > 20) console.log(`  … and ${orphans.length - 20} more`);
  }

  if (DRY_RUN) {
    printPlan(plan);
    await db.$client.end();
    return;
  }

  console.log('');
  const counts = await writeCategories(db, plan);
  console.log(
    `categories           ${counts.categories} (${counts.categoryTranslations} translations)`,
  );
  console.log(`category_specs       ${counts.specs} (${counts.specOptions} options)`);
  console.log(
    `products             ${counts.products} (${counts.productTranslations} translations)`,
  );

  const details = await writeDetails(db, plan);
  console.log(`spec values          ${details.specValues}`);
  console.log(`addons               ${details.addons}`);
  console.log(`faqs                 ${details.faqs}`);
  console.log(`questions            ${details.questions}`);

  const removed = counts.deletedSpecs + counts.deletedSpecOptions + details.deleted;
  if (removed > 0) {
    console.log(`removed              ${removed} row(s) the files no longer list`);
  }

  if (SKIP_MEDIA) {
    console.log('\nmedia                skipped (--skip-media)');
  } else {
    const total = countObjects(plan);
    console.log(`\nmedia                ${total} object(s) to check in R2`);
    const stats = await loadMedia(db, plan, logObject(total));
    console.log(
      `media                ${stats.uploaded} uploaded, ${stats.reused} already there, ${stats.failed} failed`,
    );
    if (stats.failed > 0) {
      console.log('                     rows are written; re-run to retry the failures');
    }
  }

  await db.$client.end();
  console.log('\nDone.');
}

/**
 * A slug is a public URL. One the run had to invent from a title is printed
 * every time, because "it appeared in the database and nobody chose it" is how
 * a catalogue ends up with URLs nobody can change later without a redirect.
 */
function announceDerivedSlugs(plan: CatalogPlan): void {
  const derived: string[] = [];
  for (const category of plan.categories) {
    for (const [lang, translation] of Object.entries(category.translations)) {
      if (translation.slugDerived) derived.push(`${category.code} (${lang}) → ${translation.slug}`);
    }
  }
  for (const product of plan.products) {
    for (const [lang, translation] of Object.entries(product.translations)) {
      if (translation.slugDerived) derived.push(`${product.code} (${lang}) → ${translation.slug}`);
    }
  }
  if (derived.length === 0) return;

  console.log(`slugs derived        ${derived.length} not pinned in a file:`);
  for (const line of derived.slice(0, 20)) console.log(`  ${line}`);
  if (derived.length > 20) console.log(`  … and ${derived.length - 20} more`);
}

function printPlan(plan: CatalogPlan): void {
  const sum = (pick: (product: (typeof plan.products)[number]) => number): number =>
    plan.products.reduce((total, product) => total + pick(product), 0);

  console.log('\nwould write:');
  console.log(`  categories             ${plan.categories.length}`);
  console.log(
    `  category_translations  ${plan.categories.reduce((n, c) => n + Object.keys(c.translations).length, 0)}`,
  );
  console.log(
    `  category_specs         ${plan.categories.reduce((n, c) => n + c.specs.length, 0)}`,
  );
  console.log(
    `  category_spec_options  ${plan.categories.reduce((n, c) => n + c.specs.reduce((m, s) => m + s.options.length, 0), 0)}`,
  );
  console.log(`  products               ${plan.products.length}`);
  console.log(
    `  product_translations   ${sum((product) => Object.keys(product.translations).length)}`,
  );
  console.log(`  product_spec_values    ${sum((product) => product.specValues.length)}`);
  console.log(`  product_addons         ${sum((product) => product.addons.length)}`);
  console.log(`  product_faqs           ${sum((product) => product.faqs.length)}`);
  console.log(`  product_questions      ${sum((product) => product.questions.length)}`);
  console.log(`  R2 objects             ${SKIP_MEDIA ? 0 : countObjects(plan)}`);
  console.log('\nDry run — nothing written.');
}

function report(headline: string, lines: string[]): void {
  console.error(`\n${lines.length} ${headline}:\n`);
  for (const line of lines.slice(0, 60)) console.error(`  ${line}`);
  if (lines.length > 60) console.error(`  … and ${lines.length - 60} more`);
}

/** `[  12/240] up    products/…/1a2b3c4d-carrozzina.webp   84 kB` */
function logObject(total: number) {
  let seen = 0;
  const width = String(total).length;
  return (verb: 'up' | 'reuse' | 'fail', subject: string, detail?: string): void => {
    seen += 1;
    const counter = `[${String(seen).padStart(width)}/${total}]`;
    const line = `${counter} ${verb.padEnd(5)} ${subject}${detail ? `   ${detail}` : ''}`;
    if (verb === 'fail') console.error(line);
    else console.log(line);
  };
}

function resolveDir(path: string): string {
  return isAbsolute(path) ? path : join(ROOT, path);
}

await main().catch(async (error: unknown) => {
  if (error instanceof CatalogReadError) console.error(`\n${error.message}`);
  else console.error('\nImport failed:', error);
  await db.$client.end().catch(() => undefined);
  process.exit(1);
});
