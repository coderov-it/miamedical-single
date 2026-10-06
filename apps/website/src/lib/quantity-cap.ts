/**
 * What a requested quantity becomes, and whether the customer has to be told.
 *
 * The cap (10 a line) stays — a larger order is a phone call, not a cart line —
 * but it is never applied in silence: `capped` is the signal to show the "more
 * than 10, contact us" message at the field that asked (CART-001, PUB-011).
 *
 *   requestQuantity(4,   10) → { quantity: 4,  capped: false }
 *   requestQuantity(11,  10) → { quantity: 10, capped: true }    "+" pressed at 10
 *   requestQuantity(999, 10) → { quantity: 10, capped: true }    typed
 *   requestQuantity(0,   10) → { quantity: 1,  capped: false }   the floor is the stepper's
 *   requestQuantity('x', 10) → { quantity: 1,  capped: false }
 *
 * No DOM and no imports, so the cart island and the product page share it.
 */
export interface QuantityRequest {
  quantity: number;
  capped: boolean;
}

export function requestQuantity(requested: unknown, max: number): QuantityRequest {
  const n = Math.trunc(Number(requested));
  if (!Number.isFinite(n) || n < 1) return { quantity: 1, capped: false };
  if (n > max) return { quantity: max, capped: true };
  return { quantity: n, capped: false };
}
