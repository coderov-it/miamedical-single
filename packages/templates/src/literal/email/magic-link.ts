import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailLanguage, Translated } from './component/language.ts';
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

interface VariantCopy {
  subject: string;
  intro: string;
  label: string;
  ignore: string;
}

const COPY: Translated<
  Record<MagicLinkVariant, VariantCopy> & { expiry: string; textExpiry: string }
> = {
  it: {
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
    expiry: 'Il link scade tra 15 minuti e può essere usato una sola volta.',
    textExpiry: 'Scade tra 15 minuti e può essere usato una sola volta.',
  },
  en: {
    signIn: {
      subject: 'Your sign-in link',
      intro: 'Use the button below to sign in to your customer area.',
      label: 'Sign in',
      ignore: 'If you did not ask to sign in, you can ignore this email.',
    },
    firstSignIn: {
      subject: 'Confirm your email and sign in',
      intro:
        'Welcome to Mia Medical Italia. Confirm that this address is yours and your customer area is ready.',
      label: 'Confirm and sign in',
      ignore: 'If you did not ask to sign in, you can ignore this email.',
    },
    register: {
      subject: 'Confirm your registration',
      intro:
        'Welcome to Mia Medical Italia. Confirm this address to activate your account and the password you chose.',
      label: 'Confirm registration',
      ignore: 'If you did not register, ignore this email: no password will be set.',
    },
    expiry: 'The link expires in 15 minutes and can be used only once.',
    textExpiry: 'It expires in 15 minutes and can be used only once.',
  },
  fr: {
    signIn: {
      subject: 'Votre lien de connexion',
      intro: 'Utilisez le bouton ci-dessous pour accéder à votre espace client.',
      label: 'Se connecter',
      ignore: 'Si vous n’avez pas demandé cette connexion, vous pouvez ignorer cet e-mail.',
    },
    firstSignIn: {
      subject: 'Confirmez votre e-mail et connectez-vous',
      intro:
        'Bienvenue chez Mia Medical Italia. Confirmez que cette adresse est la vôtre et votre espace client est prêt.',
      label: 'Confirmer et se connecter',
      ignore: 'Si vous n’avez pas demandé cette connexion, vous pouvez ignorer cet e-mail.',
    },
    register: {
      subject: 'Confirmez votre inscription',
      intro:
        'Bienvenue chez Mia Medical Italia. Confirmez cette adresse pour activer votre compte et le mot de passe choisi.',
      label: 'Confirmer l’inscription',
      ignore:
        'Si vous ne vous êtes pas inscrit, ignorez cet e-mail : aucun mot de passe ne sera défini.',
    },
    expiry: 'Le lien expire dans 15 minutes et ne peut être utilisé qu’une seule fois.',
    textExpiry: 'Il expire dans 15 minutes et ne peut être utilisé qu’une seule fois.',
  },
  de: {
    signIn: {
      subject: 'Ihr Anmeldelink',
      intro: 'Melden Sie sich über die Schaltfläche unten in Ihrem Kundenbereich an.',
      label: 'Anmelden',
      ignore:
        'Wenn Sie diese Anmeldung nicht angefordert haben, können Sie diese E-Mail ignorieren.',
    },
    firstSignIn: {
      subject: 'E-Mail bestätigen und anmelden',
      intro:
        'Willkommen bei Mia Medical Italia. Bestätigen Sie, dass diese Adresse Ihnen gehört, und Ihr Kundenbereich ist bereit.',
      label: 'Bestätigen und anmelden',
      ignore:
        'Wenn Sie diese Anmeldung nicht angefordert haben, können Sie diese E-Mail ignorieren.',
    },
    register: {
      subject: 'Bestätigen Sie Ihre Registrierung',
      intro:
        'Willkommen bei Mia Medical Italia. Bestätigen Sie diese Adresse, um Ihr Konto und das gewählte Passwort zu aktivieren.',
      label: 'Registrierung bestätigen',
      ignore:
        'Wenn Sie sich nicht registriert haben, ignorieren Sie diese E-Mail: Es wird kein Passwort gesetzt.',
    },
    expiry: 'Der Link läuft in 15 Minuten ab und kann nur einmal verwendet werden.',
    textExpiry: 'Er läuft in 15 Minuten ab und kann nur einmal verwendet werden.',
  },
};

/** Passwordless sign-in. Deliberately short-lived, and the copy says so. */
export function magicLink(input: {
  to: string;
  url: string;
  variant: MagicLinkVariant;
  language: EmailLanguage;
}): EmailMessage {
  const { language } = input;
  const all = COPY[language];
  const copy = all[input.variant];

  return {
    to: [input.to],
    subject: copy.subject,
    html: `${header({ heading: copy.subject, audience: 'customer', language })}
${paragraph({ text: copy.intro })}
${button({ href: input.url, label: copy.label })}
${paragraph({ text: all.expiry })}
${paragraph({ text: copy.ignore })}
${footer({ audience: 'customer', language })}`,
    text: textBody([copy.intro, input.url, '', all.textExpiry, copy.ignore], 'customer', language),
  };
}
