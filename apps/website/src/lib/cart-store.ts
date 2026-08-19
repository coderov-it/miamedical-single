/**
 * The cart's client-side contract: the store shape, and the vocabulary it speaks.
 *
 * THIS MODULE IMPORTS NOTHING, and it must stay that way. It is the only cart code
 * the browser downloads, and its neighbours are not shippable: `cart.ts` reaches
 * `api.ts` for the Hono client and `checkout.ts` for `@mia/i18n`, so one runtime
 * import from the island would drag the whole server graph into the bundle for a
 * page that needs none of it. Types may be imported from anywhere — they erase.
 *
 * Everything here is either a bound or a pure function, because it runs on both
 * sides: the island reads `localStorage` with it and `/api/cart/resolve` validates
 * a POST body with it. One parser, so a hand-edited store and a crafted request
 * cannot disagree about what a line is.
 */

/**
 * `mia.cart.v1` — versioned, so a future change to `CartLine` is recognised and
 * discarded rather than half-parsed. Bump the suffix and old carts read as empty.
 */
export const CART_STORAGE_KEY = 'mia.cart.v1';

/*
 * The four values below are the CHECKOUT's, restated here because this module
 * cannot import it. They are not allowed to drift: `assertCartWireAgrees()` in
 * `cart.ts` fails the type-check if they ever do, so a rename over there is
 * caught at build time rather than by a cart that posts a body the checkout
 * cannot read.
 */

/** Must equal `MAX_ITEMS` in `checkout.ts`. Bounds product reads per request. */
export const MAX_CART_LINES = 20;

/** Must equal `MAX_QUANTITY` in `request-config.ts`. */
export const MAX_CART_QUANTITY = 10;

/** Must equal `ITEM_PREFIX` in `checkout.ts`. */
export const CART_ITEM_PREFIX = 'item.';

/** Must equal `FIELD.product` in `request-config.ts`. */
export const CART_PRODUCT_FIELD = 'product';

/** Must equal `FIELD.quantity` in `request-config.ts`. */
export const CART_QUANTITY_FIELD = 'qty';

/**
 * A crafted `config` cannot buy anything — no price crosses the boundary inward —
 * but it can make a large POST body and a large resolve request. Bounded so it
 * cannot.
 */
const MAX_CONFIG_LENGTH = 2000;

/** One thing the customer asked about, as stored in the browser. */
export interface CartLine {
  /**
   * Opaque, stable for the life of the row. Removing a line must not renumber the
   * others — the island keys its rows on this, and it is what a resolve response
   * is matched back to.
   */
  id: string;
  /**
   * The configuration as a query string, in the SAME field vocabulary the product
   * page's form writes: `product=carrozzina&variant.size=m&from=2026-09-01`.
   * Quantity is deliberately NOT in here — see `quantity`.
   */
  config: string;
  /**
   * Held beside `config` rather than inside it because the stepper owns it. With
   * `qty` buried in the query string, changing it would mean rewriting the string
   * and the row's identity (`lineKey`) would change on every press of `+`.
   */
  quantity: number;
}

export function clampQuantity(value: unknown): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_CART_QUANTITY, Math.max(1, n));
}

/**
 * Reads the store defensively.
 *
 * `localStorage` is user-writable and survives across deploys, so every shape here
 * is untrusted input: anything unrecognised is dropped rather than repaired, and a
 * corrupt store reads as an empty cart instead of throwing on a page the customer
 * needs. Truncates at `MAX_CART_LINES` rather than rejecting — a missing 21st row
 * is a better failure than a cart that will not load.
 */
export function parseCartLines(raw: string | null): CartLine[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const lines: CartLine[] = [];
  const seen = new Set<string>();

  for (const entry of parsed) {
    if (typeof entry !== 'object' || entry === null) continue;

    const { id, config, quantity } = entry as Record<string, unknown>;

    if (typeof id !== 'string' || !id || seen.has(id)) continue;
    if (typeof config !== 'string' || !config || config.length > MAX_CONFIG_LENGTH) continue;
    // A line with no product is not a line; it would resolve to nothing anyway.
    if (!new URLSearchParams(config).get(CART_PRODUCT_FIELD)?.trim()) continue;

    seen.add(id);
    lines.push({ id, config, quantity: clampQuantity(quantity) });
    if (lines.length >= MAX_CART_LINES) break;
  }
  return lines;
}

/**
 * Row identity: same product, same configuration.
 *
 * Adding a product already in the cart in the SAME configuration raises its
 * quantity rather than opening a second identical row — but the same product in a
 * different size is a different row, because it is a different thing to deliver.
 * Sorted, so key order in the query string cannot make two identical
 * configurations look different.
 */
export function lineKey(config: string): string {
  const params = [...new URLSearchParams(config)];
  params.sort(([a, av], [b, bv]) => a.localeCompare(b) || av.localeCompare(bv));
  return params.map(([key, value]) => `${key}=${value}`).join('&');
}

/** The header badge's number: the sum of the quantities, not the row count. */
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + clampQuantity(line.quantity), 0);
}

/**
 * Fired on `window` after the store changes, because the native `storage` event
 * only reaches OTHER tabs. The header badge listens for both.
 */
export const CART_CHANGED_EVENT = 'mia:cart-changed';

export interface CartChangedDetail {
  count: number;
}

/** Writes the store and announces it. Swallows a failed write — see the island. */
export function writeCartLines(lines: CartLine[]): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* Private mode, a full quota, or storage disabled by policy. The cart still
       works for this page view; it just will not survive the navigation. Losing
       persistence must not lose the page the customer is looking at. */
  }
  window.dispatchEvent(
    new CustomEvent<CartChangedDetail>(CART_CHANGED_EVENT, {
      detail: { count: cartCount(lines) },
    }),
  );
}

/** Reads the store, tolerating a browser that refuses to hand it over. */
export function readCartLines(): CartLine[] {
  try {
    return parseCartLines(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}
