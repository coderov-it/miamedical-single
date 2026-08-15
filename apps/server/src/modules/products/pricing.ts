import { addMoney, asMoney } from '@mia/pricing';

import type { SkuWithOptions, VariantGroupWithOptions } from './types.ts';

/**
 * What one SKU of a FIXED product costs, shared by the public and admin mappers:
 *
 *   unit price = priceOverride
 *              ?? basePrice + Σ selected option priceModifier
 *
 * (Numeric variants — value × priceModifierPerUnit — price at order time,
 * once a value exists; they never join the SKU matrix.) Everything runs
 * through money.ts in bigint hundredths, never JS floats.
 *
 * A rental has no such figure. Its price is whichever package the customer
 * picks, with the variant modifiers added flat on top — a per-combination price
 * would be a second answer to a question the package already answers. So a null
 * `basePrice`, which is exactly how a rental product stores itself, returns
 * null rather than inventing a rate out of the modifiers alone.
 */
export function resolveSkuPrice(
  basePrice: string | null,
  sku: Pick<SkuWithOptions, 'priceOverride' | 'options'>,
  groups: VariantGroupWithOptions[],
): string | null {
  if (basePrice === null) return null;

  // `asMoney` here and below: options and SKUs arrive through a JSON-aggregated
  // relation, so their numerics have already been flattened to JS numbers.
  if (sku.priceOverride !== null) return asMoney(sku.priceOverride);

  const modifierByOptionId = new Map<string, string>();
  for (const group of groups) {
    for (const option of group.options) {
      modifierByOptionId.set(option.id, asMoney(option.priceModifier));
    }
  }

  const modifiers = sku.options.map((link) => modifierByOptionId.get(link.optionId) ?? '0.00');
  return addMoney(asMoney(basePrice), ...modifiers);
}
