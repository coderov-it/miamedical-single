import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailMessage } from './component/message.ts';
import { paragraph } from './component/paragraph.ts';
import { textBody } from './component/text.ts';

export function contractReady(input: {
  to: string;
  customerName: string;
  contractNumber: string;
  /** Null for manual contracts, which have no storefront order behind them. */
  orderNumber: string | null;
  signingUrl: string;
  language: 'it' | 'en';
}): EmailMessage {
  if (input.language === 'en') {
    const subject = `Your contract ${input.contractNumber} is ready for signing`;
    const readyLine = input.orderNumber
      ? `Your rental contract for order ${input.orderNumber} is ready.`
      : `Your rental contract ${input.contractNumber} is ready.`;
    return {
      to: [input.to],
      subject,
      html: `${header({ heading: subject, audience: 'customer' })}
${paragraph({ text: `Dear ${input.customerName},` })}
${paragraph({ text: `${readyLine} Please review the contract details and sign it electronically using the button below.` })}
${button({ href: input.signingUrl, label: 'Sign the contract' })}
${paragraph({ text: 'This link is valid for 30 days. If you have any questions about the contract, please contact us.' })}
${footer({ audience: 'customer' })}`,
      text: textBody(
        [
          `Dear ${input.customerName},`,
          '',
          readyLine,
          'Please review and sign it here:',
          input.signingUrl,
          '',
          'This link is valid for 30 days.',
        ],
        'customer',
      ),
    };
  }

  const subject = `Il tuo contratto ${input.contractNumber} è pronto per la firma`;
  const readyLine = input.orderNumber
    ? `Il tuo contratto di noleggio per l'ordine ${input.orderNumber} è pronto.`
    : `Il tuo contratto di noleggio ${input.contractNumber} è pronto.`;
  return {
    to: [input.to],
    subject,
    html: `${header({ heading: subject, audience: 'customer' })}
${paragraph({ text: `Gentile ${input.customerName},` })}
${paragraph({ text: `${readyLine} Ti preghiamo di verificare i dettagli del contratto e firmarlo elettronicamente utilizzando il pulsante qui sotto.` })}
${button({ href: input.signingUrl, label: 'Firma il contratto' })}
${paragraph({ text: 'Questo link è valido per 30 giorni. Per qualsiasi domanda sul contratto, non esitare a contattarci.' })}
${footer({ audience: 'customer' })}`,
    text: textBody(
      [
        `Gentile ${input.customerName},`,
        '',
        readyLine,
        'Puoi verificare e firmarlo qui:',
        input.signingUrl,
        '',
        'Questo link è valido per 30 giorni.',
      ],
      'customer',
    ),
  };
}
