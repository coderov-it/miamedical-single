/**
 * Which SKU a set of variant choices pins.
 *
 * Shared for the same reason as the pricing rules: a matched SKU can carry a
 * `priceOverride`, so the storefront and the server have to agree on *whether*
 * one matched before they can agree on the price.
 */

/**
 * The part of a SKU that decides identity — `PublicSkuDto`, structurally, minus
 * its price. Matching is about which combination the customer chose; what that
 * combination costs is read off the matched row by the caller.
 */
export interface SkuCandidate {
  id: string;
  sku: string;
  /** `{ groupKey: optionValue }` for the combination this SKU materialises. */
  options: Record<string, string>;
  isActive: boolean;
}

/**
 * The SKU whose combination the customer chose, or `null`.
 *
 * `selected` holds only the sku-affecting groups. A partial selection — an
 * optional group nobody filled in — pins nothing and returns `null`, which
 * prices the line from the base rate plus modifiers instead of guessing at a
 * SKU the customer never chose.
 */
export function matchSku<T extends SkuCandidate>(
  skus: readonly T[],
  selected: Record<string, readonly string[]>,
): T | null {
  const groupCount = Object.keys(selected).length;
  if (groupCount === 0) return null;

  const matches = skus.filter((sku) => {
    const entries = Object.entries(sku.options);
    if (entries.length !== groupCount) return false;
    return entries.every(([groupKey, value]) => selected[groupKey]?.includes(value) === true);
  });

  // An inactive SKU still identifies the combination, so it is used as a last
  // resort: losing the SKU reference would lose the line's identity entirely.
  return matches.find((sku) => sku.isActive) ?? matches[0] ?? null;
}
