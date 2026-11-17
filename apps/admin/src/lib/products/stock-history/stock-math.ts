/** Pure helpers, kept apart from the translated labels so node:test can import them. */

/** `+2` / `−1` — the sign is text, so the change reads without colour. */
export function signedDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return '0';
}
