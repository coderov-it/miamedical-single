/**
 * One `POST /api/orders`, and what its answer PROVES about the order.
 *
 * The caller never sees a status code, only one of three outcomes, because the
 * only question that matters afterwards is "may the customer send this again?":
 *
 *   201 / 2xx                      placed      → never again
 *   4xx (422, 429, …)              rejected    → yes: nothing was written
 *   5xx, timeout, fetch rejected   uncertain   → NO: it may have committed
 *
 * A fetch that rejects cannot tell "never left the browser" from "the link
 * dropped while the server was committing", so it is uncertain too. The one
 * failure that is provably before sending — the browser reporting itself
 * offline — is checked by the caller before this runs.
 */

export interface PlacedOrder {
  number: string;
  totals: { total: string; currency: string };
  /**
   * `'activate'` when this order left behind an account nobody has claimed yet.
   * The page cannot work this out for itself — whether the address was already
   * activated is something only the server knows — so it is told.
   */
  accountInvite: 'activate' | null;
}

export type SubmitOutcome =
  /** `order` is null when the order exists but its body could not be read. */
  | { kind: 'placed'; order: PlacedOrder | null }
  /** Server field paths (`customer.email`) → its message. Empty when none. */
  | { kind: 'rejected'; fields: Record<string, string> }
  | { kind: 'uncertain' };

/**
 * Generous on purpose: placement sends an email and may render a contract
 * before it answers. Past this the customer is told the outcome is unknown
 * rather than left looking at "Invio in corso…" indefinitely.
 */
const RESPONSE_TIMEOUT_MS = 60_000;

async function readOrder(response: Response): Promise<PlacedOrder | null> {
  try {
    const payload = (await response.json()) as { data?: PlacedOrder };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

/** `{ error: { fields } }`, the envelope `validate()` and `reject()` share. */
export async function readFields(response: Response): Promise<Record<string, string>> {
  try {
    const payload = (await response.json()) as { error?: { fields?: unknown } };
    const fields = payload.error?.fields;
    if (typeof fields !== 'object' || fields === null) return {};
    return Object.fromEntries(
      Object.entries(fields).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
}

export async function submitOrder(apiBase: string, body: unknown): Promise<SubmitOutcome> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), RESPONSE_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${apiBase}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // The API is a different origin, so without this the customer session
      // cookie never arrives and a signed-in order links as `unverified` — the
      // one thing being signed in is supposed to settle. Checkout stays usable
      // without a session; this only matters when there is one.
      credentials: 'include',
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    return { kind: 'uncertain' };
  } finally {
    window.clearTimeout(timer);
  }

  if (response.ok) return { kind: 'placed', order: await readOrder(response) };
  if (response.status >= 500) return { kind: 'uncertain' };
  return { kind: 'rejected', fields: await readFields(response) };
}
