import { COLORS } from '../../brand.ts';
import { escapeHtml } from './component/escape.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import type { EmailLanguage, Translated } from './component/language.ts';
import type { EmailMessage } from './component/message.ts';
import { paragraph } from './component/paragraph.ts';
import { textBody } from './component/text.ts';

const COPY: Translated<{
  subject: string;
  intro: string;
  textIntro: string;
  textCode: string;
  expiry: string;
  ignore: string;
}> = {
  it: {
    subject: 'Codice per eliminare il tuo profilo',
    intro:
      'Hai chiesto di eliminare il tuo profilo Mia Medical Italia. Inserisci questo codice nella pagina di eliminazione:',
    textIntro: 'Hai chiesto di eliminare il tuo profilo Mia Medical Italia.',
    textCode: 'Il tuo codice:',
    expiry: 'Il codice scade tra 15 minuti.',
    ignore: 'Se non hai fatto questa richiesta, ignora questa email: il tuo profilo resta com’è.',
  },
  en: {
    subject: 'Code to delete your profile',
    intro:
      'You asked to delete your Mia Medical Italia profile. Enter this code on the deletion page:',
    textIntro: 'You asked to delete your Mia Medical Italia profile.',
    textCode: 'Your code:',
    expiry: 'The code expires in 15 minutes.',
    ignore: 'If you did not make this request, ignore this email: your profile stays as it is.',
  },
  fr: {
    subject: 'Code pour supprimer votre profil',
    intro:
      'Vous avez demandé à supprimer votre profil Mia Medical Italia. Saisissez ce code sur la page de suppression :',
    textIntro: 'Vous avez demandé à supprimer votre profil Mia Medical Italia.',
    textCode: 'Votre code :',
    expiry: 'Le code expire dans 15 minutes.',
    ignore:
      'Si vous n’avez pas fait cette demande, ignorez cet e-mail : votre profil reste inchangé.',
  },
  de: {
    subject: 'Code zum Löschen Ihres Profils',
    intro:
      'Sie haben angefordert, Ihr Mia Medical Italia Profil zu löschen. Geben Sie diesen Code auf der Löschseite ein:',
    textIntro: 'Sie haben angefordert, Ihr Mia Medical Italia Profil zu löschen.',
    textCode: 'Ihr Code:',
    expiry: 'Der Code läuft in 15 Minuten ab.',
    ignore:
      'Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail: Ihr Profil bleibt unverändert.',
  },
};

/**
 * The code that proves inbox ownership on `/delete-profile/`. A code rather
 * than a link: the customer is already standing on the page, often inside the
 * app's web view, and a link would open a second browser mid-flow.
 */
export function accountDeletionCode(input: {
  to: string;
  code: string;
  language: EmailLanguage;
}): EmailMessage {
  const { language } = input;
  const copy = COPY[language];

  return {
    to: [input.to],
    subject: copy.subject,
    html: `${header({ heading: copy.subject, audience: 'customer', language })}
${paragraph({ text: copy.intro })}
<p style="margin:24px 0;color:${COLORS.ink};font-size:32px;font-weight:700;letter-spacing:8px;text-align:center">${escapeHtml(input.code)}</p>
${paragraph({ text: copy.expiry })}
${paragraph({ text: copy.ignore })}
${footer({ audience: 'customer', language })}`,
    text: textBody(
      [copy.textIntro, `${copy.textCode} ${input.code}`, '', copy.expiry, copy.ignore],
      'customer',
      language,
    ),
  };
}
