/**
 * `POST /api/cart/resolve` — prices the browser's cart.
 *
 * The cart lives in `localStorage`, so the server cannot render it on first paint
 * and the island has to ask. This is the only reason the endpoint exists: it is
 * the seam that keeps every title, label and amount server-derived even though
 * the list of lines is client-held. See docs/code/storefront-cart.md.
 *
 * It is NOT a cart API. It stores nothing, mutates nothing and identifies nobody;
 * it takes lines in and hands priced rows back, so two tabs, two devices or two
 * visits share no state through it. A cart that survives a device change needs
 * the real `/api/cart` this project still lists as a known gap.
 *
 * POST rather than GET because a 20-line cart outgrows a URL, and because none of
 * a customer's configuration belongs in a proxy log or in browser history.
 */
import type { APIRoute } from 'astro';

import { resolveCart } from '~/lib/cart';
import { type CartLine, parseCartLines } from '~/lib/cart-store';

export const prerender = false;

/** The one shape this accepts: `{ lines: CartLine[] }`, the store's own shape. */
interface ResolveBody {
  lines?: unknown;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Built from one person's request configuration. Never cache, never store.
      'cache-control': 'no-store, max-age=0',
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: ResolveBody;
  try {
    body = (await request.json()) as ResolveBody;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  /*
   * Validated by the SAME parser the browser reads its store with, rather than a
   * second schema here. The store is the untrusted input in both directions — a
   * crafted POST and a hand-edited `localStorage` are the same threat — so one
   * parser means they cannot disagree about what a line is. It re-stringifies
   * because `parseCartLines` takes the raw JSON text.
   */
  const lines: CartLine[] = parseCartLines(JSON.stringify(body.lines ?? []));

  /* No length check here on purpose: `parseCartLines` stops at MAX_CART_LINES, so
     an over-long cart is truncated by the parser rather than rejected. A customer
     whose 25th row is silently absent is a better failure than a cart page that
     refuses to load — and the ceiling exists to bound product reads, which
     truncation bounds just as well. */
  return jsonResponse(await resolveCart(lines));
};
