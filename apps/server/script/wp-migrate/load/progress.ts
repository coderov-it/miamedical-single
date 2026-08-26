/**
 * What the loader prints while it works, and how fast it is allowed to work.
 *
 * Both exist for the same reason: against a remote database every statement
 * costs a round trip (274 ms to the dev box), so a full load is ~1,300 of them.
 * Serially that is thirteen silent minutes, which reads as a hung process.
 * `runPhase` spends the latency in parallel and says where it is while doing it.
 */

/**
 * Matched to `createDatabase`'s default pool (`max: 10`) — more in flight than
 * the pool holds only queues inside postgres.js, it does not go faster.
 */
export const POOL = 10;

const LABEL_WIDTH = 21;
/** Interim lines at most once a second: progress, not a firehose. */
const TICK_MS = 1000;

const pad = (label: string): string => label.padEnd(LABEL_WIDTH);

/**
 * Run `write` over every item, `POOL` at a time, reporting as it goes:
 *
 *   spec_values          180/430
 *   spec_values          430
 *
 * Items within a phase are independent — every id is a UUIDv5 fixed by
 * `ids.ts` and every write is an upsert on it — so order does not matter.
 * Phases stay sequential, because the later ones point at the earlier ones.
 */
export async function runPhase<T>(
  label: string,
  items: readonly T[],
  write: (item: T) => Promise<void>,
  summary?: () => string,
): Promise<void> {
  let done = 0;
  let ticked = Date.now();
  const queue = [...items];

  const worker = async (): Promise<void> => {
    for (;;) {
      const item = queue.shift();
      if (item === undefined) return;
      await write(item);
      done++;
      if (Date.now() - ticked >= TICK_MS && done < items.length) {
        ticked = Date.now();
        console.log(`${pad(label)}${done}/${items.length}`);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(POOL, items.length) }, worker));
  console.log(`${pad(label)}${summary ? summary() : items.length}`);
}

/**
 * One line per object for the media phases, where each item is a HEAD and
 * possibly a download, a sharp pass and an upload — seconds each, not
 * milliseconds, so a per-item line is the right granularity:
 *
 *   media  [ 38/291] up     products/8f2…/12524-Cuscino.webp  142 KB  1.2s
 *   media  [ 39/291] reuse  products/8f2…/12518-Rialzo.webp
 */
export function objectReporter(
  label: string,
  total: number,
): (verdict: 'up' | 'reuse' | 'fail', key: string, detail?: string) => void {
  const width = String(total).length;
  let done = 0;
  return (verdict, key, detail = '') => {
    done++;
    const counter = `[${String(done).padStart(width)}/${total}]`;
    console.log(`${label}  ${counter} ${verdict.padEnd(5)}  ${key}${detail ? `  ${detail}` : ''}`);
  };
}

export const kb = (bytes: number): string => `${Math.round(bytes / 1024)} KB`;
export const secs = (startedAt: number): string =>
  `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
