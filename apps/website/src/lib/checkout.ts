/**
 * The checkout wire format, and the estimate the order overview is built from.
 *
 * Checkout accepts BOTH shapes the storefront can arrive in — one product
 * configured on its detail page, or several carried over from a cart — so the
 * page itself never branches on where the request came from. Format, rationale
 * and the deliberate deviations from the reference design:
 * docs/code/storefront-checkout.md
 */
import { durationLabel, unitLabel } from '@mia/i18n';
import { formatMoney } from './api.ts';
import { t } from './labels.ts';
import { type ProductDetail, getProductBySlug } from './catalog.ts';
import { FIELD, type ResolvedRequest, formatDateLabel, resolveRequest } from './request-config.ts';
import { CONTACT, LOCATIONS } from './site.ts';

const DAY = 86_400_000;

/**
 * `item.<n>.` in front of every field of one line item. A cart sends
 * `item.0.product=…&item.0.variant.size=…&item.1.product=…`; a product detail
 * page sends the un-prefixed single-item form and is read as item 0. Both are the
 * SAME field names from `request-config.ts` — the prefix is the only addition, so
 * a cart never needs a second vocabulary.
 */
export const ITEM_PREFIX = 'item.';
const ITEM_KEY = /^item\.(\d+)\.(.+)$/;

/**
 * A ceiling on how many line items one URL may describe. Not a business limit:
 * each item costs one product read, so an unbounded index would let a crafted
 * URL fan out into arbitrarily many API calls.
 */
export const MAX_ITEMS = 20;

export interface EstimateLine {
  label: string;
  /** Already formatted for display — never arithmetic input. */
  amount: string;
}

/** One row of an item's summary well: the design's Location / Pick up / Return. */
export interface ItemFact {
  label: string;
  value: string;
}

export interface CheckoutItem {
  product: ProductDetail;
  request: ResolvedRequest;
  /** "Taglia M · Buono · Pacchetto weekend" — the one-line configuration recap. */
  summary: string;
  facts: ItemFact[];
  lines: EstimateLine[];
  /** Display total for this item, in `product.pricing.currency`. */
  total: number;
  subtotal: string;
  /**
   * The rental has no end date and no package, so `total` is a PER-UNIT rate
   * rather than a sum. An open period is normal here — see the module doc.
   */
  openPeriod: boolean;
  /**
   * "/giorno", or empty. The unit `total` is expressed in when `openPeriod` is
   * set, already folded into `subtotal` — carried separately for the cart, which
   * re-formats this figure client-side when the stepper moves and would otherwise
   * render a daily rate as though it were a total.
   */
  unitSuffix: string;
}

export interface Checkout {
  items: CheckoutItem[];
  /** Sum of the item totals. Meaningless as a total when `openPeriod` is set. */
  itemsTotal: number;
  /** Any item priced per unit, so the grand total cannot be a closed figure. */
  openPeriod: boolean;
  currency: string;
}

/**
 * Splits one query string into per-item parameter sets.
 *
 * Indices are used only to GROUP and to order; they are not preserved, so a
 * cart that removed its middle item does not have to renumber the rest.
 */
export function splitItemParams(params: URLSearchParams): URLSearchParams[] {
  const groups = new Map<number, URLSearchParams>();

  for (const [key, value] of params) {
    const match = ITEM_KEY.exec(key);
    if (!match) continue;
    const index = Number(match[1]);
    const field = match[2];
    if (!Number.isSafeInteger(index) || field === undefined) continue;
    let group = groups.get(index);
    if (!group) {
      group = new URLSearchParams();
      groups.set(index, group);
    }
    group.append(field, value);
  }

  // No indexed keys at all: this is the product detail page's single-item form.
  if (groups.size === 0) {
    return params.has(FIELD.product) ? [params] : [];
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, group]) => group)
    .filter((group) => group.has(FIELD.product))
    .slice(0, MAX_ITEMS);
}

