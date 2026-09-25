import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailMessage } from './component/message.ts';
import { paragraph } from './component/paragraph.ts';
import { textBody } from './component/text.ts';

/**
 * Which sign-in email this is. Same link and landing page for all three; only
 * the wording differs.
 *
 * - `signIn`: a claimed account asking to get back in.
 * - `firstSignIn`: nobody has claimed this account yet — usually one the request
 *   itself created — so the email welcomes rather than says "welcome back".
 * - `register`: somebody chose a password for this address on the register form.
 *   It says so, and says ignoring it sets nothing, because a stranger may have
 *   typed this address and the click is what would apply their password.
 */
export type MagicLinkVariant = 'signIn' | 'firstSignIn' | 'register';

const COPY: Record<
  MagicLinkVariant,
  { subject: string; intro: string; label: string; ignore: string }
> = {
  signIn: {
    subject: 'Il tuo link di accesso',
    intro: 'Usa il pulsante qui sotto per accedere alla tua area clienti.',
    label: 'Accedi',
    ignore: 'Se non hai richiesto questo accesso, puoi ignorare questa email.',
  },
  firstSignIn: {
    subject: 'Conferma la tua email e accedi',
    intro:
      'Benvenuto in Mia Medical Italia. Conferma che questo indirizzo è tuo e la tua area clienti è pronta.',
    label: 'Conferma e accedi',
    ignore: 'Se non hai richiesto questo accesso, puoi ignorare questa email.',
  },
  register: {
    subject: 'Conferma la tua registrazione',
    intro:
      'Benvenuto in Mia Medical Italia. Conferma questo indirizzo per attivare il tuo account e la password che hai scelto.',
    label: 'Conferma registrazione',
    ignore: 'Se non ti sei registrato tu, ignora questa email: nessuna password verrà impostata.',
  },
};

/** Passwordless sign-in. Deliberately short-lived, and the copy says so. */
export function magicLink(input: {
  to: string;
  url: string;
  variant: MagicLinkVariant;
}): EmailMessage {
  const copy = COPY[input.variant];

  return {
    to: [input.to],
    subject: copy.subject,
    html: `${header({ heading: copy.subject, audience: 'customer' })}
${paragraph({ text: copy.intro })}
${button({ href: input.url, label: copy.label })}
${paragraph({ text: 'Il link scade tra 15 minuti e può essere usato una sola volta.' })}
${paragraph({ text: copy.ignore })}
${footer({ audience: 'customer' })}`,
    text: textBody(
      [
        copy.intro,
        input.url,
        '',
        'Scade tra 15 minuti e può essere usato una sola volta.',
        copy.ignore,
      ],
      'customer',
    ),
  };
}
