/**
 * 60 s response cache for the sales endpoint, keyed by the normalised query.
 * Per process; the sweep clears it after any rebuild that touched days.
 */

const TTL_MS = 60_000;
const entries = new Map<string, { expires: number; value: unknown }>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = entries.get(key);
  if (!hit || hit.expires <= Date.now()) return undefined;
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown): void {
  const now = Date.now();
  for (const [k, e] of entries) if (e.expires <= now) entries.delete(k);
  entries.set(key, { expires: now + TTL_MS, value });
}

export function cacheClear(): void {
  entries.clear();
}