/**
 * Prices a resolved request for display.
 *
 * The rules are the owner's, and the same ones the product detail page's inline
 * script applies to its live estimate: on a rental product every modifier and
 * every rental-mode add-on bills per rental unit, so one duration multiplies
 * every amount; a package is a fixed total for a fixed duration, and the
 * configured rate's excess over the base rate rides on top of it.
 *
 * It reads `ResolvedRequest` rather than the URL on purpose — `resolveRequest()`
 * has already dropped everything that is not a real option, and a second walk
 * over the product would be a second chance to disagree with it.
 */
function estimate(product: ProductDetail, request: ResolvedRequest) {
  const isRental = product.pricing.mode === 'rental';
  const unit = product.pricing.rentalUnit;
  const { currency } = product.pricing;
  const money = (amount: number) => formatMoney(amount.toFixed(2), currency);

  const base = Number(product.pricing.price);
  const rate = request.selections.reduce((sum, entry) => sum + entry.amount, 0) + base;
  const labels = request.selections
    .filter((entry) => entry.amount !== 0)
    .map((entry) => entry.value);
  const baseLabel = labels.length > 0 ? labels.join(' · ') : t('baseRate');
  const perUnitSuffix = isRental && unit ? `/${unitLabel(unit, 'it', 'one')}` : '';

  const pkg = request.rentalPackage;

  /* Duration in the PRODUCT's unit. A date pair cannot express hours, and a
     package in a different unit has no per-unit equivalent — both stay null. */
  let units: number | null = null;
  if (isRental) {
    if (pkg) {
      units = pkg.unit === unit ? pkg.duration : null;
    } else if (unit === 'day' && request.startDate && request.endDate) {
      const span = Math.round((Date.parse(request.endDate) - Date.parse(request.startDate)) / DAY);
      if (Number.isFinite(span) && span >= 0) units = Math.max(1, span);
    }
  }

  const lines: EstimateLine[] = [];
  let total = 0;
  let openPeriod = false;

  if (!isRental) {
    total = rate;
    lines.push({ label: baseLabel, amount: money(rate) });
  } else if (pkg) {
    const extra = pkg.unit === unit ? (rate - base) * pkg.duration : 0;
    total = Number(pkg.price) + extra;
    lines.push({
      label: `${t('packagePrefix')} ${pkg.label} · ${baseLabel}`,
      amount: money(total),
    });
    if (pkg.unit === unit) {
      const saved = rate * pkg.duration - total;
      if (saved > 0.005) {
        lines.push({ label: t('packageDiscountApplied'), amount: `−${money(saved)}` });
      }
    }
  } else if (units !== null && unit) {
    total = rate * units;
    lines.push({
      label: `${baseLabel} × ${durationLabel(units, unit, 'it')}`,
      amount: money(total),
    });
  } else {
    total = rate;
    openPeriod = true;
    lines.push({ label: baseLabel, amount: money(rate) + perUnitSuffix });
  }

  /* Add-ons. A rental-mode add-on follows the product's rental unit, so it
     multiplies by the same duration as the base rate. */
  let oneTime = 0;
  for (const addon of request.addons) {
    const price = Number(addon.pricing.price);
    if (price === 0) {
      lines.push({ label: addon.name, amount: t('included') });
    } else if (isRental && addon.pricing.mode === 'rental') {
      if (units !== null) {
        total += price * units;
        lines.push({ label: addon.name, amount: money(price * units) });
      } else {
        total += price;
        lines.push({ label: addon.name, amount: money(price) + perUnitSuffix });
      }
    } else {
      oneTime += price;
      lines.push({
        label: addon.name,
        amount: money(price) + (isRental ? ` ${t('oneTimeSuffix')}` : ''),
      });
    }
  }
  // While the period is open the figure is a per-unit rate; folding a one-time
  // amount into it would add two incompatible quantities.
  if (!openPeriod) total += oneTime;

  total *= request.quantity;
  if (request.quantity > 1) {
    lines.push({ label: t('quantity'), amount: `× ${request.quantity}` });
  }

  return {
    lines,
    total,
    openPeriod,
    subtotal: money(total) + (openPeriod ? perUnitSuffix : ''),
    units,
    /* Handed out rather than kept private because the cart re-formats this row's
       figure client-side when the stepper moves, and a per-unit RATE rendered
       without its "/giorno" reads as a total. Empty unless the period is open —
       the same condition `subtotal` above applies. */
    unitSuffix: openPeriod ? perUnitSuffix : '',
  };
}

