/**
 * Filters and pagination live in the URL, not in `$state`. That makes a list
 * view shareable, survivable across a refresh, and navigable with Back — none
 * of which the old per-page `let page = $state(1)` could do.
 *
 * It also fixes a live bug by construction: changing a filter resets the page
 * to 1, so you can no longer land on "page 4 of 1 result".
 *
 * See /docs/code/admin-client-layer.md.
 */

import { untrack } from 'svelte';

import { goto } from '$app/navigation';
import { page as pageState } from '$app/state';

/** Only these — a query string is text, and anything richer belongs in a body. */
export type QueryShape = Record<string, string | number>;

export interface QueryStateOptions<S extends QueryShape> {
  /**
   * The key holding the page number; changing any *other* key resets it.
   * Defaults to `page` when the shape has one. `null` opts out entirely.
   */
  pageKey?: (keyof S & string) | null;
  /** Replace the history entry instead of pushing one. */
  replace?: boolean;
}

/** Construct during component initialisation — it owns a `$derived`. */
export class QueryState<S extends QueryShape> {
  readonly #defaults: S;
  readonly #pageKey: (keyof S & string) | null;
  readonly #replace: boolean;

  /**
   * Derived from the URL rather than mirrored into local state: one source of
   * truth means Back, a pasted link and a programmatic `set()` all arrive by
   * the same path.
   */
  readonly #current: S = $derived.by(() => this.#parse(pageState.url.searchParams));

  constructor(defaults: S, options: QueryStateOptions<S> = {}) {
    this.#defaults = defaults;
    this.#replace = options.replace ?? false;
    this.#pageKey =
      options.pageKey !== undefined
        ? options.pageKey
        : (('page' in defaults ? 'page' : null) as (keyof S & string) | null);
  }

  #parse(params: URLSearchParams): S {
    const result = { ...this.#defaults };

    for (const key of Object.keys(this.#defaults) as (keyof S & string)[]) {
      const raw = params.get(key);
      if (raw === null || raw === '') continue;

      if (typeof this.#defaults[key] === 'number') {
        const parsed = Number(raw);
        result[key] = (Number.isFinite(parsed) ? parsed : this.#defaults[key]) as S[keyof S &
          string];
      } else {
        result[key] = raw as S[keyof S & string];
      }
    }
    return result;
  }

  /** The committed values, parsed out of the URL. */
  get current(): S {
    return this.#current;
  }

  /** Whether any filter differs from its default — drives the Clear button. */
  get isFiltered(): boolean {
    return Object.keys(this.#defaults).some(
      (key) => key !== this.#pageKey && this.#current[key] !== this.#defaults[key],
    );
  }

  /**
   * Merge a patch into the URL. Values equal to their default are dropped, so
   * an unfiltered list keeps a clean `/products` rather than a wall of `&q=`.
   */
  set(patch: Partial<S>): void {
    const next = { ...this.#current, ...patch };

    // Any change other than paging puts you back on page 1: the result set is
    // different, so the old offset means nothing.
    const touchedFilter = Object.keys(patch).some((key) => key !== this.#pageKey);
    if (this.#pageKey && touchedFilter && !(this.#pageKey in patch)) {
      next[this.#pageKey] = this.#defaults[this.#pageKey];
    }

    this.#navigate(next);
  }

  /** Back to defaults. */
  reset(): void {
    this.#navigate({ ...this.#defaults });
  }

  #navigate(values: S): void {
    // Start from the live params so keys owned by someone else on the page
    // (`?tab=`, `?order=`) survive a filter change.
    const params = new URLSearchParams(pageState.url.search);

    for (const [key, value] of Object.entries(values)) {
      if (value === this.#defaults[key] || value === '') params.delete(key);
      else params.set(key, String(value));
    }

    const query = params.toString();
    void goto(`${pageState.url.pathname}${query ? `?${query}` : ''}`, {
      replaceState: this.#replace,
      // A same-page state change, not a navigation: do not throw the reader
      // back to the top, and do not drop focus out of the filter form.
      noScroll: true,
      keepFocus: true,
    });
  }
}

/**
 * The uncommitted half of an Apply-style filter form. Inputs bind to `values`;
 * nothing reaches the URL — or the server — until `apply()`.
 *
 * Applying per keystroke reads as "the page is fighting me": it fires a
 * request per character and rewrites history under the Back button.
 */
export class QueryDraft<S extends QueryShape> {
  values = $state<S>({} as S);

  readonly #state: QueryState<S>;

  constructor(state: QueryState<S>) {
    this.#state = state;
    this.values = { ...state.current };

    $effect(() => {
      const committed = state.current;

      // `values` is read here only to avoid pointless writes — reading it
      // *tracked* would subscribe this effect to its own output, and every
      // keystroke would immediately be overwritten by the committed value.
      untrack(() => {
        // Key by key, so an unrelated URL change (a drawer opening) cannot
        // clobber what the user is halfway through typing.
        for (const key of Object.keys(committed) as (keyof S)[]) {
          if (this.values[key] !== committed[key]) this.values[key] = committed[key];
        }
      });
    });
  }

  apply(): void {
    this.#state.set({ ...this.values });
  }

  clear(): void {
    this.#state.reset();
  }
}
