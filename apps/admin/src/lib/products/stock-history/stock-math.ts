/** Pure helpers, kept apart from the translated labels so node:test can import them. */

/** `+2` / `−1` — the sign is text, so the change reads without colour. */
export function signedDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return '0';
}

/** Integer y ticks from 0 up to a top that covers `max`, at most ~5 of them. */
export function stockTicks(max: number): number[] {
  const top = Math.max(1, Math.ceil(max));
  const step = Math.ceil(top / 5);
  const ticks: number[] = [];
  for (let value = 0; value < top + step; value += step) {
    ticks.push(value);
    if (value >= top) break;
  }
  return ticks;
}
