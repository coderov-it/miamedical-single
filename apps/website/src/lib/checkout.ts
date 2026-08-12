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
import { DELIVERY_METHODS, matchSku, priceRequest, sumMoney } from '@mia/pricing';
import type { PlaceOrderItemInput } from '@mia/validators';
import { formatMoney } from './api.ts';
import { t } from './labels.ts';
import { type ProductDetail, getProductBySlug } from './catalog.ts';
import { FIELD, type ResolvedRequest, formatDateLabel, resolveRequest } from './request-config.ts';
import { CONTACT, LOCATIONS } from './site.ts';

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
  /**
   * This item's total as a two-decimal money string, in
   * `product.pricing.currency` — the same figure, from the same rules, that
   * `POST /api/orders` writes to the line it creates.
   */
  total: string;
  subtotal: string;
  /**
   * The rental has no end date and no package, so `total` is a PER-UNIT rate
   * rather than a sum. Normal on this page — a customer can arrive from a product
   * page without having picked a return date — but an order may not be PLACED in
   * this state: the server rejects it and the confirm step blocks it, because a
   * rate is not a total. See `openPeriod` on `Checkout` and the return-date gate
   * in checkout.astro.
   */
  openPeriod: boolean;
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
   * "/giorno", or empty. The unit `total` is expressed in when `openPeriod` is
   * set, already folded into `subtotal` — carried separately for the cart, which
   * re-formats this figure client-side when the stepper moves and would otherwise
   * render a daily rate as though it were a total.
   */
  unitSuffix: string;
}

/**
 * Why this request cannot be confirmed yet, or `null` when it can.
 *
 * Both reasons are things the API would refuse, checked here so the customer is
 * told what to do about it on the page that can still send them somewhere useful.
 */
export type CheckoutBlocked = 'incomplete' | 'openPeriod' | null;

