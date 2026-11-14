import { COLORS } from '../../../brand.ts';
import { CONTACT, whatsappUrl } from '../../../contact.ts';
import type { EmailLanguage, Translated } from './language.ts';

const BUTTON_STYLE = `display:block;min-height:44px;line-height:44px;padding:0 18px;border:1px solid ${COLORS.hair};border-radius:6px;color:${COLORS.ink};text-decoration:none;font-size:14px;font-weight:500`;

/** The footer's words. `text.ts` prints the same lines in the plain-text body. */
export const CONTACT_COPY: Translated<{
  noReply: string;
  help: string;
  whatsapp: string;
  call: string;
  freephone: string;
  hours: string;
}> = {
  it: {
    noReply:
      'Questa email arriva da un indirizzo che non riceve risposte: se rispondi, non la leggeremo.',
    help: 'Hai bisogno di aiuto? Scrivici su WhatsApp o chiamaci.',
    whatsapp: 'Scrivici su WhatsApp',
    call: 'Chiama',
    freephone: 'Numero verde, gratuito.',
    hours: CONTACT.hours,
  },
  en: {
    noReply:
      'This email comes from an address that cannot receive replies: if you reply, we will not read it.',
    help: 'Need help? Message us on WhatsApp or call us.',
    whatsapp: 'Message us on WhatsApp',
    call: 'Call',
    freephone: 'Free phone number.',
    hours: 'Mon–Sat, 9:00–19:00',
  },
  fr: {
    noReply:
      'Cet e-mail provient d’une adresse qui ne reçoit pas de réponses : si vous répondez, nous ne le lirons pas.',
    help: 'Besoin d’aide ? Écrivez-nous sur WhatsApp ou appelez-nous.',
    whatsapp: 'Écrivez-nous sur WhatsApp',
    call: 'Appeler le',
    freephone: 'Numéro vert, gratuit.',
    hours: 'Lun–Sam, 9h00–19h00',
  },
  de: {
    noReply:
      'Diese E-Mail kommt von einer Adresse, die keine Antworten empfängt: Wenn Sie antworten, lesen wir es nicht.',
    help: 'Brauchen Sie Hilfe? Schreiben Sie uns auf WhatsApp oder rufen Sie uns an.',
    whatsapp: 'Auf WhatsApp schreiben',
    call: 'Anrufen:',
    freephone: 'Kostenlose Rufnummer.',
    hours: 'Mo–Sa, 9:00–19:00',
  },
};

/**
 * How to reach a human, and the notice that replying is not one of the ways.
 *
 * Rendered for `audience: 'customer'` only. The From address is a no-reply mailbox with
 * no Reply-To header, so a customer who replies hears nothing back — saying so is the
 * obligation that choice creates, not boilerplate. Somebody who replies and gets silence
 * reasonably concludes they contacted us and were ignored.
 *
 * Centred as a block, and the two buttons are centred with it. The table is centred with
 * `align="center"` as well as `margin:0 auto`, because Outlook honours the attribute and
 * not the margin.
 *
 * ## One button per row, and why they are not side by side
 *
 * They were two `<td>`s in one `<tr>`, and that broke the whole message on a phone.
 * Cells in a single row cannot wrap — there is no line to break — and a table grows to
 * fit content that will not wrap, so the pair's ~400px widened the card past a 375px
 * screen and clipped every paragraph in the message, not just the footer.
 *
 * A media query would fix it for the clients that honour one, but not for the clients
 * that strip `<style>`. One cell per row needs no query and cannot overflow at any
 * width, which is worth more here than a footer that saves a line of height on desktop.
 *
 * Outlined, so they never outrank the message's own action.
 */
export function contactFooter(language: EmailLanguage): string {
  const copy = CONTACT_COPY[language];
  return `<div style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${COLORS.hair};text-align:center">
<p style="margin:0 0 10px;font-size:13px;color:${COLORS.inkSoft}">${copy.noReply}</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLORS.ink}">${copy.help}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto">
<tr><td style="padding:0 0 8px"><a href="${whatsappUrl()}" style="${BUTTON_STYLE}">${copy.whatsapp}</a></td></tr>
<tr><td><a href="tel:${CONTACT.phoneE164}" style="${BUTTON_STYLE}">${copy.call} ${CONTACT.phoneDisplay}</a></td></tr>
</table>
<p style="margin:12px 0 0;font-size:12px;color:${COLORS.inkFaint}">${copy.freephone} ${copy.hours}.</p>
</div>`;
}
