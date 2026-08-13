import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailMessage } from './component/message.ts';
import { greeting, orderLine, type OrderRef, type Recipient } from './component/order.ts';
import { paragraph } from './component/paragraph.ts';
import { reportLink } from './component/report-link.ts';
import { subheading } from './component/subheading.ts';
import { reportLinkText, textBody } from './component/text.ts';

/** They have ordered before but never activated. Same offer, different framing. */

const ORDER_SECTION = 'Il tuo ordine';
const ACCOUNT_SECTION = 'La tua area clienti';

export function orderPlacedActivateReminder(input: {
  to: string;
  recipient: Recipient;
  order: OrderRef;
  activationUrl: string;
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
${subheading({ text: ACCOUNT_SECTION })}
${paragraph({ text: 'La tua area clienti non è ancora attiva. Attivandola trovi questo ordine e tutti i precedenti in un unico posto.' })}
${button({ href: input.activationUrl, label: 'Attiva il tuo account' })}
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
        ACCOUNT_SECTION.toUpperCase(),
        'La tua area clienti non è ancora attiva. Attivala qui:',
        input.activationUrl,
        '',
        reportLinkText({ reportUrl: input.reportUrl }),
      ],
      'customer',
    ),
  };
}
