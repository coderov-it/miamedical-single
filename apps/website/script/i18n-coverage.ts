/**
 * How much of the storefront's UI copy each locale has.
 *
 * `translate()` falls back to the source language for a missing key, which is
 * what lets a newly registered language go live with correct URLs and
 * translated database content while its chrome is still being written. The cost
 * of that safety is that a gap is silent — so this makes it a number.
 *
 * Run: pnpm --filter @mia/website run i18n:coverage
 * Add --list to print the missing keys for every incomplete locale.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { LANGUAGES, SOURCE_LANGUAGE } from '@mia/validators/language';

type Messages = Record<string, string>;

function load(code: string): Messages | null {
  try {
    const path = fileURLToPath(new URL(`../src/i18n/${code}.json`, import.meta.url));
    return JSON.parse(readFileSync(path, 'utf8')) as Messages;
  } catch {
    return null;
  }
}

const source = load(SOURCE_LANGUAGE);
if (!source) throw new Error(`No ${SOURCE_LANGUAGE}.json — the source catalogue must exist.`);
const sourceKeys = Object.keys(source);

const list = process.argv.includes('--list');
let incomplete = 0;

console.log(`\n  ${sourceKeys.length} keys in ${SOURCE_LANGUAGE}.json\n`);

for (const language of LANGUAGES) {
  if (language.code === SOURCE_LANGUAGE) continue;

  const target = load(language.code);
  const missing = target
    ? sourceKeys.filter((key) => target[key] === undefined || target[key] === '')
    : sourceKeys;
  const done = sourceKeys.length - missing.length;
  const pct = Math.round((done / sourceKeys.length) * 100);
  const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '·');

  console.log(
    `  ${language.code}  ${bar}  ${String(pct).padStart(3)}%  ${done}/${sourceKeys.length}` +
      (target ? '' : '  (no file yet — falls back to source)'),
  );

  if (missing.length > 0) {
    incomplete += 1;
    if (list) for (const key of missing) console.log(`        ${key}`);
  }

  /* Keys the target has that the source does not: a rename left one behind, and
     it will never render because `translate()` looks the source up first. */
  if (target) {
    const orphans = Object.keys(target).filter((key) => source[key] === undefined);
    if (orphans.length > 0) {
      console.log(`      ${orphans.length} orphaned key(s) not in ${SOURCE_LANGUAGE}.json:`);
      for (const key of orphans) console.log(`        ${key}`);
    }
  }
}

console.log(
  incomplete === 0
    ? '\n  Every locale is complete.\n'
    : `\n  ${incomplete} locale(s) incomplete. Pages render, missing keys fall back to ${SOURCE_LANGUAGE}.\n`,
);
