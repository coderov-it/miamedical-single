/**
 * The owner's rental pricing rules, as one function.
 *
 * This is the only implementation. The storefront calls it to show the customer
 * an estimate; the server calls it to price the order it stores. Two copies of a
 * pricing rule is one too many — and the pair that matters most is the figure on
 * the confirm screen against the figure written to `orders.total`.
 *
 * The rules, in the owner's words:
 *
 *   - On a rental product every modifier and every rental-mode add-on bills PER
 *     RENTAL UNIT, so one duration multiplies every amount.
 *   - A package is a fixed total for a fixed duration, and the configured rate's
 *     excess over the base rate rides on top of it.
 *   - With no return date there is no duration, so the figure is a per-unit RATE,
 *     not a total. One-time amounts are not folded into it — they are a different
 *     quantity and adding them would produce a number that means nothing.
 *
 * Labels are deliberately absent. `lines` describes WHAT each row is; the Italian
 * words for it live with the page that renders them, so this package holds no
 * copy and the server needs no storefront catalogue to price an order.
 */

import { ZERO, addMoney, isZero, mulMoney, subMoney, sumMoney, toHundredths } from './money.ts';

const DAY_MS = 86_400_000;

export type PricingMode = 'fixed' | 'rental';
export type RentalUnit = 'hour' | 'day';

/**
 * One resolved variant-group choice's price effect. On a rental product this is
 * a per-rental-unit amount, per the rule above. May be negative — "cheaper
 * without the headboard".
 */
export interface PriceModifier {
  amount: string;
  /**
   * The group is part of the SKU matrix, so a matched SKU's own price already
   * carries this amount and it must not be added a second time. Numeric groups
   * (value × per-unit modifier) never join the matrix and are always `false`.
   */
  affectsSku: boolean;
}

export interface PriceAddon {
  /** A `rental` add-on follows the product's rental unit; a `fixed` one is one-off. */
  mode: PricingMode;
  price: string;
}

export interface PricePackage {
  unit: RentalUnit;
  duration: number;
  price: string;
}

export interface PriceRequestInput {
  mode: PricingMode;
  rentalUnit: RentalUnit | null;
  basePrice: string;
  /**
   * The matched SKU's own price, when the selection pinned one. It already
   * carries every sku-affecting modifier — and any override the operator typed,
   * which is precisely why it wins over recomputing base + modifiers.
   */
  skuPrice?: string | null;
  modifiers?: readonly PriceModifier[];
  rentalPackage?: PricePackage | null;
  /** ISO `YYYY-MM-DD`, or `''` when unset. */
  startDate?: string;
  endDate?: string;
  quantity: number;
  addons?: readonly PriceAddon[];
}

/**
 * A row of the estimate, as a fact rather than a sentence.
 *
 * `perUnit` marks an amount that is a rate per rental unit, not a total — the
 * renderer has to say so ("/giorno") or the number reads as something it is not.
 */
export type PriceLine =
  | { kind: 'base'; amount: string; perUnit: boolean }
  | { kind: 'duration'; amount: string; units: number }
  | { kind: 'package'; amount: string }
  | { kind: 'packageSaving'; amount: string }
  | {
      kind: 'addon';
      index: number;
      amount: string;
      perUnit: boolean;
      /** Free with the rental — shown as "incluso", never as "0,00 €". */
      included: boolean;
      /** A fixed-mode add-on on a rental product: charged once, not per unit. */
      oneTime: boolean;
    }
  | { kind: 'quantity'; quantity: number };

export interface PricedRequest {
  /** Per rental unit on a rental product; the one-off price on a fixed one. */
  unitRate: string;
  /** Rental units the dates or the package resolve to. `null` = no duration. */
  units: number | null;
  /**
   * No duration could be established, so `total` is a per-unit rate. An order
   * may not be placed in this state — the server rejects it — but the storefront
   * still has to price a product whose return date nobody has picked yet.
   */
  openPeriod: boolean;
  lines: PriceLine[];
  /** Everything folded in, quantity applied. */
  total: string;
}

