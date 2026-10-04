/**
 * The checkout wire format, and the estimate the order overview is built from.
 *
 * Checkout accepts BOTH shapes the storefront can arrive in — one product
 * configured on its detail page, or several carried over from a cart — so the
 * page itself never branches on where the request came from. Format, rationale
 * and the deliberate deviations from the reference design:
 * docs/code/storefront-checkout.md
 */
import { durationLabel } from '@mia/i18n';
import { DELIVERY_METHODS, priceRequest } from '@mia/pricing';
import type { PlaceOrderItemInput } from '@mia/validators';
import { formatMoney } from './api.ts';
import { localeForRequest, localeTag } from './i18n.ts';
import { t } from './labels.ts';
import type { ProductDetail } from './catalog.ts';
import { FIELD, type ResolvedRequest, formatDateLabel } from './request-config.ts';
import { CONTACT, LOCATIONS } from './site.ts';
import { SOURCE_LANGUAGE, translate } from '~/lib/i18n';
import { CONTACT_HOURS_KEY } from '~/lib/site';

/**
 * `item.<n>.` in front of every field of one line item. A cart sends
 * `item.0.product=…&item.0.question.piano=…&item.1.product=…`; a product detail
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
  /**
   * This item's total as a two-decimal money string, in
   * `product.pricing.currency` — the same figure, from the same rules, that
   * `POST /api/orders` writes to the line it creates.
   */
  total: string;
  subtotal: string;
  /**
   * The rental has no package picked, so there is nothing to price — `total` is
   * `0,00` and means nothing. Normal on this page, since a customer can arrive
   * from a hand-edited link, but an order may not be PLACED in this state: the
   * server rejects it and the confirm step blocks it. See `noPackage` on
   * `Checkout` and the gate in checkout.astro.
   */
  noPackage: boolean;
  /**
   * This line as `POST /api/orders` takes it — choices only, no amounts. The page
   * ships it to the browser as a JSON island so the confirm step can post the
   * request without rebuilding it from the DOM.
   */
  order: PlaceOrderItemInput;
  /**
   * Required choices this configuration never made, as the labels the customer
   * would have read.
   *
   * The API rejects such a line, and rightly — a required option is required. This
   * page therefore has to know BEFORE offering a confirm button, or the customer
   * meets that rejection as a generic failure at the last step. Normally empty: the
   * product page will not hand over a configuration that skips a required group.
   * A hand-edited link or a cart entry saved before a group became required can
   * still get here.
   */
  missingRequired: string[];
  /**
   * This line's identity in the browser cart (`lineKey()` of its configuration,
   * quantity excluded), so a placed order can take exactly its own lines out of
   * the cart and nothing else.
   */
  cartKey: string;
  /**
   * Always empty now that every rental total is a closed figure. Kept so the
   * cart's client-side re-format has one shape to read for both modes rather
   * than a field that appears only sometimes.
   */
  unitSuffix: string;
}

/**
 * Why this request cannot be confirmed yet, or `null` when it can.
 *
 * `incomplete`, `pastStart` and `noPackage` are things the API would refuse,
 * checked here so the customer is told what to do about it on the page that can
 * still send them somewhere useful. `pastStart` is a rental added days ago whose
 * start date has since gone by. `unavailable` is ours: a line could not be READ
 * (an outage, not a missing product), so placing the order now would silently
 * leave it out.
 */
export type CheckoutBlocked = 'unavailable' | 'incomplete' | 'pastStart' | 'noPackage' | null;

