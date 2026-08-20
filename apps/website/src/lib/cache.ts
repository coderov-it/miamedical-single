/**
 * Read-through cache for the storefront's server-side catalogue reads.
 *
 * Three behaviours, in the order they matter here:
 *
 *   - **single-flight** — a burst of concurrent requests for a cold key makes
 *     one API call, not one per request. Without it, render cost scales with
 *     traffic; with it, it scales with the refresh interval.
 *   - **stale-while-revalidate** — past `fresh` the stored value is still
 *     served and the refresh runs behind it, so no visitor ever waits on a
 *     refill.
 *   - **stale-if-error** — the last good value is kept indefinitely and served
 *     when a refresh throws. An API outage shows slightly old products instead
 *     of an empty page, which is the whole reason this exists.
 *
 * The cache is per process and dies with it: a restart costs one API call per
 * key, not correctness. Strategy and chosen numbers: docs/code/storefront-caching.md.
 */

export interface CachePolicy {
  /** Seconds a stored value is served with no refresh at all. */
  fresh: number;
  /** Seconds after `fresh` in which the value is still served while a refresh runs behind it. */
  stale: number;
}

/**
 * Catalogue reads — products and categories.
 *
 * `fresh` spends most of an agreed 5-minute budget for how long an admin edit
 * may stay invisible; the remaining 60 s is `PUBLIC_PAGE.sMaxAge` in
 * `http-cache.ts`, and the two add up. At 4 minutes the whole site costs the
 * API one products call and one categories call per 4 minutes, whatever the
 * traffic.
 *
 * `stale` is how long a quiet site keeps answering from memory before a request
 * has to wait for the API — an hour, so the first visitor after a lull is not
 * the one who pays.
 */
export const CATALOG_POLICY: CachePolicy = { fresh: 240, stale: 3600 };

interface Entry {
  /** Unknown here, narrowed by the caller's key — see the cast in `cached()`. */
  value: unknown;
  storedAt: number;
}

const entries = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * One refresh per key at a time. Callers that arrive mid-refresh join the
 * running promise rather than starting a second API call.
 */
function refresh<T>(key: string, read: () => Promise<T>): Promise<T> {
  const running = inFlight.get(key) as Promise<T> | undefined;
  if (running !== undefined) return running;

  const run = read()
    .then((value) => {
      entries.set(key, { value, storedAt: Date.now() });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, run);
  return run;
}

export async function cached<T>(
  key: string,
  read: () => Promise<T>,
  policy: CachePolicy,
): Promise<T> {
  const entry = entries.get(key);

  // Cold: this request pays for the read. It throws on failure — the caller's
  // `safely()` decides what an empty section looks like.
  if (entry === undefined) return refresh(key, read);

  const value = entry.value as T;
  const age = (Date.now() - entry.storedAt) / 1000;

  if (age < policy.fresh) return value;

  if (age < policy.fresh + policy.stale) {
    // A background failure must not become an unhandled rejection. The stored
    // value stays put and the next request retries.
    void refresh(key, read).catch((error: unknown) => {
      console.warn(`[cache] background refresh of ${key} failed, keeping the stored value:`, error);
    });
    return value;
  }

  // Too old to serve blind, so this request waits — but a failed read is not a
  // reason to render nothing when we still hold a good value.
  try {
    return await refresh(key, read);
  } catch (error) {
    console.warn(
      `[cache] ${key} is ${Math.round(age)}s old and the refresh failed; serving it anyway:`,
      error,
    );
    return value;
  }
}

/** Drop one key, or the whole cache when called with no argument. */
export function invalidate(key?: string): void {
  if (key === undefined) {
    entries.clear();
    return;
  }
  entries.delete(key);
}