/**
 * The configured per-unit rate.
 *
 * Exported because the caller stores it on the order line: `unitPrice` is this
 * rate, while the line total also carries the duration and the add-ons, so the
 * two are deliberately not `total / quantity`.
 */
export function resolveUnitRate(input: PriceRequestInput): string {
  const modifiers = input.modifiers ?? [];

  if (input.skuPrice != null) {
    const outside = modifiers.filter((entry) => !entry.affectsSku).map((entry) => entry.amount);
    return addMoney(input.skuPrice, ...outside);
  }

  return addMoney(input.basePrice, ...modifiers.map((entry) => entry.amount));
}

/**
 * How many rental units this request covers, or `null` when nothing establishes
 * a duration.
 *
 * A date pair cannot express hours, and a package quoted in a different unit
 * than the product has no per-unit equivalent — both are `null` rather than a
 * guess.
 */
export function resolveUnits(input: PriceRequestInput): number | null {
  if (input.mode !== 'rental') return null;

  const pkg = input.rentalPackage ?? null;
  if (pkg) return pkg.unit === input.rentalUnit ? pkg.duration : null;

  if (input.rentalUnit !== 'day' || !input.startDate || !input.endDate) return null;

  const span = Math.round((Date.parse(input.endDate) - Date.parse(input.startDate)) / DAY_MS);
  return Number.isFinite(span) && span >= 0 ? Math.max(1, span) : null;
}

export function priceRequest(input: PriceRequestInput): PricedRequest {
  const rate = resolveUnitRate(input);
  const units = resolveUnits(input);
  const pkg = input.rentalPackage ?? null;
  const isRental = input.mode === 'rental';

  const lines: PriceLine[] = [];
  let total = ZERO;
  let openPeriod = false;

  if (!isRental) {
    total = rate;
    lines.push({ kind: 'base', amount: rate, perUnit: false });
  } else if (pkg) {
    // The package price buys the base rate for its duration; anything the
    // customer configured on top of the base rate is still billed per unit.
    const excess =
      pkg.unit === input.rentalUnit
        ? mulMoney(subMoney(rate, input.basePrice), pkg.duration)
        : ZERO;
    total = addMoney(pkg.price, excess);
    lines.push({ kind: 'package', amount: total });

    if (pkg.unit === input.rentalUnit) {
      const saved = subMoney(mulMoney(rate, pkg.duration), total);
      if (toHundredths(saved) > 0n) lines.push({ kind: 'packageSaving', amount: saved });
    }
  } else if (units !== null) {
    total = mulMoney(rate, units);
    lines.push({ kind: 'duration', amount: total, units });
  } else {
    total = rate;
    openPeriod = true;
    lines.push({ kind: 'base', amount: rate, perUnit: true });
  }

  const oneTime: string[] = [];

  for (const [index, addon] of (input.addons ?? []).entries()) {
    if (isZero(addon.price)) {
      lines.push({
        kind: 'addon',
        index,
        amount: ZERO,
        perUnit: false,
        included: true,
        oneTime: false,
      });
      continue;
    }

    if (isRental && addon.mode === 'rental') {
      const amount = units !== null ? mulMoney(addon.price, units) : addon.price;
      total = addMoney(total, amount);
      lines.push({
        kind: 'addon',
        index,
        amount,
        // With no duration the add-on is quoted at its per-unit rate, exactly
        // like the base rate above it.
        perUnit: units === null,
        included: false,
        oneTime: false,
      });
      continue;
    }

    oneTime.push(addon.price);
    lines.push({
      kind: 'addon',
      index,
      amount: addon.price,
      perUnit: false,
      included: false,
      oneTime: isRental,
    });
  }

  // While the period is open the figure above is a per-unit rate; folding a
  // one-time amount into it would add two incompatible quantities.
  if (!openPeriod && oneTime.length > 0) total = addMoney(total, sumMoney(oneTime));

  total = mulMoney(total, input.quantity);
  if (input.quantity > 1) lines.push({ kind: 'quantity', quantity: input.quantity });

  return { unitRate: rate, units, openPeriod, lines, total };
}
