/**
 * The one async-fetch pattern in the admin. Replaces the hand-rolled
 * `$effect` + `loading` + `error` + `setTimeout` block that was copy-pasted
 * into every list and detail page, each copy racing slightly differently.
 *
 * See /docs/code/admin-client-layer.md for the reasoning behind the
 * request-id guard, abort-on-supersede, and why `data` survives a reload.
 */

import { errorMessage } from './request.ts';

export interface ResourceOptions {
  /**
   * Fetching is skipped while this returns false — typically a permission the
   * viewer does not hold. Read reactively, so granting access starts a fetch.
   */
  enabled?: () => boolean;
  /**
   * Milliseconds to settle before firing. The first run and `refresh()` never
   * wait; this only coalesces a key that is changing under the user's fingers.
   */
  debounce?: number;
}

export class Resource<T, K = unknown> {
  /**
   * `$state.raw`: a server payload is an immutable snapshot we always replace
   * wholesale, so deep-proxying every row of a 50-item list buys nothing.
   */
  #data = $state.raw<T | undefined>(undefined);
  #error = $state<string | null>(null);
  #loading = $state(false);
  #nonce = $state(0);

  /** Set by `refresh()` so an explicit user action skips the debounce. */
  #immediate = false;

  /**
   * Monotonic id of the newest request. A response whose id is stale is
   * dropped: aborting the previous fetch is not enough on its own, because a
   * response that already arrived can still be parsing its body when the next
   * request starts.
   */
  #latest = 0;

  /**
   * Must be constructed during component initialisation — it owns an
   * `$effect`, which is what ties the in-flight request to the component's
   * lifetime.
   */
  constructor(
    key: () => K,
    fetcher: (key: K, signal: AbortSignal) => Promise<T>,
    options: ResourceOptions = {},
  ) {
    let started = false;

    $effect(() => {
      // The tracked reads. The fetch itself runs from a timer, outside this
      // reaction, so a fetcher touching other state does not subscribe us.
      const currentKey = key();
      const enabled = options.enabled ? options.enabled() : true;
      void this.#nonce;

      if (!enabled) return;

      const wait = started && !this.#immediate ? (options.debounce ?? 0) : 0;
      started = true;
      this.#immediate = false;

      const controller = new AbortController();
      const timer = setTimeout(() => void this.#run(currentKey, fetcher, controller.signal), wait);

      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    });
  }

  async #run(key: K, fetcher: (key: K, signal: AbortSignal) => Promise<T>, signal: AbortSignal) {
    const id = ++this.#latest;
    this.#loading = true;

    try {
      const result = await fetcher(key, signal);
      if (id !== this.#latest) return;
      this.#data = result;
      this.#error = null;
    } catch (err) {
      // An abort is us superseding ourselves, not a failure worth showing.
      if (signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
      if (id !== this.#latest) return;
      this.#error = errorMessage(err);
    } finally {
      // Guarded so a superseded request cannot clear the newer one's spinner.
      // Reached on the abort path too, which is what unsticks `loading` when
      // the resource is disabled mid-flight.
      if (id === this.#latest) this.#loading = false;
    }
  }

  get data(): T | undefined {
    return this.#data;
  }

  get error(): string | null {
    return this.#error;
  }

  /** A request is in flight. Previous `data` is still there — keep rendering it. */
  get loading(): boolean {
    return this.#loading;
  }

  /**
   * Distinguishes "first load, nothing to show" (skeleton) from "refreshing
   * something already on screen" (keep the table). Replacing a table with the
   * word `Loading…` on every filter change is the jump we are fixing.
   */
  get hasData(): boolean {
    return this.#data !== undefined;
  }

  /** Re-fetch the same key — after a mutation, or from a Retry button. */
  refresh(): void {
    this.#immediate = true;
    this.#nonce += 1;
  }

  /**
   * Adopt a payload we already hold, e.g. the refreshed detail every mutation
   * endpoint returns. Saves a round trip and avoids a visible flash.
   */
  set(value: T): void {
    this.#latest += 1; // Any in-flight response is now older than this.
    this.#data = value;
    this.#error = null;
    this.#loading = false;
  }
}
