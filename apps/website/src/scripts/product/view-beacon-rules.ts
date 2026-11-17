/**
 * The decisions behind the "product viewed" beacon, as pure functions so they
 * can be tested without a browser. `view-beacon.ts` does the I/O.
 */

/** A tab that reloads the same product within this window counts once. */
export const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

/** `sessionStorage` key holding the last-sent timestamp for one product. */
export function storageKey(productId: string): string {
  return `mia:product-view:${productId}`;
}

/** Parse a stored timestamp; anything that is not a finite number is "never". */
export function parseSentAt(raw: string | null): number | null {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** True when nothing was sent for this product in the last 30 minutes. */
export function isOutsideWindow(sentAt: number | null, now: number): boolean {
  if (sentAt === null) return true;
  // A timestamp from the future (clock change) must not mute the beacon forever.
  if (sentAt > now) return true;
  return now - sentAt >= DEDUPE_WINDOW_MS;
}

/** Automated browsers are not visitors; the server filters bots again. */
export function isAutomated(webdriver: boolean | undefined): boolean {
  return webdriver === true;
}