export interface Checkout {
  items: CheckoutItem[];
  /**
   * Sum of the item totals, as a two-decimal money string. Meaningless as a total
   * when `openPeriod` is set.
   */
  itemsTotal: string;
  /**
   * Any item priced per unit, so the grand total cannot be a closed figure — and
   * the order cannot be placed until it is. The confirm step swaps its CTA for a
   * "pick a return date" notice while this holds.
   */
  openPeriod: boolean;
  /**
   * `null` when the order can be placed. Otherwise the confirm step swaps its CTA
   * for the notice that says what is missing — never a button that is certain to
   * fail.
   */
  blocked: CheckoutBlocked;
  /** The first blocking item, so the notice can name the product and the gap. */
  blockedItem: CheckoutItem | null;
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
function estimate(product: ProductDetail, request: ResolvedRequest) {
  const isRental = product.pricing.mode === 'rental';
  const unit = product.pricing.rentalUnit;
  const { currency } = product.pricing;
  const money = (amount: string) => formatMoney(amount, currency);

  /* A pinned SKU can carry a price override, which no sum of modifiers would
     find. The server matches the same way, from the same values — only the
     sku-affecting groups take part, because the matrix has one row per
     combination and a numeric group has no finite set of them. */
  const skuSelection: Record<string, string[]> = {};
  for (const group of product.variants) {
    const values = request.variantValues[group.key];
    if (group.affectsSku && values) skuSelection[group.key] = values;
  }
  const matched = matchSku(product.skus, skuSelection);

  const priced = priceRequest({
    mode: product.pricing.mode,
    rentalUnit: unit,
    basePrice: product.pricing.price,
    skuPrice: matched?.price.amount ?? null,
    modifiers: request.selections,
    rentalPackage: request.rentalPackage,
    startDate: request.startDate,
    endDate: request.endDate,
    quantity: request.quantity,
    addons: request.addons.map((addon) => ({
      mode: addon.pricing.mode,
      price: addon.pricing.price,
    })),
  });

  /* The configured rate reads as its own choices — "Grigio · Con sponde" — and
     falls back to "Tariffa base" when nothing the customer picked costs extra. */
  const labels = request.selections
    .filter((entry) => entry.amount !== '0.00')
    .map((entry) => entry.value);
  const baseLabel = labels.length > 0 ? labels.join(' · ') : t('baseRate');
  const perUnitSuffix = isRental && unit ? `/${unitLabel(unit, 'it', 'one')}` : '';
  const pkg = request.rentalPackage;

  const lines: EstimateLine[] = priced.lines.map((line) => {
    switch (line.kind) {
      case 'base':
        return {
          label: baseLabel,
          amount: money(line.amount) + (line.perUnit ? perUnitSuffix : ''),
        };
      case 'duration':
        return {
          label: unit ? `${baseLabel} × ${durationLabel(line.units, unit, 'it')}` : baseLabel,
          amount: money(line.amount),
        };
      case 'package':
        return {
          label: pkg ? `${t('packagePrefix')} ${pkg.label} · ${baseLabel}` : baseLabel,
          amount: money(line.amount),
        };
      case 'packageSaving':
        return { label: t('packageDiscountApplied'), amount: `−${money(line.amount)}` };
      case 'addon': {
        const addon = request.addons[line.index];
        return {
          label: addon?.name ?? '',
          amount: line.included
            ? t('included')
            : money(line.amount) +
              (line.perUnit ? perUnitSuffix : '') +
              (line.oneTime ? ` ${t('oneTimeSuffix')}` : ''),
        };
      }
      case 'quantity':
        return { label: t('quantity'), amount: `× ${line.quantity}` };
    }
  });

  return {
    lines,
    total: priced.total,
    openPeriod: priced.openPeriod,
    subtotal: money(priced.total) + (priced.openPeriod ? perUnitSuffix : ''),
    units: priced.units,
    /* Handed out rather than kept private because the cart re-formats this row's
       figure client-side when the stepper moves, and a per-unit RATE rendered
       without its "/giorno" reads as a total. Empty unless the period is open —
       the same condition `subtotal` above applies. */
    unitSuffix: priced.openPeriod ? perUnitSuffix : '',
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
 * The same line as `POST /api/orders` will be asked to record it.
 *
 * Built from the RESOLVED request, not from the raw query string, so a value the
 * page decided not to show is not a value the order is asked to contain — the two
 * would otherwise disagree the moment an option is retired. Every field here is a
 * choice; not one of them is an amount. The server prices it again from the
 * catalogue, and this page has no say in that.
 */
function toOrderItem(product: ProductDetail, request: ResolvedRequest): PlaceOrderItemInput {
  return {
    productSlug: product.slug,
    quantity: request.quantity,
    ...(request.startDate ? { startDate: request.startDate } : {}),
    ...(request.endDate ? { endDate: request.endDate } : {}),
    ...(request.rentalPackage ? { rentalPackageCode: request.rentalPackage.code } : {}),
    // Includes the product's required add-ons, which `resolveRequest` folds in
    // whether or not the form remembered to tick them.
    addonIds: request.addons.map((addon) => addon.id),
    variants: request.variantValues,
    answers: request.answerValues,
  };
}

/**
 * Required groups and questions this configuration left unanswered.
 *
 * Read off the product, not off a list kept here, so a group the operator marks
 * required tomorrow starts blocking today's stale links without a deploy.
 */
function missingRequired(product: ProductDetail, request: ResolvedRequest): string[] {
  const missing: string[] = [];

  for (const group of product.variants) {
    if (group.isRequired && !request.variantValues[group.key]) missing.push(group.label);
  }
  for (const question of product.questions) {
    if (question.isRequired && !request.answerValues[question.key]) missing.push(question.prompt);
  }

  return missing;
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
        order: toOrderItem(product, request),
        missingRequired: missingRequired(product, request),
      } satisfies CheckoutItem;
    }),
  );

  const items = resolved.filter((item): item is CheckoutItem => item !== null);

  /* Incomplete before open-period: a line missing a required choice has to be
     reconfigured anyway, and picking its return date first would send the customer
     back twice. */
  const incomplete = items.find((item) => item.missingRequired.length > 0) ?? null;
  const open = items.find((item) => item.openPeriod) ?? null;

  return {
    items,
    itemsTotal: sumMoney(items.map((item) => item.total)),
    openPeriod: open !== null,
    blocked: incomplete ? 'incomplete' : open ? 'openPeriod' : null,
    blockedItem: incomplete ?? open,
    currency: items[0]?.product.pricing.currency ?? 'EUR',
  };
}

/**
 * The three ways an order can change hands, and what each costs.
 *
 * The table itself lives in `@mia/pricing`, because the server writes the same fee
 * to `orders.shipping_total` when the order is placed — a card showing €25 over an
 * order recording €15 is the same class of bug as two pricing rules.
 *
 * The FEES are still placeholders from the reference design; the zone ladder
 * behind `POST /api/delivery/quote` is what replaces them, and it needs the
 * customer's CAP (which step 1 now collects). See the "Known gaps" section of
 * docs/code/storefront-checkout.md.
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
  detail: `${location.street} · ${CONTACT.hours.it}`,
}));

/**
 * The customer identities the intake form asks to distinguish. Ids only — the
 * words come from the label catalog, keyed by these same ids.
 */
export const CUSTOMER_TYPES = [{ id: 'private' }, { id: 'company' }, { id: 'tourist' }] as const;

export type CustomerTypeId = (typeof CUSTOMER_TYPES)[number]['id'];
