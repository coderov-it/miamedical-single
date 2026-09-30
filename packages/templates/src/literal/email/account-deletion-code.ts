import { COLORS } from '../../brand.ts';
import { escapeHtml } from './component/escape.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailMessage } from './component/message.ts';
import { paragraph } from './component/paragraph.ts';
import { textBody } from './component/text.ts';

/**
 * The code that proves inbox ownership on `/delete-profile/`. A code rather
 * than a link: the customer is already standing on the page, often inside the
 * app's web view, and a link would open a second browser mid-flow.
 */
export function accountDeletionCode(input: { to: string; code: string }): EmailMessage {
  const subject = 'Codice per eliminare il tuo profilo';

  return {
    to: [input.to],
    subject,
    html: `${header({ heading: subject, audience: 'customer' })}
${paragraph({ text: 'Hai chiesto di eliminare il tuo profilo Mia Medical Italia. Inserisci questo codice nella pagina di eliminazione:' })}
<p style="margin:24px 0;color:${COLORS.ink};font-size:32px;font-weight:700;letter-spacing:8px;text-align:center">${escapeHtml(input.code)}</p>
${paragraph({ text: 'Il codice scade tra 15 minuti.' })}
${paragraph({ text: 'Se non hai fatto questa richiesta, ignora questa email: il tuo profilo resta com’è.' })}
${footer({ audience: 'customer' })}`,
    text: textBody(
      [
        'Hai chiesto di eliminare il tuo profilo Mia Medical Italia.',
        `Il tuo codice: ${input.code}`,
        '',
        'Scade tra 15 minuti.',
        'Se non hai fatto questa richiesta, ignora questa email: il tuo profilo resta com’è.',
      ],
      'customer',
    ),
  };
}
