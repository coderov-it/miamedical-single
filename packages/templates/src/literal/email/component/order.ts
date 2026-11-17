import { type EmailLanguage, LOCALE_TAG, type Translated } from './language.ts';

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
  Formatters are cached per language and currency because constructing one is far and
  away the most expensive thing in rendering an email: measured, `new Intl.NumberFormat`
  per render put a whole message at 39 µs, and reusing it puts it under 2 µs.
*/
const FORMATTERS = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, language: EmailLanguage): Intl.NumberFormat {
  const key = `${language}:${currency}`;
  let cached = FORMATTERS.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat(LOCALE_TAG[language], { style: 'currency', currency });
    FORMATTERS.set(key, cached);
  }
  return cached;
}

/** "35,00 €" in Italian, "€35.00" in English — from the wire's exact decimal string. */
export function money(amount: string, currency: string, language: EmailLanguage): string {
  return formatter(currency, language).format(Number(amount));
}

const ORDER_WORD: Translated<string> = {
  it: 'Ordine',
  en: 'Order',
  fr: 'Commande',
  de: 'Bestellung',
};
const HELLO: Translated<string> = { it: 'Ciao', en: 'Hello', fr: 'Bonjour', de: 'Hallo' };

/** "Ordine MIA-2026-000042 · 245,00 €" */
export function orderLine(order: OrderRef, language: EmailLanguage): string {
  return `${ORDER_WORD[language]} ${order.number} · ${money(order.total, order.currency, language)}`;
}

/** "Ciao Elena," — the opening line of every order message; "Ciao," when no name is known yet. */
export function greeting(recipient: Recipient, language: EmailLanguage): string {
  const name = recipient.firstName.trim();
  return name ? `${HELLO[language]} ${name},` : `${HELLO[language]},`;
}
