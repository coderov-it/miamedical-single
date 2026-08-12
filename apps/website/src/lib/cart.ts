/**
 * The cart, server side: how a stored line becomes a priced row.
 *
 * The cart itself is CLIENT-side — there is no cart or orders endpoint on the API,
 * so a line lives in `localStorage` and the server holds none. But no price and no
 * product fact is ever taken from storage. A line records only what the customer
 * CHOSE (a slug plus their configuration); every title, label, line item and
 * amount is re-derived here by `resolveCart()`, a thin wrapper over the same
 * `resolveCheckout()` the checkout uses. Storage is a shopping list, not a receipt.
 *
 * That split is what makes a user-writable store safe: editing `localStorage` can
 * change which product you are asking about and how many, and nothing else. A
 * crafted `config` cannot invent an option — `resolveRequest()` drops everything
 * that is not a real one — and cannot invent a price, because no price crosses the
 * boundary inward.
 *
 * The browser-side half is `cart-store.ts`, which imports nothing on purpose.
 * Layout, the island, and the no-JavaScript path: docs/code/storefront-cart.md
 */
import { formatMoney, mediaUrl } from './api.ts';
import {
  CART_ITEM_PREFIX,
  CART_PRODUCT_FIELD,
  CART_QUANTITY_FIELD,
  type CartLine,
  MAX_CART_LINES,
  MAX_CART_QUANTITY,
  clampQuantity,
  lineKey,
} from './cart-store.ts';
import {
  type CheckoutItem,
  type EstimateLine,
  ITEM_PREFIX,
  type ItemFact,
  MAX_ITEMS,
  resolveCheckout,
  splitItemParams,
} from './checkout.ts';
import { t } from './labels.ts';
import { FIELD, MAX_QUANTITY } from './request-config.ts';
import { productPath } from './routes.ts';

/**
 * The drift guard `cart-store.ts` promises.
 *
 * That module cannot import the checkout's vocabulary — it has to stay free of
 * server imports — so it restates four values. These declarations make the
 * restatement checked: each annotation is a string or numeric LITERAL type, so if
 * `ITEM_PREFIX` is ever renamed to `line.` or `MAX_ITEMS` raised to 50, this file
 * stops type-checking and `astro check` says so. Nothing reads these bindings;
 * their whole job is to fail.
 */
const _itemPrefixAgrees: typeof CART_ITEM_PREFIX = ITEM_PREFIX;
const _productFieldAgrees: typeof CART_PRODUCT_FIELD = FIELD.product;
const _quantityFieldAgrees: typeof CART_QUANTITY_FIELD = FIELD.quantity;
const _maxLinesAgrees: typeof MAX_CART_LINES = MAX_ITEMS;
const _maxQuantityAgrees: typeof MAX_CART_QUANTITY = MAX_QUANTITY;
void _itemPrefixAgrees;
void _productFieldAgrees;
void _quantityFieldAgrees;
void _maxLinesAgrees;
void _maxQuantityAgrees;

/** One resolved row, shaped for the island. Everything here is server-derived. */
export interface CartLineView {
  /** Echoes `CartLine.id`, so the island can match a response to its row. */
  id: string;
  slug: string;
  title: string;
  href: string;
  /** The product's own currency, so the island can format its own arithmetic. */
  currency: string;
  /** Already through `mediaUrl()`. */
  thumbnail: string | null;
  thumbnailAlt: string;
  /** "Taglia M · Buono · Pacchetto weekend" — the one-line configuration recap. */
  summary: string;
  facts: ItemFact[];
  lines: EstimateLine[];
  quantity: number;
  /** Formatted, at this quantity. */
  subtotal: string;
  /**
   * The row's total at quantity 1. The island multiplies this to repaint a stepper
   * press immediately, then the resolve response replaces it. It is the ONE number
   * the client is allowed to do arithmetic on, and a plain multiply is not a
   * pricing rule — every rule that decides WHAT to multiply already ran here.
   */
  unitTotal: number;
  total: number;
  /** The rental has no closed period, so `total` is a per-unit rate, not a sum. */
  openPeriod: boolean;
  /** "/giorno", or empty. Appended to the figure the island formats itself. */
  unitSuffix: string;
}

