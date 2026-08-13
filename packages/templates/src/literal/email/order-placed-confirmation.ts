import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailMessage } from './component/message.ts';
import { greeting, orderLine, type OrderRef, type Recipient } from './component/order.ts';
import { paragraph } from './component/paragraph.ts';
import { reportLink } from './component/report-link.ts';
import { subheading } from './component/subheading.ts';
import { reportLinkText, textBody } from './component/text.ts';

/**
 * The account is already theirs, so this is a plain confirmation. It still carries the
 * report link — see `report-link.ts` for why all three order emails do.
 */

const ORDER_SECTION = 'Il tuo ordine';
const TRACK_SECTION = 'Segui il tuo ordine';

export function orderPlacedConfirmation(input: {
  to: string;
  recipient: Recipient;
  order: OrderRef;
  ordersUrl: string;
  reportUrl: string;
}): EmailMessage {
  const subject = `Abbiamo ricevuto il tuo ordine ${input.order.number}`;
  const line = orderLine(input.order);

  return {
    to: [input.to],
    subject,
    html: `${header({ heading: subject, audience: 'customer' })}
${paragraph({ text: greeting(input.recipient) })}
${paragraph({ text: 'Grazie, abbiamo ricevuto il tuo ordine e lo stiamo preparando.' })}
${subheading({ text: ORDER_SECTION })}
${paragraph({ text: line })}
${subheading({ text: TRACK_SECTION })}
${paragraph({ text: 'Trovi questo ordine e tutti i precedenti nella tua area clienti.' })}
${button({ href: input.ordersUrl, label: 'Vedi i tuoi ordini' })}
${reportLink({ reportUrl: input.reportUrl })}
${footer({ audience: 'customer' })}`,
    text: textBody(
      [
        greeting(input.recipient),
        '',
        'Grazie, abbiamo ricevuto il tuo ordine e lo stiamo preparando.',
        '',
        ORDER_SECTION.toUpperCase(),
        line,
        '',
        TRACK_SECTION.toUpperCase(),
        'Trovi questo ordine e tutti i precedenti qui:',
        input.ordersUrl,
        '',
        reportLinkText({ reportUrl: input.reportUrl }),
      ],
      'customer',
    ),
  };
}
