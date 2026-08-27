import { contactFooter } from './component/contact-footer.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailMessage } from './component/message.ts';
import { paragraph } from './component/paragraph.ts';
import { textBody } from './component/text.ts';

/** `2026-09-01` → `1 settembre 2026`; anything unparseable passes through. */
function formatDateIt(date: string): string {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed)) return date;
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function rentalReminder(input: {
  to: string;
  customerName: string;
  orderNumber: string;
  productTitle: string;
  rentalEndDate: string;
}): EmailMessage {
  const subject = `Promemoria noleggio – Ordine ${input.orderNumber}`;
  const endDate = formatDateIt(input.rentalEndDate);
  // Plain text into paragraph(), which escapes — markup here would render literally.
  const reminder = `Le ricordiamo che il noleggio del prodotto "${input.productTitle}" (ordine ${input.orderNumber}) è in scadenza il ${endDate}.`;
  return {
    to: [input.to],
    subject,
    html: `${header({ heading: subject, audience: 'customer' })}
${paragraph({ text: `Gentile ${input.customerName},` })}
${paragraph({ text: reminder })}
${paragraph({ text: 'La preghiamo di contattarci per organizzare la riconsegna o per rinnovare il noleggio.' })}
${contactFooter()}
${footer({ audience: 'customer' })}`,
    text: textBody(
      [
        `Gentile ${input.customerName},`,
        '',
        reminder,
        '',
        'La preghiamo di contattarci per organizzare la riconsegna o per rinnovare il noleggio.',
      ],
      'customer',
    ),
  };
}
