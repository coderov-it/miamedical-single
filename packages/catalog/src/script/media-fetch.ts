/**
 * Download the product photos the catalogue names, from the live site.
 *
 *   pnpm --filter @mia/catalog media:fetch            everything missing
 *   pnpm --filter @mia/catalog media:fetch wheelchair only matching categories
 *   pnpm --filter @mia/catalog media:fetch --force    re-download what exists
 *
 * The photos are not in git: `docs/assets/catalog/` is gitignored, because
 * after `pnpm catalog:sync` they live in R2 as WebP and that is the copy the
 * storefront serves. What IS committed is `docs/catalog/media-manifest.json`,
 * which maps every file name a product file references to the URL it came from,
 * its WordPress attachment id and its pixel size. This script is the other half
 * of that: it reads the manifest and puts the files where the sync expects them.
 *
 * It is idempotent and safe to re-run: a file already on disk at the right size
 * is skipped unless `--force` is passed, so an interrupted run continues where
 * it stopped rather than starting again.
 */
import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

interface ManifestEntry {
  url: string;
  wordpressId: number;
  width: number | null;
  height: number | null;
  bytes: number | null;
  product: number;
  productSlug: string;
}

interface Manifest {
  files: number;
  categories: Record<string, Record<string, ManifestEntry>>;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../..');
const MANIFEST = join(REPO, 'docs/catalog/media-manifest.json');
const ASSETS = join(REPO, 'docs/assets/catalog');

const args = process.argv.slice(2);
const force = args.includes('--force');
const filter = args.find((a) => !a.startsWith('--'));

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8')) as Manifest;

/**
 * A `Response.body` is a web stream; `pipeline` wants a Node one. Converting
 * rather than buffering keeps a 90 MB run off the heap.
 */
async function download(url: string, to: string): Promise<number> {
  const response = await fetch(url);
  if (!response.ok || !response.body)
    throw new Error(`HTTP ${String(response.status)} for ${url}`);
  mkdirSync(dirname(to), { recursive: true });
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(to));
  return statSync(to).size;
}

let downloaded = 0;
let skipped = 0;
let failed = 0;
let bytes = 0;

for (const [category, files] of Object.entries(manifest.categories)) {
  if (filter && !category.includes(filter)) continue;
  for (const [name, entry] of Object.entries(files)) {
    const target = join(ASSETS, category, name);
    if (!force && existsSync(target) && statSync(target).size > 0) {
      skipped += 1;
      continue;
    }
    try {
      const size = await download(entry.url, target);
      bytes += size;
      downloaded += 1;
      console.log(`  ${category}/${name}  ${(size / 1024).toFixed(0)} KB`);
    } catch (error) {
      failed += 1;
      console.error(`  FAILED ${category}/${name}: ${String(error)}`);
    }
  }
}

console.log(
  `\ndownloaded ${String(downloaded)}, skipped ${String(skipped)}, failed ${String(failed)}` +
    ` — ${(bytes / 1e6).toFixed(1)} MB into ${ASSETS}`,
);
if (failed > 0) process.exitCode = 1;
