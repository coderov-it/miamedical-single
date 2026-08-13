import { BRAND } from '../../../brand.ts';
import { CONTACT, whatsappUrl } from '../../../contact.ts';
import type { Audience } from './audience.ts';

/**
 * The plain-text body's pieces.
 *
 * The text body is not a fallback afterthought: it is what `ConsoleMailSender` prints
 * in development, so every emailed link has to be readable in it, and it is what a
 * client that refuses HTML shows.
 *
 * Nothing is escaped here. Plain text has no markup to escape into, and escaping it
 * would put `&amp;` in front of a customer.
 */

/** The text twin of `contactFooter()`. Same two channels, same notice. */
export function contactFooterText(): string {
  return [
    '--',
    'Questa email arriva da un indirizzo che non riceve risposte: se rispondi, non la leggeremo.',
    'Hai bisogno di aiuto? Scrivici su WhatsApp o chiamaci.',
    `WhatsApp: ${whatsappUrl()}`,
    `Numero verde: ${CONTACT.phoneDisplay} (gratuito, ${CONTACT.hours})`,
  ].join('\n');
}

/** The text twin of `reportLink()`. */
export function reportLinkText(props: { reportUrl: string }): string {
  return `Non hai effettuato tu questo ordine? Segnalacelo qui:\n${props.reportUrl}`;
}

/**
 * Joins body lines, signs off, and appends the footer for customer mail.
 *
 * Blank runs are collapsed because composing from optional lines leaves them behind,
 * and a text body with three blank lines in the middle reads as broken.
 */
export function textBody(lines: string[], audience: Audience): string {
  const parts = [...lines, '', `${BRAND.name} · ${BRAND.domain}`];
  if (audience === 'customer') parts.push('', contactFooterText());
  return parts
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
