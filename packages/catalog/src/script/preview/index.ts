/**
 * The catalogue as one HTML page — what the data actually says, with the icons
 * shown and the rich text rendered.
 *
 *   pnpm catalog:preview                    write it, then open it
 *   pnpm catalog:preview --only=wheelchairs one category
 *   pnpm catalog:preview --assets=/photos   take the images from somewhere else
 *   pnpm catalog:preview --out=/tmp/x.html  write it somewhere else
 *
 * Nothing is read from the database and nothing is written to it: the page is
 * built from the same TypeScript objects `pnpm catalog:sync` reads, so it
 * answers "is the data right" without a Postgres or an R2 in the loop.
 *
 * Media refs are resolved exactly as the importer resolves them, and a ref
 * that finds no file is drawn in red AND printed here AND makes the run exit
 * non-zero — the page is still written first, so a broken catalogue is always
 * inspectable rather than merely reported.
 *
 * The default output sits inside the assets root, which is gitignored, so
 * every `src` is a plain relative path and no build or server is involved.
 * Documented in docs/code/catalog-preview.md.
 */
import { writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { categories, termsDocuments } from '../../data/index.ts';
import { renderCategory, type CategoryEntry } from './category.ts';
import { renderPage } from './page.ts';
import { renderTermsPage } from './terms.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../../../..');

const argv = process.argv.slice(2);
const value = (name: string): string | undefined =>
  argv.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);

const resolveDir = (path: string): string => (isAbsolute(path) ? path : join(ROOT, path));

/**
 * Repo-relative when it is inside the repo, absolute when it is not. A
 * `--assets=/tmp/photos` printed as `../../../../../tmp/photos` is a path
 * nobody can paste anywhere.
 */
function display(path: string): string {
  const inside = relative(ROOT, path);
  return inside.startsWith('..') ? path : inside;
}

const ASSETS_DIR = resolveDir(value('--assets') ?? 'docs/assets/catalog');
const OUT_FILE = resolveDir(value('--out') ?? 'docs/assets/catalog/preview.html');
const ONLY = new Set(
  (value('--only') ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean),
);

const known = new Set(categories.map((category) => category.input.code));
const unknown = [...ONLY].filter((code) => !known.has(code));
if (unknown.length > 0) {
  console.error(`Unknown category code(s): ${unknown.join(', ')}`);
  console.error(`Known: ${[...known].sort().join(', ')}`);
  process.exit(1);
}

const selected = ONLY.size === 0 ? categories : categories.filter((c) => ONLY.has(c.input.code));

const entries: CategoryEntry[] = [];
const problems: string[] = [];
const bodies: string[] = [];

for (const category of selected) {
  const rendered = renderCategory(category, ASSETS_DIR);
  bodies.push(rendered.html);
  entries.push(rendered.entry);
  for (const asset of rendered.missing) {
    problems.push(
      `${rendered.entry.code}: "${asset.ref}" — nothing at ${display(asset.sourcePath)}`,
    );
  }
}

const html = renderPage({
  entries,
  problems,
  pages: bodies.join('') + renderTermsPage(termsDocuments),
  assetsRoot: display(ASSETS_DIR),
  generatedAt: new Date(),
});

writeFileSync(OUT_FILE, html, 'utf8');

const products = entries.reduce((total, entry) => total + entry.products.length, 0);
console.log(`categories           ${entries.length.toString()}`);
console.log(`products             ${products.toString()}`);
console.log(`assets               ${display(ASSETS_DIR)}`);
console.log(`written              ${display(OUT_FILE)}`);
console.log(`\nfile://${OUT_FILE}`);

if (problems.length > 0) {
  console.error(`\n${problems.length.toString()} missing file(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('\nThe page was written and marks each one in red.');
  process.exit(1);
}
console.log('\nEvery media ref resolves to a file.');
