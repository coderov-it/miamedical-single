/**
 * The locale a browser script should format dates and money in.
 *
 * `<html lang>` is already the storefront's per-request locale — `BaseLayout`
 * sets it from `localeTag()`, so it is always a BCP-47 tag Intl accepts
 * ("it-IT" or "en-GB"). Reading it back is what keeps a client-side
 * `Intl.DateTimeFormat` in step with the server-rendered page around it.
 *
 * Every one of these formatters used to be constructed with a literal
 * `'it-IT'`. On the Italian storefront that was invisible; on the English one
 * the calendar named its months in Italian and the estimate printed
 * "1.843,00 €" underneath an English "€1,843.00" (owner, 2026-08-30).
 */
export function documentLocale(): string {
  return document.documentElement.lang || 'it-IT';
}
