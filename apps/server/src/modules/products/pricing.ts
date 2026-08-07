import { addMoney } from './money.ts';
import type { SkuWithOptions, VariantGroupWithOptions } from './types.ts';

/**
 * The single source of price truth, shared by the public and admin mappers:
 *
 *   unit price = priceOverride
 *              ?? basePrice + Σ selected option priceModifier
 *
 * (Numeric variants — value × priceModifierPerUnit — price at order time,
 * once a value exists; they never join the SKU matrix.) Everything runs
 * through money.ts in bigint hundredths, never JS floats. For a rental
 * product the result is per rental unit; for a fixed one it is one-off. The
 * mode never appears here — modifiers inherit it from the product.
 */
export function resolveSkuPrice(
  basePrice: string,
  sku: Pick<SkuWithOptions, 'priceOverride' | 'options'>,
  groups: VariantGroupWithOptions[],
): string {
  if (sku.priceOverride !== null) return sku.priceOverride;

  const modifierByOptionId = new Map<string, string>();
  for (const group of groups) {
    for (const option of group.options) {
      modifierByOptionId.set(option.id, option.priceModifier);
    }
  }

  const modifiers = sku.options.map((link) => modifierByOptionId.get(link.optionId) ?? '0.00');
  return addMoney(basePrice, ...modifiers);
}