export interface Checkout {
  items: CheckoutItem[];
  /**
   * Sum of the item totals, as a two-decimal money string. Meaningless as a total
   * while any item is still missing its package.
   */
  itemsTotal: string;
  /**
   * A rental item with no package picked, so it has no price and the order cannot
   * be placed. The confirm step swaps its CTA for a "pick a package" notice while
   * this holds.
   */
  noPackage: boolean;
  /**
   * `null` when the order can be placed. Otherwise the confirm step swaps its CTA
   * for the notice that says what is missing — never a button that is certain to
   * fail.
   */
  blocked: CheckoutBlocked;
  /** The first blocking item, so the notice can name the product and the gap. */
  blockedItem: CheckoutItem | null;
  /**
   * Lines that could not be read because the catalogue did not answer — NOT
   * because the product is gone (that line is dropped, as above). They are kept
   * out of `items` only because there is nothing to render them from; the
   * request still carries them, and `blocked` is `unavailable` until a retry
   * reads them.
   */
  unavailable: number;
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
 * Prices a resolved request for display, and puts Italian words on the result.
 *
 * The rules themselves are NOT here. They live in `@mia/pricing`, which is also
 * what `POST /api/orders` prices with — so the figure a customer confirms on this
 * page and the figure written to their order are the same arithmetic on the same
 * inputs, not two implementations that happen to agree. This function's whole job
 * is turning the structured rows that come back into the sentences the design asks
 * for; the copy is the part that belongs to the storefront.
 *
 * It reads `ResolvedRequest` rather than the URL on purpose — `resolveRequest()`
 * has already dropped everything that is not a real option, and a second walk
 * over the product would be a second chance to disagree with it.
 */
export function estimate(product: ProductDetail, request: ResolvedRequest) {
  const unit = product.pricing.rentalUnit;
  const { currency } = product.pricing;
  const locale = localeForRequest();
  const money = (amount: string) => formatMoney(amount, currency, localeTag(locale));

  const priced = priceRequest({
    mode: product.pricing.mode,
    basePrice: product.pricing.price,
    rentalPackage: request.rentalPackage,
    quantity: request.quantity,
    addons: request.addons.map((entry) => ({
      mode: entry.addon.pricing.mode,
      price: entry.addon.pricing.price,
      rentalUnit: entry.addon.pricing.rentalUnit,
      quantity: entry.quantity,
    })),
  });

  const pkg = request.rentalPackage;

  const lines: EstimateLine[] = priced.lines.map((line) => {
    switch (line.kind) {
      case 'base':
        return { label: t('baseRate'), amount: money(line.amount) };
      case 'package':
        return {
          label: pkg?.label ?? durationLabel(line.units, line.unit, locale),
          amount: money(line.amount),
        };
      case 'addon': {
        const entry = request.addons[line.index];
        /* "Materasso × 2 × 7 giorni" — the two multipliers are different things,
           and collapsing them into one number hides which is which. */
        const parts = [entry?.addon.name ?? ''];
        if (line.quantity > 1) parts.push(`× ${line.quantity}`);
        if (line.units !== null && unit) parts.push(`× ${durationLabel(line.units, unit, locale)}`);
        return {
          label: parts.join(' '),
          amount: line.included ? t('included') : money(line.amount),
        };
      }
      case 'quantity':
        return { label: t('quantity'), amount: `× ${line.quantity}` };
    }
  });

  return {
    lines,
    total: priced.total,
    noPackage: priced.incomplete,
    subtotal: money(priced.total),
    units: priced.units,
    /* Every total is closed now that a package is required, so there is no rate
       for the cart to mislabel. Kept as a field so both modes read one shape. */
    unitSuffix: '',
  };
}

/**
 * The design's three-row summary well, filled with what this project has.
 *
 * The return row reads off the DERIVED period rather than anything the customer
 * typed — they pick a package and a start, and the return is what those two
 * mean. The time is shown only on an hour package, where it is the difference
 * between a 4-hour rental and a whole day of one.
 */
export function buildFacts(product: ProductDetail, request: ResolvedRequest): ItemFact[] {
  const facts: ItemFact[] = [];
  const { period } = request;

  if (product.pricing.mode === 'rental') {
    const stamp = (date: string, time: string | null): string =>
      time ? `${formatDateLabel(date)} ${time}` : formatDateLabel(date);

    facts.push({
      label: t('pickupDate'),
      value: request.startDate
        ? stamp(request.startDate, period?.startTime ?? null)
        : t('toBeConfirmed'),
    });
    facts.push({
      label: t('returnDate'),
      value: period ? stamp(period.endDate, period.endTime) : t('toBeConfirmed'),
    });
    facts.push({
      label: t('duration'),
      value: period
        ? durationLabel(period.duration, period.unit, localeForRequest())
        : t('toBeConfirmed'),
    });
  }

  if (request.quantity > 1) {
    facts.push({ label: t('quantity'), value: String(request.quantity) });
  }

  return facts;
}

/**
 * The two ways an order can change hands.
 *
 * The list lives in `@mia/pricing` so the storefront and the server cannot
 * disagree about which methods exist. There are NO FEES on it: collection is free,
 * and home delivery is not priced anywhere — the customer is told we will be in
 * touch about the cost, and an operator writes the agreed amount onto the order
 * afterwards.
 *
 * Each `id` doubles as a label key: `storePickup`, `storePickupDetail`,
 * `storePickupShort`.
 */
export const DELIVERY_OPTIONS = DELIVERY_METHODS;

export type DeliveryId = (typeof DELIVERY_OPTIONS)[number]['id'];

/** The branches a customer can collect from, from the one source of company facts. */
export const PICKUP_POINTS = LOCATIONS.map((location) => ({
  city: location.city,
  name: t('branchIn', { city: location.city }),
  detail: `${location.street} · ${translate(SOURCE_LANGUAGE, CONTACT_HOURS_KEY)}`,
}));

/**
 * The customer identities the intake form asks to distinguish. Ids only — the
 * words come from the label catalog, keyed by these same ids.
 */
export const CUSTOMER_TYPES = [{ id: 'private' }, { id: 'company' }, { id: 'tourist' }] as const;

export type CustomerTypeId = (typeof CUSTOMER_TYPES)[number]['id'];
