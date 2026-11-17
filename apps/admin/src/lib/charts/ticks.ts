/** Axis tick helpers shared by every chart. Pure, so node:test can import them. */

/** Integer y ticks from 0 up to a top that covers `max`, at most ~5 of them. */
export function integerTicks(max: number): number[] {
  const top = Math.max(1, Math.ceil(max));
  const step = Math.ceil(top / 5);
  const ticks: number[] = [];
  for (let value = 0; value < top + step; value += step) {
    ticks.push(value);
    if (value >= top) break;
  }
  return ticks;
}
