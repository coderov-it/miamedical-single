/**
 * The owner's pricing rules, as one function.
 *
 * This is the only implementation. The storefront calls it to show the customer
 * an estimate; the server calls it to price the order it stores. Two copies of a
 * pricing rule is one too many — and the pair that matters most is the figure on
 * the confirm screen against the figure written to `orders.total`.
 *
 * The rules, in the owner's words:
 *
 *   - A rental IS its package. The package price is the price of the rental for
 *     the package's duration — not a discount off a daily rate, because there is
 *     no daily rate. Nothing here derives an amount the back office did not type.
 *   - Variants add FLAT. The package is the base and a modifier goes on top of it
 *     once, never multiplied by the duration. A matched SKU's price override is a
 *     fixed-mode idea and is ignored on a rental.
 *   - An add-on is priced on its own terms: its quantity times, for a rental-mode
 *     add-on, the package duration read in the add-on's unit. A 3,00 €/giorno
 *     add-on on a 9-day package is 27,00 €.
 *   - No package means no price. There is no open-ended rental and no per-unit
 *     fallback, so a rental request without one is refused rather than quoted.
 *
 * Labels are deliberately absent. `lines` describes WHAT each row is; the Italian
 * words for it live with the page that renders them, so this package holds no
 * copy and the server needs no storefront catalogue to price an order.
 */

import { convertDuration } from './period.ts';
import { ZERO, addMoney, isZero, mulMoney, sumMoney } from './money.ts';

export type PricingMode = 'fixed' | 'rental';
export type RentalUnit = 'hour' | 'day';

/** How many of one add-on a single line may carry when the back office set no cap. */
export const MAX_ADDON_QUANTITY = 10;

/**
 * One resolved variant-group choice's price effect. A flat amount in both modes.
 * May be negative — "cheaper without the headboard".
 */
export interface PriceModifier {
  amount: string;
  /**
   * The group is part of the SKU matrix, so a matched SKU's own price already
   * carries this amount and it must not be added a second time. Numeric groups
   * (value × per-unit modifier) never join the matrix and are always `false`.
   * Only consulted in `fixed` mode, where a SKU price exists to collide with.
   */
  affectsSku: boolean;
}

export interface PriceAddon {
  /** A `rental` add-on multiplies by the package duration; a `fixed` one does not. */
  mode: PricingMode;
  price: string;
  /** The unit `price` is quoted in. Set exactly when `mode` is `rental`. */
  rentalUnit?: RentalUnit | null;
  /** How many the customer asked for. Already clamped to the add-on's own bounds. */
  quantity: number;
}

export interface PricePackage {
  unit: RentalUnit;
  duration: number;
  price: string;
}

export interface PriceRequestInput {
  mode: PricingMode;
  /** What a fixed product costs. `null` on a rental, which has no rate. */
  basePrice: string | null;
  /**
   * The matched SKU's own price, when the selection pinned one. It already
   * carries every sku-affecting modifier — and any override the operator typed,
   * which is precisely why it wins over recomputing base + modifiers. Fixed
   * mode only: a rental's price is its package, so there is nothing to override.
   */
  skuPrice?: string | null;
  modifiers?: readonly PriceModifier[];
  /** Required on a rental. Its absence is what `incomplete` reports. */
  rentalPackage?: PricePackage | null;
  quantity: number;
  addons?: readonly PriceAddon[];
}

/** A row of the estimate, as a fact rather than a sentence. */
export type PriceLine =
  | { kind: 'base'; amount: string }
  | { kind: 'package'; amount: string; units: number; unit: RentalUnit }
  /** Every variant modifier, summed. Omitted when the choices cost nothing. */
  | { kind: 'variants'; amount: string }
  | {
      kind: 'addon';
      index: number;
      amount: string;
      quantity: number;
      /** Rental-mode add-ons only: the package duration in the add-on's unit. */
      units: number | null;
      /** Free with the rental — shown as "incluso", never as "0,00 €". */
      included: boolean;
    }
  | { kind: 'quantity'; quantity: number };

export interface PricedRequest {
  /**
   * What one of this line costs before add-ons: the fixed price, or the chosen
   * package plus its flat modifiers.
   */
  unitRate: string;
  /** The chosen package's duration. `null` on a fixed product. */
  units: number | null;
  /**
   * A rental with no package picked. `total` is `0.00` and means nothing — the
   * server refuses such a line, and the storefront shows the packages instead of
   * a price. This is the only unpriceable state left.
   */
  incomplete: boolean;
  lines: PriceLine[];
  /** Everything folded in, quantity applied. */
  total: string;
}

/**
 * What one of this line costs before add-ons.
 *
 * Exported because the caller stores it on the order line: `unitPrice` is this
 * figure, while the line total also carries the add-ons, so the two are
 * deliberately not `total / quantity`.
 */
export function resolveUnitRate(input: PriceRequestInput): string {
  const modifiers = input.modifiers ?? [];

  if (input.mode === 'rental') {
    const pkg = input.rentalPackage ?? null;
    if (!pkg) return ZERO;
    // Every modifier, flat and once. No SKU price to collide with, so
    // `affectsSku` has nothing to say here.
    return addMoney(pkg.price, ...modifiers.map((entry) => entry.amount));
  }

  if (input.skuPrice != null) {
    const outside = modifiers.filter((entry) => !entry.affectsSku).map((entry) => entry.amount);
    return addMoney(input.skuPrice, ...outside);
  }

  return addMoney(input.basePrice ?? ZERO, ...modifiers.map((entry) => entry.amount));
}

export function priceRequest(input: PriceRequestInput): PricedRequest {
  const isRental = input.mode === 'rental';
  const pkg = isRental ? (input.rentalPackage ?? null) : null;
  const incomplete = isRental && pkg === null;
  const units = pkg ? pkg.duration : null;

  if (incomplete) {
    return { unitRate: ZERO, units: null, incomplete: true, lines: [], total: ZERO };
  }

  const rate = resolveUnitRate(input);
  const lines: PriceLine[] = [];
  let total = rate;

  if (pkg) {
    lines.push({ kind: 'package', amount: pkg.price, units: pkg.duration, unit: pkg.unit });
    const variants = sumMoney((input.modifiers ?? []).map((entry) => entry.amount));
    if (!isZero(variants)) lines.push({ kind: 'variants', amount: variants });
  } else {
    lines.push({ kind: 'base', amount: rate });
  }

  for (const [index, addon] of (input.addons ?? []).entries()) {
    const billed =
      addon.mode === 'rental' && pkg
        ? convertDuration(pkg.duration, pkg.unit, addon.rentalUnit ?? pkg.unit)
        : null;

    if (isZero(addon.price)) {
      lines.push({
        kind: 'addon',
        index,
        amount: ZERO,
        quantity: addon.quantity,
        units: billed,
        included: true,
      });
      continue;
    }

    const amount = mulMoney(addon.price, addon.quantity * (billed ?? 1));
    total = addMoney(total, amount);
    lines.push({
      kind: 'addon',
      index,
      amount,
      quantity: addon.quantity,
      units: billed,
      included: false,
    });
  }

  total = mulMoney(total, input.quantity);
  if (input.quantity > 1) lines.push({ kind: 'quantity', quantity: input.quantity });

  return { unitRate: rate, units, incomplete: false, lines, total };
}
