import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailMessage } from './component/message.ts';
import { paragraph } from './component/paragraph.ts';
import { textBody } from './component/text.ts';

export function contractSigned(input: {
  to: string;
  customerName: string;
  contractNumber: string;
  /** Null for manual contracts, which have no storefront order behind them. */
  orderNumber: string | null;
  language: 'it' | 'en';
}): EmailMessage {
  const forOrderEn = input.orderNumber ? ` for order ${input.orderNumber}` : '';
  const forOrderIt = input.orderNumber ? ` per l'ordine ${input.orderNumber}` : '';
  if (input.language === 'en') {
    const subject = `Contract ${input.contractNumber} signed successfully`;
    return {
      to: [input.to],
      subject,
      html: `${header({ heading: subject, audience: 'customer' })}
${paragraph({ text: `Dear ${input.customerName},` })}
${paragraph({ text: `Your rental contract ${input.contractNumber}${forOrderEn} has been signed successfully.` })}
${paragraph({ text: 'A copy of the signed contract has been sent to this email address for your records.' })}
${paragraph({ text: 'If you have any questions, please do not hesitate to contact us.' })}
${footer({ audience: 'customer' })}`,
      text: textBody(
        [
          `Dear ${input.customerName},`,
          '',
          `Your rental contract ${input.contractNumber}${forOrderEn} has been signed successfully.`,
          '',
          'A copy of the signed contract has been sent to this email address.',
          '',
          'If you have any questions, please contact us.',
        ],
        'customer',
      ),
    };
  }

  const subject = `Contratto ${input.contractNumber} firmato con successo`;
  return {
    to: [input.to],
    subject,
    html: `${header({ heading: subject, audience: 'customer' })}
${paragraph({ text: `Gentile ${input.customerName},` })}
${paragraph({ text: `Il tuo contratto di noleggio ${input.contractNumber}${forOrderIt} è stato firmato con successo.` })}
${paragraph({ text: 'Una copia del contratto firmato è stata inviata a questo indirizzo email per i tuoi archivi.' })}
${paragraph({ text: 'Per qualsiasi domanda, non esitare a contattarci.' })}
${footer({ audience: 'customer' })}`,
    text: textBody(
      [
        `Gentile ${input.customerName},`,
        '',
        `Il tuo contratto di noleggio ${input.contractNumber}${forOrderIt} è stato firmato con successo.`,
        '',
        'Una copia del contratto firmato è stata inviata a questo indirizzo email.',
        '',
        'Per qualsiasi domanda, non esitare a contattarci.',
      ],
      'customer',
    ),
  };
}
