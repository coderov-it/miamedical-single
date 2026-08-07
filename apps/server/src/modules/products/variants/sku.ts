import type { VariantGroupWithOptions, VariantOptionRow } from '../types.ts';

/**
 * The SKU matrix generator — pure functions, no IO.
 *
 * A SKU is a stock-keeping unit: a physically distinct item counted
 * separately in the warehouse. Only groups with `affectsSku` (single_select /
 * boolean) join the cartesian product; free-text and numeric variants shape
 * the order, not the shelf.
 */

/** Base32 without I/O/0/1 — nothing that misreads on a printed label. */
const SUFFIX_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * 4 chars of stability, not uniqueness — `unique(product_id, combo_key)` and
 * the unique `base_sku` already guarantee that. The suffix freezes the SKU
 * string for life: renaming an option's `sku_code` later must not silently
 * change identifiers on printed labels, quotes and past order lines.
 */
export function randomSuffix(length = 4): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += SUFFIX_ALPHABET[Math.floor(Math.random() * SUFFIX_ALPHABET.length)];
  }
  return out;
}

/** Canonical identity of a combination: sorted option ids, joined. */
export function comboKeyOf(optionIds: string[]): string {
  return [...optionIds].sort().join(':');
}

export interface SkuCombination {
  optionIds: string[];
  comboKey: string;
  /** `[skuCode|VALUE]` per option, product order. Suffix appended later. */
  codes: string[];
}

/** Cartesian product of the SKU-affecting groups' options. */
export function generateCombinations(groups: VariantGroupWithOptions[]): SkuCombination[] {
  const skuGroups = groups
    .filter((group) => group.affectsSku && group.options.length > 0)
    .sort((a, b) => a.position - b.position);
  if (skuGroups.length === 0) return [];

  let combos: VariantOptionRow[][] = [[]];
  for (const group of skuGroups) {
    const sorted = [...group.options].sort((a, b) => a.position - b.position);
    combos = combos.flatMap((combo) => sorted.map((option) => [...combo, option]));
  }

  return combos.map((options) => ({
    optionIds: options.map((option) => option.id),
    comboKey: comboKeyOf(options.map((option) => option.id)),
    codes: options.map((option) => option.skuCode ?? option.value.toUpperCase().slice(0, 6)),
  }));
}

export function composeSku(baseSku: string, codes: string[], suffix: string): string {
  return [baseSku, ...codes, suffix].join('-');
}
