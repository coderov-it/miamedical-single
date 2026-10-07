/**
 * Today in the shop's time zone, ISO `YYYY-MM-DD` — the floor for a rental's
 * start. One function, so the product page's date picker, the cart and the
 * checkout agree on when a start date has gone by.
 */
export function todayInRome(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
