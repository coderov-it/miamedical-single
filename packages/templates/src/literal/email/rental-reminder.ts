import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import { type EmailLanguage, LOCALE_TAG, type Translated } from './component/language.ts';
import type { EmailMessage } from './component/message.ts';
import { paragraph } from './component/paragraph.ts';
import { textBody } from './component/text.ts';

/** `2026-09-01` → `1 settembre 2026` / `1 September 2026`; anything unparseable passes through. */
function formatDate(date: string, language: EmailLanguage): string {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed)) return date;
  return new Intl.DateTimeFormat(LOCALE_TAG[language], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

interface ReminderFacts {
  name: string;
  order: string;
  product: string;
  endDate: string;
}

const COPY: Translated<{
  subject: (order: string) => string;
  salutation: (name: string) => string;
  reminder: (facts: ReminderFacts) => string;
  contactUs: string;
  canExtend: string;
  label: string;
}> = {
  it: {
    subject: (order) => `Promemoria noleggio – Ordine ${order}`,
    salutation: (name) => `Gentile ${name},`,
    reminder: (f) =>
      `Le ricordiamo che il noleggio del prodotto "${f.product}" (ordine ${f.order}) è in scadenza il ${f.endDate}.`,
    contactUs:
      'La preghiamo di contattarci per organizzare la riconsegna o per rinnovare il noleggio.',
    canExtend:
      'Se le serve ancora, può prolungare il noleggio dal suo ordine. Altrimenti la contatteremo per organizzare la riconsegna.',
    label: 'Prolunga il noleggio',
  },
  en: {
    subject: (order) => `Rental reminder – Order ${order}`,
    salutation: (name) => `Dear ${name},`,
    reminder: (f) =>
      `This is a reminder that your rental of "${f.product}" (order ${f.order}) ends on ${f.endDate}.`,
    contactUs: 'Please contact us to arrange the return or to renew the rental.',
    canExtend:
      'If you still need it, you can extend the rental from your order. Otherwise we will contact you to arrange the return.',
    label: 'Extend the rental',
  },
  fr: {
    subject: (order) => `Rappel de location – Commande ${order}`,
    salutation: (name) => `Bonjour ${name},`,
    reminder: (f) =>
      `Nous vous rappelons que la location de « ${f.product} » (commande ${f.order}) se termine le ${f.endDate}.`,
    contactUs: 'Merci de nous contacter pour organiser le retour ou pour renouveler la location.',
    canExtend:
      'Si vous en avez encore besoin, vous pouvez prolonger la location depuis votre commande. Sinon, nous vous contacterons pour organiser le retour.',
    label: 'Prolonger la location',
  },
  de: {
    subject: (order) => `Mieterinnerung – Bestellung ${order}`,
    salutation: (name) => `Guten Tag ${name},`,
    reminder: (f) =>
      `Wir möchten Sie daran erinnern, dass die Miete von „${f.product}“ (Bestellung ${f.order}) am ${f.endDate} endet.`,
    contactUs:
      'Bitte kontaktieren Sie uns, um die Rückgabe zu vereinbaren oder die Miete zu verlängern.',
    canExtend:
      'Wenn Sie es noch brauchen, können Sie die Miete in Ihrer Bestellung verlängern. Andernfalls kontaktieren wir Sie, um die Rückgabe zu vereinbaren.',
    label: 'Miete verlängern',
  },
};

export function rentalReminder(input: {
  to: string;
  customerName: string;
  orderNumber: string;
  productTitle: string;
  rentalEndDate: string;
  /** Set for a customer with an account: the order page, where they can extend online. */
  extendUrl?: string;
  language: EmailLanguage;
}): EmailMessage {
  const { language } = input;
  const copy = COPY[language];
  const subject = copy.subject(input.orderNumber);
  const salutation = copy.salutation(input.customerName);
  // Plain text into paragraph(), which escapes — markup here would render literally.
  const reminder = copy.reminder({
    name: input.customerName,
    order: input.orderNumber,
    product: input.productTitle,
    endDate: formatDate(input.rentalEndDate, language),
  });
  const next = input.extendUrl ? copy.canExtend : copy.contactUs;
  const action = input.extendUrl ? button({ href: input.extendUrl, label: copy.label }) : '';

  return {
    to: [input.to],
    subject,
    html: `${header({ heading: subject, audience: 'customer', language })}
${paragraph({ text: salutation })}
${paragraph({ text: reminder })}
${paragraph({ text: next })}
${action}
${footer({ audience: 'customer', language })}`,
    text: textBody(
      [salutation, '', reminder, '', next, ...(input.extendUrl ? ['', input.extendUrl] : [])],
      'customer',
      language,
    ),
  };
}
