/**
 * Reading `docs/catalog/*.json` off disk. Parsing only — no defaults, no ids,
 * no coercion; that is `plan.ts`.
 *
 * Files whose name starts with `_` are templates and are never loaded, which is
 * what lets `_example.json` live beside the real ones.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import type { AuthoredCategory } from './authored.ts';

export interface CatalogFile {
  /** File name without the extension — reported in every error message. */
  name: string;
  path: string;
  category: AuthoredCategory;
}

export class CatalogReadError extends Error {}

/**
 * Every catalogue file in `dir`, sorted by name, narrowed to `only` when it is
 * non-empty. `only` matches the category `code`, not the file name — the code
 * is what the rest of the tool and the database key on.
 */
export function readCatalogFiles(dir: string, only: Set<string>): CatalogFile[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    throw new CatalogReadError(`No catalogue directory at ${dir}.`);
  }

  const files = entries
    .filter((entry) => entry.endsWith('.json') && !entry.startsWith('_'))
    .sort()
    .map((entry) => parseFile(join(dir, entry)));

  if (files.length === 0) {
    throw new CatalogReadError(`No catalogue files in ${dir} (files starting with _ are skipped).`);
  }

  const duplicate = firstDuplicateCode(files);
  if (duplicate) {
    throw new CatalogReadError(
      `Two files declare the category code "${duplicate}". A code identifies one category.`,
    );
  }

  if (only.size === 0) return files;

  const known = new Set(files.map((file) => file.category.code));
  const unknown = [...only].filter((code) => !known.has(code));
  if (unknown.length > 0) {
    throw new CatalogReadError(
      `Unknown category code(s): ${unknown.join(', ')}\nKnown: ${[...known].sort().join(', ')}`,
    );
  }
  return files.filter((file) => only.has(file.category.code));
}

function parseFile(path: string): CatalogFile {
  const name = basename(path, '.json');
  let category: AuthoredCategory;
  try {
    category = JSON.parse(readFileSync(path, 'utf8')) as AuthoredCategory;
  } catch (error) {
    throw new CatalogReadError(`${name}.json is not valid JSON — ${(error as Error).message}`);
  }
  if (typeof category?.code !== 'string' || category.code.length === 0) {
    throw new CatalogReadError(`${name}.json has no "code". Every category file needs one.`);
  }
  return { name, path, category };
}

function firstDuplicateCode(files: CatalogFile[]): string | undefined {
  const seen = new Set<string>();
  for (const file of files) {
    if (seen.has(file.category.code)) return file.category.code;
    seen.add(file.category.code);
  }
  return undefined;
}
