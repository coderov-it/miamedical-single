import { button } from './button.ts';
import { footer } from './footer.ts';
import { header } from './header.ts';
import type { EmailLanguage, Translated } from './language.ts';
import type { EmailMessage } from './message.ts';
import { greeting, orderLine, type OrderRef, type Recipient } from './order.ts';
import { paragraph } from './paragraph.ts';
import { reportLink } from './report-link.ts';
import { subheading } from './subheading.ts';
import { reportLinkText, textBody } from './text.ts';

/**
 * The shape all three order emails share: greeting, thanks, the order line, one
 * section with one action, the report link. Only that second section differs —
 * activate, activate-again, or track — so each message file holds just its own
 * words and this file holds the frame, in every language, once.
 */

const SHARED: Translated<{
  subject: (number: string) => string;
  thanks: string;
  orderSection: string;
}> = {
  it: {
    subject: (number) => `Abbiamo ricevuto il tuo ordine ${number}`,
    thanks: 'Grazie, abbiamo ricevuto il tuo ordine e lo stiamo preparando.',
    orderSection: 'Il tuo ordine',
  },
  en: {
    subject: (number) => `We have received your order ${number}`,
    thanks: 'Thank you, we have received your order and are preparing it.',
    orderSection: 'Your order',
  },
  fr: {
    subject: (number) => `Nous avons bien reçu votre commande ${number}`,
    thanks: 'Merci, nous avons bien reçu votre commande et nous la préparons.',
    orderSection: 'Votre commande',
  },
  de: {
    subject: (number) => `Wir haben Ihre Bestellung ${number} erhalten`,
    thanks: 'Vielen Dank, wir haben Ihre Bestellung erhalten und bereiten sie vor.',
    orderSection: 'Ihre Bestellung',
  },
};

/** The one section that differs between the three messages. */
export interface OrderEmailSection {
  /** Optional line after the thanks — the new-account mail's WhatsApp promise. */
  afterThanks?: string;
  title: string;
  /** The HTML paragraph above the button. */
  body: string;
  /** The plain-text line that introduces the bare URL. */
  textLead: string;
  label: string;
  href: string;
  /** Printed under the button, in both bodies. */
  note?: string;
}

export function orderEmail(input: {
  to: string;
  recipient: Recipient;
  order: OrderRef;
  reportUrl: string;
  language: EmailLanguage;
  section: OrderEmailSection;
}): EmailMessage {
  const { language, section } = input;
  const shared = SHARED[language];
  const subject = shared.subject(input.order.number);
  const hello = greeting(input.recipient, language);
  const line = orderLine(input.order, language);
  const note = section.note ? paragraph({ text: section.note }) : '';
  const afterThanks = section.afterThanks ? ` ${section.afterThanks}` : '';

  return {
    to: [input.to],
    subject,
    html: `${header({ heading: subject, audience: 'customer', language })}
${paragraph({ text: hello })}
${paragraph({ text: `${shared.thanks}${afterThanks}` })}
${subheading({ text: shared.orderSection })}
${paragraph({ text: line })}
${subheading({ text: section.title })}
${paragraph({ text: section.body })}
${button({ href: section.href, label: section.label })}
${note}
${reportLink({ reportUrl: input.reportUrl, language })}
${footer({ audience: 'customer', language })}`,
    text: textBody(
      [
        hello,
        '',
        shared.thanks,
        ...(section.afterThanks ? [section.afterThanks] : []),
        '',
        shared.orderSection.toUpperCase(),
        line,
        '',
        section.title.toUpperCase(),
        section.textLead,
        section.href,
        ...(section.note ? [section.note] : []),
        '',
        reportLinkText({ reportUrl: input.reportUrl, language }),
      ],
      'customer',
      language,
    ),
  };
}
