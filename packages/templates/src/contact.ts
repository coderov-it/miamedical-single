/**
 * The channels an email offers instead of a reply.
 *
 * Emails are sent from a no-reply address that receives nothing, so every
 * customer-facing message has to name a way to reach a human. These are those
 * ways, in the order the footer presents them: WhatsApp first because it is how
 * orders are already confirmed, the free-phone number second.
 *
 * ⚠️ Still duplicated in `CONTACT` in `apps/website/src/lib/site.ts`. Change one and
 * you must change the other. Unlike `links.ts`, which duplicates `routes.ts` because
 * the server cannot import from the website app, this copy no longer has to exist: it
 * lives in a package both apps can import, so the website's copy can be deleted the
 * next time that file is touched. Both are marked TEMPORARY at the website end,
 * pending the `/api/site` read model that would give organisation facts a single home.
 */

export const CONTACT = {
  whatsappE164: '+393926509237',
  phoneE164: '+39800031962',
  phoneDisplay: '800 031962',
  hours: 'Lun–Sab, 9:00–19:00',
} as const;

/**
 * Bank transfer coordinates printed on the Italian rental contracts, exactly as
 * they appear on the official documents in `blank-contracts /`.
 */
export const BANK = {
  iban: 'IT80R0569603211000011773X40',
  accountHolder: 'MIA MEDICAL ITALIA S.R.L.',
  bankName: 'Banca Popolare di Sondrio',
} as const;

/**
 * `wa.me` rather than `api.whatsapp.com`: it resolves to the app on a phone and to
 * WhatsApp Web on a desktop, which is the difference between a working button and a
 * dead one for whoever opens the email where.
 */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappE164.replace('+', '')}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
