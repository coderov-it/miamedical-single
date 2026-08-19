/// <reference types="svelte" />
/**
 * The cart's client state, as one class.
 *
 * The island used to hold all of this inline, and grew to 660 lines doing it.
 * State and view scale differently, so they are separated: this file decides WHAT
 * the cart contains, and the components under `components/cart/` decide only how
 * that looks. Nothing here touches the DOM.
 *
 * WHAT IT OWNS: which lines exist, how many of each, which rows are open, and
 * whether a price request is in flight. It owns no price, no title and no label —
 * those arrive from `/api/cart/resolve` already formatted, and the only
 * arithmetic is `unitTotal × quantity`, to repaint a stepper press before the
 * response lands.
 *
 * It holds no Italian: every word arrives through `copy`, resolved on the server
 * by `cartCopy()`. That is the project's code-English rule, and it also keeps
 * `@mia/i18n` out of the client bundle.
 *
 * RUNTIME IMPORTS COME FROM `cart-store.ts` ONLY — that module imports nothing,
 * so the island's bundle is this logic and nothing else. `cart.ts` is server code
 * (Hono client, `@mia/i18n`) and may be imported here for TYPES only, which erase.
 *
 * Layout, the deliberate deviations and the no-JavaScript path:
 * docs/code/storefront-cart.md
 */
import {
  CART_ITEM_PREFIX,
  CART_QUANTITY_FIELD,
  type CartLine,
  cartCount,
  clampQuantity,
  lineKey,
  readCartLines,
  writeCartLines,
} from './cart-store.ts';
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
  details: string;
  remove: string;
}

export interface CartStateInit {
  initial: CartView;
  urlLines: CartLine[];
  copy: CartCopy;
  /** Matches `formatMoney()`'s default in `lib/api.ts`. */
  locale: string;
}

/** What `view` holds for the instant before the constructor assigns the real one. */
function emptyView(): CartView {
  return {
    lines: [],
    itemsTotal: 0,
    itemsTotalLabel: '',
    noPackage: false,
    currency: 'EUR',
    droppedIds: [],
  };
}

