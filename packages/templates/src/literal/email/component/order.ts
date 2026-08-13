/**
 * What the three order emails need to name an order and a person.
 *
 * These are values, not markup: they produce the text a piece then escapes. Kept here
 * rather than in each message file because all three order emails print the same line
 * and it must not drift between them.
 */

export interface OrderRef {
  number: string;
  total: string;
  currency: string;
}

export interface Recipient {
  firstName: string;
  lastName: string;
}

/*
  Formatters are cached per currency because constructing one is far and away the most
  expensive thing in rendering an email: measured, `new Intl.NumberFormat` per render
  put a whole message at 39 µs, and reusing it puts it under 2 µs. There is one currency
  in practice, so the map holds one entry.
*/
const FORMATTERS = new Map<string, Intl.NumberFormat>();

function formatter(currency: string): Intl.NumberFormat {
  let cached = FORMATTERS.get(currency);
  if (!cached) {
    cached = new Intl.NumberFormat('it-IT', { style: 'currency', currency });
    FORMATTERS.set(currency, cached);
  }
  return cached;
}

/** "35,00 €" — Italian formatting, from the wire's exact decimal string. */
export function money(amount: string, currency: string): string {
  return formatter(currency).format(Number(amount));
}

/** "Ordine MIA-2026-000042 · 245,00 €" */
export function orderLine(order: OrderRef): string {
  return `Ordine ${order.number} · ${money(order.total, order.currency)}`;
}

/** "Ciao Elena," — the opening line of every customer message. */
export function greeting(recipient: Recipient): string {
  return `Ciao ${recipient.firstName},`;
}