export interface CartView {
  lines: CartLineView[];
  itemsTotal: number;
  /** Formatted `itemsTotal`, so the server-rendered total needs no client Intl. */
  itemsTotalLabel: string;
  openPeriod: boolean;
  currency: string;
  /**
   * Lines whose product no longer resolves — unpublished, deleted, or a slug
   * someone typed into storage.
   *
   * The checkout DROPS these silently, on the reasoning that a product we cannot
   * rent is worse than one fewer row. The cart must not: this is the page where
   * the customer can still act, and a row that vanishes between visits with no
   * explanation reads as the site losing their choice. The island reports the
   * count and prunes the dead ids from storage.
   */
  droppedIds: string[];
}

/* --------------------------------------------------------- wire format --- */

/*
 * Only the READ direction lives here. There is deliberately no
 * `serializeCartLines()`: the write direction has exactly one caller, the island,
 * which needs the fields as rendered hidden `<input>`s rather than as a
 * `URLSearchParams` — so a server-side serialiser would be dead code that merely
 * looks like the authority on the format. The island builds them from
 * `CART_ITEM_PREFIX` and `CART_QUANTITY_FIELD`, which the drift guard above ties to
 * the checkout's own constants.
 */

/**
 * Something arrived in the URL.
 *
 * With JavaScript off, "Aggiungi alla richiesta" degrades to a plain GET of the
 * product page's form to `/carrello/`, so the page must be able to render a line it
 * was handed rather than one it stored. The island reads the same params back into
 * storage on mount and then clears them from the URL, which is what keeps that
 * merge idempotent across a refresh.
 *
 * `splitItemParams()` accepts both the indexed and the un-prefixed single-item
 * form, so a hand-off from the product page and a whole cart read identically.
 */
export function cartLinesFromParams(params: URLSearchParams): CartLine[] {
  return splitItemParams(params).map((group, index) => {
    const quantity = clampQuantity(group.get(FIELD.quantity) ?? 1);

    // Quantity is held outside `config`, so strip it rather than store it twice.
    const config = new URLSearchParams(group);
    config.delete(FIELD.quantity);
    const serialized = config.toString();

    return {
      /* Derived from the configuration, not random: this runs during SSR too, and
         `Math.random()` here would make the server and client markup disagree on
         every keyed row. Deterministic also means a refresh of the same hand-off
         URL produces the same id, so the merge in the island stays idempotent. */
      id: `url-${index}-${hashConfig(lineKey(serialized))}`,
      config: serialized,
      quantity,
    };
  });
}

