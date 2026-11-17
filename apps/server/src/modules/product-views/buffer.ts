/**
 * The in-memory view counter. One Map, `${romeDay}|${productId}` → views, with a
 * hard cap on distinct keys so a flood of random ids can never grow it without
 * bound. Pure: no clock, no database — `views.ts` owns the singleton.
 *
 *   record('2026-11-17|A')  ×3, record('2026-11-17|B') ×1   → { A: 3, B: 1 }
 *   take()    hands that Map out and starts a new empty one
 *   mergeBack(taken)  puts a failed flush's counts back, still under the cap
 */
export type ViewCounts = Map<string, number>;

export interface ViewBuffer {
  record(key: string): void;
  /** Swaps the live Map out; `dropped` counts keys refused since the last take. */
  take(): { counts: ViewCounts; dropped: number };
  mergeBack(counts: ViewCounts): void;
  size(): number;
}

export function createViewBuffer(maxKeys: number): ViewBuffer {
  let counts: ViewCounts = new Map();
  let dropped = 0;

  /** Adds `by` to `key`; a new key past the cap is refused. */
  const add = (key: string, by: number): boolean => {
    const current = counts.get(key);
    if (current === undefined && counts.size >= maxKeys) return false;
    counts.set(key, (current ?? 0) + by);
    return true;
  };

  return {
    record(key) {
      if (!add(key, 1)) dropped += 1;
    },
    take() {
      const taken = { counts, dropped };
      counts = new Map();
      dropped = 0;
      return taken;
    },
    mergeBack(returned) {
      for (const [key, by] of returned) if (!add(key, by)) dropped += 1;
    },
    size: () => counts.size,
  };
}
