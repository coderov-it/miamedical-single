import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailMessage } from './component/message.ts';
import { paragraph } from './component/paragraph.ts';
import { textBody } from './component/text.ts';

export function passwordReset(input: { to: string; url: string }): EmailMessage {
  const subject = 'Reimposta la tua password';

  return {
    to: [input.to],
    subject,
    html: `${header({ heading: subject, audience: 'customer' })}
${paragraph({ text: 'Hai chiesto di reimpostare la password della tua area clienti.' })}
${button({ href: input.url, label: 'Scegli una nuova password' })}
${paragraph({ text: 'Il link scade tra 60 minuti e può essere usato una sola volta.' })}
${paragraph({ text: 'Se non hai fatto questa richiesta, puoi ignorare questa email.' })}
${footer({ audience: 'customer' })}`,
    text: textBody(
      [
        'Hai chiesto di reimpostare la password della tua area clienti.',
        'Scegli una nuova password qui:',
        input.url,
        '',
        'Scade tra 60 minuti e può essere usato una sola volta.',
        'Se non hai fatto questa richiesta, ignora questa email.',
      ],
      'customer',
    ),
  };
}
