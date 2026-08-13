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
 * First order from an address we have never seen: the account exists but nobody has
 * claimed it. One message does both jobs — confirms the order and invites them in —
 * because two emails for one event reads as a mistake.
 *
 * Two sections, because there are two subjects: the order, which is settled and needs
 * nothing from them, and the account, which needs one click. The section labels are
 * consts so the HTML heading and the plain-text one cannot drift apart.
 */

const ORDER_SECTION = 'Il tuo ordine';
const ACCOUNT_SECTION = 'La tua area clienti';

export function orderPlacedNewAccount(input: {
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
${paragraph({ text: 'Grazie, abbiamo ricevuto il tuo ordine e lo stiamo preparando. Ti contatteremo su WhatsApp per confermare i dettagli.' })}
${subheading({ text: ORDER_SECTION })}
${paragraph({ text: line })}
${subheading({ text: ACCOUNT_SECTION })}
${paragraph({ text: 'Abbiamo creato la tua area clienti: attivala per seguire questo ordine e vedere quelli futuri.' })}
${button({ href: input.activationUrl, label: 'Attiva il tuo account' })}
${paragraph({ text: 'Il link è valido per 7 giorni e può essere usato una sola volta.' })}
${reportLink({ reportUrl: input.reportUrl })}
${footer({ audience: 'customer' })}`,
    text: textBody(
      [
        greeting(input.recipient),
        '',
        'Grazie, abbiamo ricevuto il tuo ordine e lo stiamo preparando.',
        'Ti contatteremo su WhatsApp per confermare i dettagli.',
        '',
        ORDER_SECTION.toUpperCase(),
        line,
        '',
        ACCOUNT_SECTION.toUpperCase(),
        'Abbiamo creato la tua area clienti. Attivala qui (valido 7 giorni, un solo uso):',
        input.activationUrl,
        '',
        reportLinkText({ reportUrl: input.reportUrl }),
      ],
      'customer',
    ),
  };
}
