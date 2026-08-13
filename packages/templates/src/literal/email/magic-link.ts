import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailMessage } from './component/message.ts';
import { paragraph } from './component/paragraph.ts';
import { textBody } from './component/text.ts';

/** Passwordless sign-in. Deliberately short-lived, and the copy says so. */
export function magicLink(input: { to: string; url: string }): EmailMessage {
  const subject = 'Il tuo link di accesso';

  return {
    to: [input.to],
    subject,
    html: `${header({ heading: subject, audience: 'customer' })}
${paragraph({ text: 'Usa il pulsante qui sotto per accedere alla tua area clienti.' })}
${button({ href: input.url, label: 'Accedi' })}
${paragraph({ text: 'Il link scade tra 15 minuti e può essere usato una sola volta.' })}
${paragraph({ text: 'Se non hai richiesto questo accesso, puoi ignorare questa email.' })}
${footer({ audience: 'customer' })}`,
    text: textBody(
      [
        'Usa questo link per accedere alla tua area clienti:',
        input.url,
        '',
        'Scade tra 15 minuti e può essere usato una sola volta.',
        'Se non hai richiesto questo accesso, ignora questa email.',
      ],
      'customer',
    ),
  };
}