/** The design's three-row summary well, filled with what this project has. */
function buildFacts(
  product: ProductDetail,
  request: ResolvedRequest,
  units: number | null,
): ItemFact[] {
  const facts: ItemFact[] = [];
  const unit = product.pricing.rentalUnit;

  if (product.pricing.mode === 'rental') {
    facts.push({
      label: t('pickupDate'),
      value: formatDateLabel(request.startDate) || t('toBeConfirmed'),
    });
    facts.push({
      label: t('returnDate'),
      value: formatDateLabel(request.endDate) || t('toBeConfirmed'),
    });
    facts.push({
      label: t('duration'),
      value: units !== null && unit ? durationLabel(units, unit, 'it') : t('toBeConfirmed'),
    });
  }

  if (request.quantity > 1) {
    facts.push({ label: t('quantity'), value: String(request.quantity) });
  }

  return facts;
}

/**
 * Reads a checkout URL into priced line items.
 *
 * An unknown or unpublished slug is dropped rather than rendered as an
 * unavailable row: the customer cannot act on it here, and a checkout that
 * shows a product we cannot rent is worse than one that shows fewer.
 */
export async function resolveCheckout(params: URLSearchParams): Promise<Checkout> {
  const groups = splitItemParams(params);

  const resolved = await Promise.all(
    groups.map(async (group) => {
      const slug = group.get(FIELD.product)?.trim() ?? '';
      if (!slug) return null;
      const product = await getProductBySlug(slug);
      if (!product) return null;

      const request = resolveRequest(product, group, formatMoney);
      const priced = estimate(product, request);

      const summaryParts = [
        ...request.selections.map((entry) => entry.value),
        ...(request.rentalPackage ? [request.rentalPackage.name] : []),
      ];

      return {
        product,
        request,
        summary: summaryParts.join(' · '),
        facts: buildFacts(product, request, priced.units),
        lines: priced.lines,
        total: priced.total,
        subtotal: priced.subtotal,
        openPeriod: priced.openPeriod,
        unitSuffix: priced.unitSuffix,
      } satisfies CheckoutItem;
    }),
  );

  const items = resolved.filter((item): item is CheckoutItem => item !== null);

  return {
    items,
    itemsTotal: items.reduce((sum, item) => sum + item.total, 0),
    openPeriod: items.some((item) => item.openPeriod),
    currency: items[0]?.product.pricing.currency ?? 'EUR',
  };
}

/**
 * The three ways an order can change hands.
 *
 * PLACEHOLDER FEES. The API has no delivery-pricing field yet, so these are the
 * reference design's own figures, kept because no payment is taken online and
 * the phone call settles the real amount. They are hardcoded in exactly one
 * place so replacing them with an API read is a one-line change — see the
 * "Known gaps" section of docs/code/storefront-checkout.md.
 */
export const DELIVERY_OPTIONS = [
  { id: 'hotelDelivery', fee: 25 },
  { id: 'homeDelivery', fee: 15 },
  { id: 'storePickup', fee: 0 },
] as const;

export type DeliveryId = (typeof DELIVERY_OPTIONS)[number]['id'];

/** The branches a customer can collect from, from the one source of company facts. */
export const PICKUP_POINTS = LOCATIONS.map((location) => ({
  city: location.city,
  name: t('branchIn', { city: location.city }),
  detail: `${location.street} · ${CONTACT.hours.it}`,
}));

/**
 * The customer identities the intake form asks to distinguish. Ids only — the
 * words come from the label catalog, keyed by these same ids.
 */
export const CUSTOMER_TYPES = [{ id: 'private' }, { id: 'company' }, { id: 'tourist' }] as const;

export type CustomerTypeId = (typeof CUSTOMER_TYPES)[number]['id'];
