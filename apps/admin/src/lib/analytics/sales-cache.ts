/**
 * A short-lived client cache in front of the sales endpoint, so returning to a
 * range already seen is instant and hovering a preset can warm it. In-flight
 * requests are shared and never aborted — a prefetch must outlive the pointer
 * leaving the button — and failures are never cached.
 */

export interface CacheOptions {
  /** Milliseconds an entry stays fresh. */
  ttl?: number;
  /** Entries kept; the oldest is dropped first. */
  max?: number;
  now?: () => number;
}

export function salesKey(range: { from: string; to: string }, bucket: string): string {
  return `${range.from}|${range.to}|${bucket}`;
}

export function createCache<V>(load: (key: string) => Promise<V>, options: CacheOptions = {}) {
  const { ttl = 60_000, max = 20, now = Date.now } = options;
  const entries = new Map<string, { value: V; at: number }>();
  const inflight = new Map<string, Promise<V>>();

  function get(key: string): Promise<V> {
    const hit = entries.get(key);
    if (hit && now() - hit.at < ttl) return Promise.resolve(hit.value);
    entries.delete(key);

    const pending = inflight.get(key);
    if (pending) return pending;

    const request = load(key)
      .then((value) => {
        entries.set(key, { value, at: now() });
        while (entries.size > max) entries.delete(entries.keys().next().value as string);
        return value;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, request);
    return request;
  }

  /** Warm the cache; skipped when fresh or already loading, errors swallowed. */
  function prefetch(key: string): void {
    get(key).catch(() => {});
  }

  return { get, prefetch };
}
