/**
 * English key → displayed label, with a fallback to readable English.
 *
 * The project rule is that code is English and only what a human reads is
 * Italian (see the RULES section of AGENTS.md). So a token in a data structure is
 * an English identifier — `'company'`, `'storePickup'` — and the Italian words
 * are looked up here at render time. Nothing in a component or a constant holds
 * an Italian string.
 *
 * How this differs from `enum-labels.ts`, which does the same job for pgEnum
 * members: those catalogs are `satisfies Labels<TheUnion, …>` and deliberately
 * have NO fallback, because appending a member to an enum must fail `tsc` until
 * both languages exist. These catalogs are open-ended UI copy, where a missing
 * translation must degrade rather than break a page — so a key with no entry for
 * the requested language falls back to its English entry, and then to the key
 * itself, humanised.
 *
 * `createLabels()` still keys the returned function to the catalog, so a typo in
 * a key name is a compile error rather than a humanised key on the page.
 */
import type { LanguageCode } from '@mia/validators';

/** One catalog entry. Every language is optional — a gap falls back, see above. */
export type LabelEntry = Partial<Record<LanguageCode, string>>;

export type LabelCatalog = Record<string, LabelEntry>;

/**
 * `sameAddress` / `same-address` / `same_address` → `"Same address"`.
 *
 * The last-resort fallback: a key with no translation at all still renders as
 * English words rather than as a raw identifier.
 */
export function humanizeKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** `"Sede di {city}"` + `{ city: 'Roma' }` → `"Sede di Roma"`. */
function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/**
 * Binds a catalog to a lookup function.
 *
 * The key type is `keyof TCatalog`, so the catalog is the single source of truth
 * for which labels exist and a misspelled key does not compile.
 */
export function createLabels<TCatalog extends LabelCatalog>(catalog: TCatalog) {
  return function label(
    key: keyof TCatalog & string,
    locale: LanguageCode,
    params?: Record<string, string | number>,
  ): string {
    const entry: LabelEntry | undefined = catalog[key];
    const template = entry?.[locale] ?? entry?.en ?? humanizeKey(key);
    return params ? interpolate(template, params) : template;
  };
}
