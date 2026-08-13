import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailMessage } from './component/message.ts';
import type { OrderRef } from './component/order.ts';
import { paragraph } from './component/paragraph.ts';
import { subheading } from './component/subheading.ts';
import { textBody } from './component/text.ts';

/**
 * Internal alert for a disputed order. English, unlike every other message here, and
 * the one that gets no contact footer: its readers have the admin panel.
 *
 * Sectioned harder than the customer messages, because it is read under time pressure:
 * whoever opens it needs the order, then the customer's words, then what to do, and
 * should not have to read a paragraph to find out which is which.
 */

const DETAILS_SECTION = 'Order details';
const MESSAGE_SECTION = 'Their message';
const ACTION_SECTION = 'What to do';

export function adminDisputeAlert(input: {
  to: string[];
  order: OrderRef;
  orderEmail: string;
  reportedPhone: string;
  message: string;
  adminUrl: string;
}): EmailMessage {
  const subject = `Disputed order ${input.order.number}`;

  /*
    `input.message` is the only customer free text any message prints. It goes through
    `paragraph`, which escapes it, so a dispute message containing markup cannot become
    markup in an operator's inbox — and `preLine` keeps the breaks they typed.
  */
  return {
    to: input.to,
    subject,
    html: `${header({ heading: subject, audience: 'internal' })}
${paragraph({ text: `Somebody reports they did not place order ${input.order.number}.` })}
${subheading({ text: DETAILS_SECTION })}
${paragraph({ text: `Order email: ${input.orderEmail}` })}
${paragraph({ text: `WhatsApp number they gave: ${input.reportedPhone}` })}
${subheading({ text: MESSAGE_SECTION })}
${paragraph({ text: input.message, preLine: true })}
${subheading({ text: ACTION_SECTION })}
${paragraph({ text: 'Contact them on WhatsApp before changing anything on the order.' })}
${button({ href: input.adminUrl, label: 'Open in the admin panel' })}
${footer({ audience: 'internal' })}`,
    text: textBody(
      [
        `Somebody reports they did not place order ${input.order.number}.`,
        '',
        DETAILS_SECTION.toUpperCase(),
        `Order email:  ${input.orderEmail}`,
        `WhatsApp:     ${input.reportedPhone}`,
        '',
        MESSAGE_SECTION.toUpperCase(),
        input.message,
        '',
        ACTION_SECTION.toUpperCase(),
        'Contact them on WhatsApp before changing anything on the order.',
        `Admin: ${input.adminUrl}`,
      ],
      'internal',
    ),
  };
}
