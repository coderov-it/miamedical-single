/**
 * The hand-authored catalogue in `src/data/` → PostgreSQL and R2.
 *
 *   pnpm catalog:sync --dry-run          validate and report, write nothing
 *   pnpm catalog:sync --skip-media       rows only, no encoding and no uploads
 *   pnpm catalog:sync --only=wheelchairs one category and nothing else
 *   pnpm catalog:sync --assets=/mnt/pics take the images from somewhere else
 *
 * The source is `data/index.ts` — TypeScript values, not files read off disk.
 * That is the difference from the JSON importer this replaces: a misspelled
 * spec key, a rental product carrying a `basePrice`, an option value the
 * category never declared are all compile errors under `pnpm check`, hours
 * before a database is involved. What is left for this script is what the
 * compiler cannot see — lengths, uniqueness across the whole registry, rows
 * already in the table, and whether the photos exist.
 *
 * Idempotent by construction: every id is a UUIDv5 of a hand-written `code`, so
 * a second run updates the same rows instead of duplicating them. Edit a file,
 * run again, and only what changed changes — which also makes an interrupted
 * run resumable by repeating it.
 *
 * This file is the plan: flags, scope, order, and what the run says out loud.
 * The work lives next door — `plan`, `validate`, `conflicts`, `rows`,
 * `rows-details`, `rows-terms`, `media`. Documented in
 * docs/code/catalog-sync.md.
 */
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDatabase } from '@mia/db';

import { categories, termsDocuments } from '../../data/index.ts';
import { preflight } from './conflicts.ts';
import { countObjects, loadMedia } from './media.ts';
import { planCatalog } from './plan.ts';
import type { CatalogPlan } from './planned.ts';
import { announceDerivedSlugs, list, objectLogger, printPlan, report } from './report.ts';
import { writeCategories } from './rows.ts';
import { writeDetails } from './rows-details.ts';
import { writeTerms, writeTermsLinks } from './rows-terms.ts';
import { validatePlan } from './validate.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../../../..');

const argv = process.argv.slice(2);
const has = (flag: string): boolean => argv.includes(flag);
const value = (name: string): string | undefined =>
  argv.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);

const DRY_RUN = has('--dry-run');
const SKIP_MEDIA = has('--skip-media');
const ASSETS_DIR = resolveDir(value('--assets') ?? 'docs/assets/catalog');
const ONLY = new Set(
  (value('--only') ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean),
);

const db = createDatabase({ logger: false });

async function main(): Promise<void> {
  const scoped = scope();
  const plan = planCatalog({ categories: scoped, terms: termsDocuments, assetsRoot: ASSETS_DIR });

  console.log(`source               src/data (${String(categories.length)} categories listed)`);
  console.log(`assets               ${ASSETS_DIR}`);
  console.log(`scope                ${ONLY.size > 0 ? [...ONLY].join(', ') : 'every category'}`);
  console.log(
    `mode                 ${DRY_RUN ? 'DRY RUN' : 'WRITE'}${SKIP_MEDIA ? ' +skip-media' : ''}\n`,
  );

  const problems = validatePlan(plan);
  if (problems.length > 0) {
    report('validation failed', problems);
    console.error('\nNothing was written. Fix the data files and run again.');
    process.exit(1);
  }
  console.log('validation           every value passes the API schemas');

  const { conflicts, orphans } = await preflight(db, plan);
  if (conflicts.length > 0) {
    report('conflicts with rows already in the database', conflicts);
    console.error('\nNothing was written.');
    process.exit(1);
  }

  announceDerivedSlugs(plan);
  list('orphans', orphans);
  if (orphans.length > 0) console.log('                     NOT deleted — a person decides.');

  if (DRY_RUN) {
    printPlan(plan, SKIP_MEDIA ? 0 : countObjects(plan));
    return;
  }

  await write(plan);
}

/**
 * Terms documents go in FIRST and their product links LAST: a document has to
 * exist before `product_terms` can reference it, and a product has to exist
 * before it can sign one.
 */
async function write(plan: CatalogPlan): Promise<void> {
  console.log('');

  const terms = await writeTerms(db, plan);
  console.log(
    `terms_documents      ${String(terms.documents)} (${String(terms.translations)} translations)`,
  );

  const counts = await writeCategories(db, plan);
  console.log(
    `categories           ${String(counts.categories)} (${String(counts.categoryTranslations)} translations)`,
  );
  console.log(
    `category_specs       ${String(counts.specs)} (${String(counts.specOptions)} options)`,
  );
  console.log(
    `products             ${String(counts.products)} (${String(counts.productTranslations)} translations)`,
  );

  const details = await writeDetails(db, plan);
  console.log(`spec values          ${String(details.specValues)}`);
  console.log(`addons               ${String(details.addons)}`);
  console.log(`faqs                 ${String(details.faqs)}`);
  console.log(`questions            ${String(details.questions)}`);

  const links = await writeTermsLinks(db, plan);
  console.log(`product_terms        ${String(links.links)}`);

  const removed =
    counts.deletedSpecs +
    counts.deletedSpecOptions +
    details.deleted +
    terms.deleted +
    links.deleted;
  if (removed > 0) {
    console.log(`removed              ${String(removed)} row(s) the data files no longer list`);
  }

  if (SKIP_MEDIA) {
    console.log('\nmedia                skipped (--skip-media)');
    return;
  }

  const total = countObjects(plan);
  console.log(`\nmedia                ${String(total)} object(s) to check in R2`);
  const stats = await loadMedia(db, plan, objectLogger(total));
  console.log(
    `media                ${String(stats.uploaded)} uploaded, ${String(stats.reused)} already there, ${String(stats.failed)} failed`,
  );
  if (stats.failed > 0) {
    console.log('                     rows are written; re-run to retry the failures');
  }
}

/**
 * `--only` narrows by category `code`, not by folder name — the code is what
 * the rest of the tool and the database key on. An unknown one is refused
 * rather than silently matching nothing, which would otherwise read as "that
 * category has no products".
 */
function scope(): readonly (typeof categories)[number][] {
  if (ONLY.size === 0) return categories;

  const known = new Set(categories.map((entry) => entry.input.code));
  const unknown = [...ONLY].filter((code) => !known.has(code));
  if (unknown.length > 0) {
    console.error(`\nUnknown category code(s): ${unknown.join(', ')}`);
    console.error(`Known: ${[...known].sort().join(', ')}`);
    process.exit(1);
  }
  return categories.filter((entry) => ONLY.has(entry.input.code));
}

function resolveDir(path: string): string {
  return isAbsolute(path) ? path : join(ROOT, path);
}

try {
  await main();
  await db.$client.end();
  console.log('\nDone.');
} catch (error) {
  console.error('\nSync failed:', error);
  await db.$client.end().catch(() => undefined);
  process.exit(1);
}