/** FNV-1a, 32-bit. Short, stable, and not a security boundary — just an id. */
function hashConfig(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/* ------------------------------------------------------------- resolve --- */

function toView(line: CartLine, item: CheckoutItem): CartLineView {
  const { product } = item;
  const { thumbnail } = product.media;

  return {
    id: line.id,
    slug: product.slug,
    title: product.title,
    href: productPath(product.slug),
    currency: product.pricing.currency,
    thumbnail: thumbnail ? mediaUrl(thumbnail.path) : null,
    thumbnailAlt: thumbnail?.alt ?? product.title,
    summary: item.summary,
    facts: item.facts,
    lines: item.lines,
    quantity: line.quantity,
    subtotal: item.subtotal,
    /* `Number()` here and below: the island does one multiplication per stepper
       press to repaint immediately, and that needs a number. Every rule that
       decides WHAT to multiply has already run in exact money — see
       `estimate()` — so this is display arithmetic on a settled figure. */
    unitTotal: Number(item.total) / Math.max(1, line.quantity),
    total: Number(item.total),
    openPeriod: item.openPeriod,
    unitSuffix: item.unitSuffix,
  };
}

/**
 * Prices a cart, one `resolveCheckout()` per line.
 *
 * Per line rather than one call for the whole cart because ids have to survive:
 * `resolveCheckout()` drops what it cannot resolve, so a single call would return a
 * shorter list with no way to say WHICH row died — and the cart, unlike the
 * checkout, has to tell the customer. The reads still run in parallel and each line
 * costs exactly the one product read it would have cost anyway.
 */
export async function resolveCart(lines: CartLine[]): Promise<CartView> {
  const capped = lines.slice(0, MAX_CART_LINES);

  const resolved = await Promise.all(
    capped.map(async (line) => {
      const params = new URLSearchParams(line.config);
      params.set(FIELD.quantity, String(clampQuantity(line.quantity)));

      const { items } = await resolveCheckout(params);
      const item = items[0];
      return item ? toView(line, item) : { droppedId: line.id };
    }),
  );

  const views = resolved.filter((entry): entry is CartLineView => !('droppedId' in entry));
  const droppedIds = resolved.flatMap((entry) => ('droppedId' in entry ? [entry.droppedId] : []));

  const itemsTotal = views.reduce((sum, view) => sum + view.total, 0);

  /* The first resolved line's currency, exactly as `resolveCheckout()` picks it.
     "A cart has one currency" is an assumption inherited from the API — every
     product is priced in EUR today — not something this module can enforce. If
     mixed currencies ever arrive, summing `itemsTotal` is what breaks first. */
  const currency = views[0]?.currency ?? 'EUR';

  return {
    lines: views,
    itemsTotal,
    itemsTotalLabel: formatMoney(itemsTotal.toFixed(2), currency),
    openPeriod: views.some((view) => view.openPeriod),
    currency,
    droppedIds,
  };
}

/* ---------------------------------------------------------------- copy --- */

/**
 * Every Italian word the cart island renders, resolved here and handed over as a
 * prop.
 *
 * The island is a `.svelte` file and the project rule is that code holds English
 * identifiers only — so rather than let it call `t()` (which would also pull
 * `@mia/i18n` into the client bundle for a page that needs none of it), the words
 * are resolved on the server and travel as data. The island contains no Italian at
 * all, which is exactly the rule.
 *
 * `{}` slots are filled in the island, so the placeholder names are part of this
 * contract: `removeNamed` must keep `{title}`, `countMany` must keep `{count}`.
 */
export interface CartCopy {
  countOne: string;
  countMany: string;
  heading: string;
  summary: string;
  subtotal: string;
  deliveryLabel: string;
  deliveryPending: string;
  total: string;
  vatIncluded: string;
  openPeriodNote: string;
  goToCheckout: string;
  noChargeYet: string;
  continueBrowsing: string;
  editConfiguration: string;
  remove: string;
  removeNamed: string;
  increase: string;
  decrease: string;
  quantityOf: string;
  showDetailsOf: string;
  updated: string;
  loading: string;
  offline: string;
  unavailableOne: string;
  unavailableMany: string;
  emptyTitle: string;
  emptyDetail: string;
  goToCatalog: string;
}

export function cartCopy(): CartCopy {
  return {
    countOne: t('cartCountOne'),
    countMany: t('cartCountMany'),
    heading: t('cart'),
    summary: t('cartSummary'),
    subtotal: t('cartSubtotal'),
    deliveryLabel: t('delivery'),
    deliveryPending: t('cartDeliveryPending'),
    total: t('total'),
    vatIncluded: t('vatIncluded'),
    openPeriodNote: t('estimateOpenPeriod'),
    goToCheckout: t('goToCheckout'),
    noChargeYet: t('cartNoChargeYet'),
    continueBrowsing: t('continueBrowsing'),
    editConfiguration: t('editConfiguration'),
    remove: t('remove'),
    removeNamed: t('removeNamed'),
    increase: t('increaseQuantity'),
    decrease: t('decreaseQuantity'),
    quantityOf: t('quantityOf'),
    showDetailsOf: t('showDetailsOf'),
    updated: t('cartUpdated'),
    loading: t('cartLoading'),
    offline: t('cartOffline'),
    unavailableOne: t('cartLineUnavailableOne'),
    unavailableMany: t('cartLineUnavailableMany'),
    emptyTitle: t('cartEmpty'),
    emptyDetail: t('cartEmptyDetail'),
    goToCatalog: t('goToCatalog'),
  };
}
