import { createViewBuffer, type ViewBuffer, type ViewCounts } from './buffer.ts';

/** One row of the upsert: a product's views on a Rome day. */
export type ViewRow = { productId: string; day: string; views: number };
export type ViewWriter = (rows: ViewRow[]) => Promise<void>;

/**
 * The buffer plus its flush. `flush()` swaps the Map out FIRST, so views that
 * arrive while the write is in flight land in the new one; if the write throws,
 * the swapped counts are merged back (bounded by the cap) so a database blip
 * loses nothing. Flushes never overlap: a second call waits for the first.
 */
export function createViewCounter(maxKeys: number, write: ViewWriter) {
  const buffer: ViewBuffer = createViewBuffer(maxKeys);
  let flushedAt: Date | null = null;
  let chain: Promise<void> = Promise.resolve();

  async function run(): Promise<void> {
    const { counts, dropped } = buffer.take();
    if (dropped > 0) console.error(`[product-views] buffer full, dropped ${dropped}`);
    try {
      if (counts.size > 0) await write(toRows(counts));
      flushedAt = new Date();
    } catch (error) {
      buffer.mergeBack(counts);
      console.error('[product-views] flush failed, counts kept for the next try', error);
    }
  }

  return {
    record: (day: string, productId: string) => buffer.record(`${day}|${productId}`),
    flush(): Promise<void> {
      chain = chain.then(run);
      return chain;
    },
    flushedAt: () => flushedAt,
    pending: () => buffer.size(),
  };
}

function toRows(counts: ViewCounts): ViewRow[] {
  return [...counts].map(([key, views]) => {
    const [day, productId] = key.split('|') as [string, string];
    return { day, productId, views };
  });
}