/** Fills `{slot}` markers in a copy string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

export class CartState {
  /* ------------------------------------------------------------ reactive --- */

  /** Lines as the CLIENT holds them, in storage order. The source of truth. */
  lines = $state<CartLine[]>([]);
  /** The last thing the SERVER said about those lines. */
  view = $state<CartView>(emptyView());
  /**
   * Row ids that are open. Several may be, unlike the reference's single mode —
   * and NONE is the default (owner, 2026-08-20). The first row used to open
   * itself, which made a two-line cart taller than a screen before the customer
   * asked for any detail. A row's head already carries the package, its unit
   * price and the amount; the panel is for the dates.
   */
  openIds = $state<Set<string>>(new Set());
  /** A resolve request is in flight. */
  pricing = $state(false);
  /** The last resolve failed: the figures on screen are the previous answer. */
  stale = $state(false);
  /**
   * True while the client is still finding out what the cart holds.
   *
   * The server cannot know — the lines live in `localStorage` — so it used to
   * render "your request is empty" and get corrected a moment later, which is the
   * content flash the owner reported (2026-08-20). Now the first paint claims
   * nothing: the page shows a loading plate and commits to rows or to the empty
   * state only once storage has been read AND the first price response landed.
   *
   * Starts FALSE when the URL carried lines: those are the truth for that
   * request, they are already rendered, and pricing them again must not blank the
   * page. That is the no-JavaScript hand-off path, and it keeps working untouched.
   */
  booting = $state(false);
  /** Politely announced after a change, so a stepper press is audible. */
  announcement = $state('');

  /* -------------------------------------------------------------- private --- */

  readonly #copy: CartCopy;
  readonly #urlLines: CartLine[];
  readonly #locale: string;
  #priceToken = 0;
  #debounce: ReturnType<typeof setTimeout> | undefined;
  #mounted = false;

  constructor({ initial, urlLines, copy, locale }: CartStateInit) {
    this.#copy = copy;
    this.#urlLines = urlLines;
    this.#locale = locale;

    this.lines = urlLines;
    this.view = initial;
    this.booting = urlLines.length === 0;
  }

  /* ------------------------------------------------------------- derived --- */

  count = $derived(cartCount(this.lines));

  empty = $derived(this.lines.length === 0);

  /**
   * Rows in STORAGE order, each married to its resolved view.
   *
   * Driven by `lines` rather than by `view.lines` so a removal or a stepper press
   * repaints immediately: the response that agrees with it is still in flight,
   * and rendering the server's list would make every interaction wait for the
   * network. A line with no view yet (just added, not priced) is skipped rather
   * than rendered blank.
   */
  rows = $derived(
    this.lines
      .map((line) => {
        const resolved = this.view.lines.find((candidate) => candidate.id === line.id);
        return resolved ? { line, view: resolved } : null;
      })
      .filter((row): row is CartRow => row !== null),
  );

  /**
   * The optimistic total: each row's server-priced unit rate times the quantity
   * this class currently holds. Equals `view.itemsTotal` once a response lands.
   *
   * An open-period row's figure is a per-unit RATE, not a sum, so a cart holding
   * one cannot show a closed total — the same rule `estimate()` applies, and the
   * reason the note under the number changes rather than the number being hidden.
   */
  optimisticTotal = $derived(
    this.rows.reduce((sum, row) => sum + row.view.unitTotal * row.line.quantity, 0),
  );

  /** Formats an amount in the cart's currency. Re-made when the currency moves. */
  money = $derived.by(() => {
    const format = new Intl.NumberFormat(this.#locale, {
      style: 'currency',
      currency: this.view.currency || 'EUR',
    });
    return (amount: number) => format.format(amount);
  });

  /* `$derived.by` rather than `$derived` wherever the expression reads a private
     field: a field initializer runs before the constructor assigns those, and while
     a rune's expression is evaluated lazily, TypeScript reads it as use-before-init.
     A closure says what is actually happening. */
  countLabel = $derived.by(() =>
    this.count === 1 ? this.#copy.countOne : fill(this.#copy.countMany, { count: this.count }),
  );

  /** Empty when nothing was dropped — the components treat "" as "no notice". */
  unavailableNotice = $derived.by(() => {
    const dropped = this.view.droppedIds.length;
    if (dropped === 0) return '';
    if (dropped === 1) return this.#copy.unavailableOne;
    return fill(this.#copy.unavailableMany, { count: dropped });
  });

  /**
   * The `item.<n>.` fields the checkout reads, flattened to one list of hidden
   * inputs.
   *
   * Built here rather than in the template because `URLSearchParams` is an
   * iterable, not an array, and `{#each}` needs the array — and because the index
   * has to be the ROW's position, which a nested each would have to thread
   * through. Positional and preserved nowhere, exactly as `splitItemParams()`
   * documents.
   */
  wireFields = $derived(
    this.rows.flatMap((row, index) => {
      const prefix = `${CART_ITEM_PREFIX}${index}.`;
      const fields: WireField[] = [...new URLSearchParams(row.line.config)].map(([key, value]) => ({
        name: prefix + key,
        value,
      }));
      fields.push({ name: prefix + CART_QUANTITY_FIELD, value: String(row.line.quantity) });
      return fields;
    }),
  );

  /* ------------------------------------------------------------- reading --- */

  isOpen(id: string): boolean {
    return this.openIds.has(id);
  }

  /** Every spoken label one row needs, with its product name already in place. */
  rowLabels(view: CartLineView): CartRowLabels {
    const title = view.title;
    return {
      decrease: fill(this.#copy.decrease, { title }),
      increase: fill(this.#copy.increase, { title }),
      quantity: fill(this.#copy.quantityOf, { title }),
      details: fill(this.#copy.showDetailsOf, { title }),
      remove: fill(this.#copy.removeNamed, { title }),
    };
  }

  /** The formatted figure a row shows: unit rate × quantity, with its suffix. */
  rowAmount(row: CartRow): string {
    return `${this.money(row.view.unitTotal * row.line.quantity)}${row.view.unitSuffix}`;
  }

  /**
   * The formatted price of ONE of these, with its suffix — what the package
   * itself costs, never × quantity (owner, 2026-08-20). `unitSuffix` is "/giorno"
   * on an open-ended rental, where the figure is a RATE and not a total; dropping
   * it would make a daily rate read as the price of the whole rental.
   */
  rowUnitPrice(row: CartRow): string {
    return `${this.money(row.view.unitTotal)}${row.view.unitSuffix}`;
  }

  /* ------------------------------------------------------------- writing --- */

  toggle(id: string): void {
    const next = new Set(this.openIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.openIds = next;
  }

  setQuantity(id: string, quantity: number): void {
    const clamped = clampQuantity(quantity);
    this.#commit(
      this.lines.map((line) => (line.id === id ? { ...line, quantity: clamped } : line)),
    );
  }

  remove(id: string): void {
    this.#commit(this.lines.filter((line) => line.id !== id));
  }

  /* ----------------------------------------------------------- lifecycle --- */

  /**
   * Reads the store, folds in anything the URL carried, and prices the result.
   * Called once, from the container's mount effect — guarded, because an effect
   * may run more than once.
   */
  mount(): void {
    if (this.#mounted) return;
    this.#mounted = true;

    const merged = this.#mergeUrlLines(readCartLines());
    this.lines = merged;
    writeCartLines(merged);

    if (merged.length === 0) {
      this.booting = false;
      return;
    }

    /* Always re-price on mount, even when the server already rendered these exact
       lines: the store may be days old, and a rental's price or availability can
       have moved since it was written. The loading plate holds until this lands —
       a row cannot be drawn before the server has named and priced it. */
    void this.#price(merged).finally(() => {
      this.booting = false;
    });
  }

  /* ------------------------------------------------------------- storage --- */

  /**
   * Folds anything the URL carried into the store, then clears it from the URL.
   *
   * Without the clearing this would double-add on every refresh: the line would
   * be in storage AND in the query string, and merging is not idempotent against
   * a URL that keeps saying "add this". `replaceState` also keeps the
   * configuration out of the back button, which is the same reason the checkout
   * takes a POST.
   */
  #mergeUrlLines(stored: CartLine[]): CartLine[] {
    if (this.#urlLines.length === 0) return stored;

    const merged = [...stored];
    for (const incoming of this.#urlLines) {
      const key = lineKey(incoming.config);
      const existing = merged.find((line) => lineKey(line.config) === key);
      if (existing) {
        existing.quantity = clampQuantity(existing.quantity + incoming.quantity);
      } else {
        merged.push(incoming);
      }
    }

    window.history.replaceState(null, '', window.location.pathname);
    return merged;
  }

  #commit(next: CartLine[], { announce = true } = {}): void {
    this.lines = next;
    writeCartLines(next);
    if (announce) this.announcement = `${this.#copy.updated} · ${this.money(this.optimisticTotal)}`;

    clearTimeout(this.#debounce);
    this.#debounce = setTimeout(() => void this.#price(next), 250);
  }

  /* ------------------------------------------------------------- pricing --- */

  /**
   * Re-prices the whole cart on the server.
   *
   * Debounced by `#commit`, and guarded by a token rather than by an
   * AbortController: two presses of `+` produce two requests, and the danger is
   * the FIRST response landing last and repainting an older quantity. The token
   * makes a stale response a no-op.
   */
  async #price(next: CartLine[]): Promise<void> {
    if (next.length === 0) {
      this.view = {
        ...this.view,
        lines: [],
        itemsTotal: 0,
        itemsTotalLabel: this.money(0),
        droppedIds: [],
      };
      return;
    }

    const token = ++this.#priceToken;
    this.pricing = true;
    try {
      const response = await fetch('/api/cart/resolve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lines: next }),
      });
      if (!response.ok) throw new Error(`resolve failed: ${response.status}`);
      const fresh = (await response.json()) as CartView;
      if (token !== this.#priceToken) return;

      this.view = fresh;
      this.stale = false;

      /* A product that stopped resolving is pruned here rather than left to fail
         at the checkout, and it is the one case where the server's list, not this
         class's, decides what the cart contains. */
      if (fresh.droppedIds.length > 0) {
        this.lines = this.lines.filter((line) => !fresh.droppedIds.includes(line.id));
        writeCartLines(this.lines);
      }
    } catch {
      if (token !== this.#priceToken) return;
      /* The amounts on screen stay — they are the last figures the server gave,
         and every one of them is provisional until the phone call anyway. The
         banner says so rather than blanking a cart the customer can still read. */
      this.stale = true;
    } finally {
      if (token === this.#priceToken) this.pricing = false;
    }
  }
}
