/**
 * Reads a checkout request into priced line items — the one walk both the
 * checkout page and the cart's re-pricing make.
 *
 * Split from `checkout.ts`, which keeps the wire format, the estimate and the
 * shared constants; this file owns the product reads and what a failed one
 * means. Format and rationale: docs/code/storefront-checkout.md
 */
import { sumMoney } from '@mia/pricing';
import type { PlaceOrderItemInput } from '@mia/validators';
import { lineKey } from './cart-store.ts';
import { type ProductDetail, getProductBySlug } from './catalog.ts';
import {
  type Checkout,
  type CheckoutItem,
  buildFacts,
  estimate,
  splitItemParams,
} from './checkout.ts';
import { localeForRequest } from './i18n.ts';
import { FIELD, type ResolvedRequest, resolveRequest } from './request-config.ts';

/**
 * The same line as `POST /api/orders` will be asked to record it.
 *
 * Built from the RESOLVED request, not from the raw query string, so a value the
 * page decided not to show is not a value the order is asked to contain — the two
 * would otherwise disagree the moment an option is retired. Every field here is a
 * choice; not one of them is an amount. The server prices it again from the
 * catalogue, and this page has no say in that.
 *
 * `productId` rides beside the slug because a slug is unique per language only:
 * the id names the product this page actually rendered, whichever language its
 * slug was written in. The server prefers it when present.
 */
function toOrderItem(product: ProductDetail, request: ResolvedRequest): PlaceOrderItemInput {
  return {
    productId: product.id,
    productSlug: product.slug,
    quantity: request.quantity,
    ...(request.startDate ? { startDate: request.startDate } : {}),
    ...(request.startTime ? { startTime: request.startTime } : {}),
    ...(request.rentalPackage ? { rentalPackageCode: request.rentalPackage.code } : {}),
    addons: request.addons.map((entry) => ({ id: entry.addon.id, quantity: entry.quantity })),
    answers: request.answerValues,
  };
}

/**
 * Required questions this configuration left unanswered.
 *
 * Read off the product, not off a list kept here, so a question the operator
 * marks required tomorrow starts blocking today's stale links without a deploy.
 */
function missingRequired(product: ProductDetail, request: ResolvedRequest): string[] {
  const missing: string[] = [];

  for (const question of product.questions) {
    if (question.isRequired && !request.answerValues[question.key]) missing.push(question.prompt);
  }

  return missing;
}

/**
 * The cart's identity for this group: its configuration with the quantity taken
 * out, which is exactly how the cart stores a line (`CartLine.config`).
 */
function cartKeyOf(group: URLSearchParams): string {
  const config = new URLSearchParams(group);
  config.delete(FIELD.quantity);
  return lineKey(config.toString());
}

/** What one group became: a line, nothing (no such product), or an outage. */
type GroupResult = CheckoutItem | 'missing' | 'unavailable';

/**
 * One product read, priced.
 *
 * The slug is looked up in the REQUEST's language, which is the language the
 * link into this page was written in: the product page and the cart both build
 * it from the slug they rendered. A slug is unique per language only, so asking
 * in any other language could match a different product.
 */
async function resolveGroup(group: URLSearchParams): Promise<GroupResult> {
  const slug = group.get(FIELD.product)?.trim() ?? '';
  if (!slug) return 'missing';

  let product: ProductDetail | null;
  try {
    product = await getProductBySlug(slug, localeForRequest());
  } catch (error) {
    /* Not a missing product — the catalogue did not answer. Dropping the line
       here is how an outage used to empty carts; see `Checkout.unavailable`. */
    console.warn(`[checkout] ${slug} could not be read:`, error);
    return 'unavailable';
  }
  if (!product) return 'missing';

  const request = resolveRequest(product, group);
  const priced = estimate(product, request);

  return {
    product,
    request,
    summary: request.rentalPackage?.label ?? '',
    facts: buildFacts(product, request),
    lines: priced.lines,
    total: priced.total,
    subtotal: priced.subtotal,
    noPackage: priced.noPackage,
    unitSuffix: priced.unitSuffix,
    order: toOrderItem(product, request),
    missingRequired: missingRequired(product, request),
    cartKey: cartKeyOf(group),
  };
}

/**
 * Reads a checkout URL into priced line items.
 *
 * An unknown or unpublished slug is dropped rather than rendered as an
 * unavailable row: the customer cannot act on it here, and a checkout that
 * shows a product we cannot rent is worse than one that shows fewer.
 *
 * A line the catalogue could not READ is the opposite case and is never
 * dropped: it is counted in `unavailable`, and that blocks the order until a
 * retry reads it, because placing without it would quietly order less than the
 * customer asked for.
 */
export async function resolveCheckout(params: URLSearchParams): Promise<Checkout> {
  const resolved = await Promise.all(splitItemParams(params).map(resolveGroup));

  const items = resolved.filter((entry): entry is CheckoutItem => typeof entry === 'object');
  const unavailable = resolved.filter((entry) => entry === 'unavailable').length;

  /* Unavailable before everything: until every line is read, the other two
     checks are looking at part of the order. Incomplete before no-package: a
     line missing a required choice has to be reconfigured anyway, and picking
     its package first would send the customer back twice. */
  const incomplete = items.find((item) => item.missingRequired.length > 0) ?? null;
  const today = todayInRome();
  const stale = items.find((item) => item.request.startDate !== '' && item.request.startDate < today) ?? null;
  const unpriced = items.find((item) => item.noPackage) ?? null;

  return {
    items,
    itemsTotal: sumMoney(items.map((item) => item.total)),
    noPackage: unpriced !== null,
    blocked: blockedReason(unavailable > 0, incomplete !== null, stale !== null, unpriced !== null),
    blockedItem: incomplete ?? stale ?? unpriced,
    unavailable,
    currency: items[0]?.product.pricing.currency ?? 'EUR',
  };
}

function blockedReason(
  unavailable: boolean,
  incomplete: boolean,
  pastStart: boolean,
  unpriced: boolean,
): Checkout['blocked'] {
  if (unavailable) return 'unavailable';
  if (incomplete) return 'incomplete';
  if (pastStart) return 'pastStart';
  if (unpriced) return 'noPackage';
  return null;
}

/**
 * Today in the shop's time zone, ISO `YYYY-MM-DD` — the floor the product page's
 * date picker offers. A rental put in the cart last week can start before it;
 * the API refuses those, so the confirm step stops it here first.
 */
function todayInRome(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
