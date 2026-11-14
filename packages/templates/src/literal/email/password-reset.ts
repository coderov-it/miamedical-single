import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailLanguage, Translated } from './component/language.ts';
import type { EmailMessage } from './component/message.ts';
import { paragraph } from './component/paragraph.ts';
import { textBody } from './component/text.ts';

const COPY: Translated<{
  subject: string;
  intro: string;
  label: string;
  textLead: string;
  expiry: string;
  ignore: string;
}> = {
  it: {
    subject: 'Reimposta la tua password',
    intro: 'Hai chiesto di reimpostare la password della tua area clienti.',
    label: 'Scegli una nuova password',
    textLead: 'Scegli una nuova password qui:',
    expiry: 'Il link scade tra 60 minuti e può essere usato una sola volta.',
    ignore: 'Se non hai fatto questa richiesta, puoi ignorare questa email.',
  },
  en: {
    subject: 'Reset your password',
    intro: 'You asked to reset the password of your customer area.',
    label: 'Choose a new password',
    textLead: 'Choose a new password here:',
    expiry: 'The link expires in 60 minutes and can be used only once.',
    ignore: 'If you did not make this request, you can ignore this email.',
  },
  fr: {
    subject: 'Réinitialisez votre mot de passe',
    intro: 'Vous avez demandé à réinitialiser le mot de passe de votre espace client.',
    label: 'Choisir un nouveau mot de passe',
    textLead: 'Choisissez un nouveau mot de passe ici :',
    expiry: 'Le lien expire dans 60 minutes et ne peut être utilisé qu’une seule fois.',
    ignore: 'Si vous n’avez pas fait cette demande, vous pouvez ignorer cet e-mail.',
  },
  de: {
    subject: 'Passwort zurücksetzen',
    intro: 'Sie haben angefordert, das Passwort Ihres Kundenbereichs zurückzusetzen.',
    label: 'Neues Passwort wählen',
    textLead: 'Wählen Sie hier ein neues Passwort:',
    expiry: 'Der Link läuft in 60 Minuten ab und kann nur einmal verwendet werden.',
    ignore: 'Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.',
  },
};

export function passwordReset(input: {
  to: string;
  url: string;
  language: EmailLanguage;
}): EmailMessage {
  const { language } = input;
  const copy = COPY[language];

  return {
    to: [input.to],
    subject: copy.subject,
    html: `${header({ heading: copy.subject, audience: 'customer', language })}
${paragraph({ text: copy.intro })}
${button({ href: input.url, label: copy.label })}
${paragraph({ text: copy.expiry })}
${paragraph({ text: copy.ignore })}
${footer({ audience: 'customer', language })}`,
    text: textBody(
      [copy.intro, copy.textLead, input.url, '', copy.expiry, copy.ignore],
      'customer',
      language,
    ),
  };
}
