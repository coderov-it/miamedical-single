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

  hours: {
    it: 'Lun–Sab, 9:00–19:00',
    en: 'Mon–Sat, 9:00–19:00',
  },
} as const;

export const LOCATIONS = [
  { city: 'Roma', street: 'Via Gian Pietro Talamini 44' },
  { city: 'Firenze', street: 'Viale Guidoni 129' },
] as const;

export const COMPANY = {
  legalName: 'MIA MEDICAL ITALIA S.R.L.',
  vat: '16028971006',
} as const;

/** Delivery areas offered by the home search selector. */
export const SERVICE_AREAS = [
  { value: 'rm', label: 'Roma e provincia' },
  { value: 'fi', label: 'Firenze e provincia' },
  { value: 'other', label: 'Altra zona' },
] as const;

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappE164.replace('+', '')}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
