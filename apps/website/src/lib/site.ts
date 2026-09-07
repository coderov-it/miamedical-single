/**
 * Organisation facts: contact channels, locations, legal identity.
 *
 * TEMPORARY — these belong to an `/api/site` read model so the storefront,
 * JSON-LD and the back office cannot drift apart. See the "Known gaps" section
 * of docs/code/storefront-design-system.md.
 */
export const CONTACT = {
  /** Numero verde, free from Italian landlines and mobiles. */
  phoneE164: '+39800031962',
  phoneDisplay: '800 031962',

  whatsappE164: '+393926509237',
  whatsappDisplay: '+39 392 65 09 237',

  email: 'info@miamedicalitalia.it',
} as const;

/**
 * Opening hours read as a sentence, so they are UI copy and live in the message
 * catalogue with every other sentence — `translate(locale, 'contact.hours')`.
 * They used to be a `{ it, en }` literal here, which meant seven call sites
 * indexed it by locale and all seven broke on the third language.
 */
export const CONTACT_HOURS_KEY = 'contact.hours';

export const LOCATIONS = [
  { city: 'Roma', street: 'Via Gian Pietro Talamini 44' },
  { city: 'Firenze', street: 'Viale Guidoni 129' },
] as const;

export const COMPANY = {
  legalName: 'MIA MEDICAL ITALIA S.R.L.',
  vat: '16028971006',
} as const;

/**
 * Delivery areas offered by the home search selector.
 *
 * `label` is what the selector and the catalogue's "la tua richiesta" line say;
 * `city` is what the product page prints beside a pin. "Altra zona" has no city
 * because its exact delivery location is settled during the confirmation call.
 */
export const SERVICE_AREAS = [
  { value: 'rm', label: 'Roma', city: 'Roma' },
  { value: 'fi', label: 'Firenze', city: 'Firenze' },
  { value: 'other', label: 'Altra zona', city: null },
] as const;

/** The city to print for a carried `area`, or null when there is none to print. */
export function serviceAreaCity(value: string | null | undefined): string | null {
  if (!value) return null;
  return SERVICE_AREAS.find((area) => area.value === value)?.city ?? null;
}

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappE164.replace('+', '')}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
