/**
 * The lock that makes a duplicate order impossible from this page.
 *
 * Every `POST /api/orders` inserts a new order, so the browser is the only
 * thing standing between one click and two orders. This module is the memory
 * that survives a reload, a back button and a second tab; `place-order.ts`
 * drives it. The state machine, for ONE checkout (one set of line items):
 *
 *   idle ──click──→ sending ──201──────────→ placed     (final; cart lines cleared)
 *                     │    ──4xx──────────→ idle       (refused before anything was written)
 *                     │    ──5xx/timeout/
 *                     │      dropped link─→ uncertain  (it may exist — never re-POSTed)
 *                     └─ another tab holds it ──→ uncertain until that tab writes its outcome
 *
 *   load / other tab wrote:  placed record → placed panel, sending|uncertain → uncertain
 *
 * WHY 4xx IS THE ONLY WAY BACK TO IDLE: the server refuses a body (422), a rate
 * (429) or a route before it opens the transaction, so a 4xx proves nothing was
 * written. Anything else — a 5xx, our own timeout, a fetch that rejected — can
 * arrive AFTER the commit: the confirmation email and the contract run between
 * the commit and the response, which widens exactly that window. Re-sending
 * then would be the second order, so the page says "it may already be there"
 * and points at the inbox, the customer area and WhatsApp instead.
 *
 * The record lives in `localStorage` for `RECORD_TTL_MS`, keyed by a hash of the
 * line items, so it outlives a reload and is shared by every tab. Two tabs that
 * click in the same instant are serialised by the Web Locks API where the
 * browser has it; without it, the record narrows the race to a few
 * milliseconds. Every storage access is wrapped: private mode or a full quota
 * degrades to a lock that lasts as long as this page, never to an error.
 *
 * `~/lib/cart-store` is imported because it imports nothing — see context.ts.
 */
import { lineKey, readCartLines, writeCartLines } from '~/lib/cart-store';

export type PlacementRecord =
  | { status: 'sending' | 'uncertain'; at: number }
  | { status: 'placed'; at: number; order: unknown };

const KEY_PREFIX = 'mia.checkout.placement.v1.';

/**
 * How long an outcome is remembered. Long enough to cover a reload, a back
 * button or a second look in another tab; short enough that the same order can
 * be placed again on purpose later — by then the customer has had the email.
 */
const RECORD_TTL_MS = 30 * 60_000;

/** FNV-1a, 32-bit, over the line items — an identity, not a security boundary. */
function fingerprint(items: unknown[]): string {
  const input = JSON.stringify(items);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function isRecord(value: unknown): value is PlacementRecord {
  if (typeof value !== 'object' || value === null) return false;
  const { status, at } = value as Record<string, unknown>;
  const known = status === 'sending' || status === 'uncertain' || status === 'placed';
  return known && typeof at === 'number';
}

export interface PlacementLock {
  /** The live record for this checkout, or null. An expired one reads as null. */
  read: () => PlacementRecord | null;
  write: (record: PlacementRecord) => void;
  clear: () => void;
  /**
   * Runs `task` while holding the cross-tab lock. `null` means another tab
   * holds it right now — that tab is sending this very order.
   */
  exclusive: <T>(task: () => Promise<T>) => Promise<T | null>;
  /** Called when ANOTHER tab changes this checkout's record. */
  onChange: (listener: () => void) => void;
}

export function createPlacementLock(items: unknown[]): PlacementLock {
  const key = KEY_PREFIX + fingerprint(items);

  function clear(): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* Storage refused: nothing was stored either. */
    }
  }

  function read(): PlacementRecord | null {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    } catch {
      return null;
    }
    if (!isRecord(parsed)) return null;
    if (Date.now() - parsed.at > RECORD_TTL_MS) {
      clear();
      return null;
    }
    return parsed;
  }

  function write(record: PlacementRecord): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(record));
    } catch {
      /* The in-page phase still locks this tab; only the memory is lost. */
    }
  }

  async function exclusive<T>(task: () => Promise<T>): Promise<T | null> {
    const locks = 'locks' in navigator ? navigator.locks : undefined;
    if (!locks) return task();
    return locks.request(key, { ifAvailable: true }, (held) => (held ? task() : null));
  }

  function onChange(listener: () => void): void {
    window.addEventListener('storage', (event) => {
      if (event.key === key || event.key === null) listener();
    });
  }

  return { read, write, clear, exclusive, onChange };
}

/**
 * Takes the lines this order contained out of the browser cart — and only
 * those: anything added since, or never part of this checkout, stays.
 *
 * Matched by `lineKey()`, the cart's own row identity, which the server
 * computed for each line of this page (`Checkout.items[].cartKey`).
 */
export function clearOrderedCartLines(cartKeys: string[]): void {
  if (cartKeys.length === 0) return;
  const ordered = new Set(cartKeys);
  const lines = readCartLines();
  const remaining = lines.filter((line) => !ordered.has(lineKey(line.config)));
  if (remaining.length !== lines.length) writeCartLines(remaining);
}
