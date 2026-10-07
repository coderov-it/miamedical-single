/**
 * The shapes the cart's state class hands its components, and the two small
 * helpers it builds them with. Split from `cart-state.svelte.ts` so that file
 * holds the state machine alone. Imports types only, so it adds nothing to the
 * island's bundle but `emptyView()` and `fill()`.
 */
import type { CartLine } from './cart-store.ts';
import type { CartCopy, CartLineView, CartView } from './cart.ts';

/** A stored line married to the server's resolution of it. */
export interface CartRow {
  line: CartLine;
  view: CartLineView;
}

/** One hidden `item.<n>.` input the checkout will read. */
export interface WireField {
  name: string;
  value: string;
}

/**
 * A row's spoken labels, already interpolated.
 *
 * Built here rather than in the card because the copy and its `{title}` slots are
 * this class's business; the card is a view and reads no templates.
 */
export interface CartRowLabels {
  decrease: string;
  increase: string;
  quantity: string;
  remove: string;
  quantityCap: string;
}

export interface CartStateInit {
  initial: CartView;
  urlLines: CartLine[];
  copy: CartCopy;
  /** Matches `formatMoney()`'s default in `lib/api.ts`. */
  locale: string;
  /**
   * The page's site language (`it`, `en`, …), sent with every re-price: a slug
   * is unique per language only, so the server must read each line in it.
   */
  siteLocale: string;
}

/** What `view` holds for the instant before the constructor assigns the real one. */
export function emptyView(): CartView {
  return {
    lines: [],
    itemsTotal: 0,
    itemsTotalLabel: '',
    noPackage: false,
    hasRental: false,
    currency: 'EUR',
    today: '',
    droppedIds: [],
  };
}

/** Fills `{slot}` markers in a copy string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
