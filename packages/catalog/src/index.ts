/**
 * The catalogue package: the authoring API in `lib/`, the catalogue itself in
 * `data/`, and the script that writes it to PostgreSQL in `script/`.
 *
 * All three live together because they are one purpose — the same reason
 * `@mia/db` holds both the schema and the CLI that applies it.
 *
 * `pnpm check` runs `tsc --noEmit` over the whole package, so every spec key,
 * option value, money amount and misspelled field in the entire catalogue is a
 * build error rather than something a sync run discovers against a live
 * database.
 */

// --- the authoring API ------------------------------------------------------
export { defineCategory, defineTerms, type CategoryBuilder } from './lib/define.ts';
export { defineSpec, spec, specGroup } from './lib/spec.ts';
export { parseDecimal, parseMoney, parseSpecNumber } from './lib/money.ts';
export type * from './lib/types.ts';

// --- the catalogue ----------------------------------------------------------
export { categories, termsDocuments } from './data/index.ts';
