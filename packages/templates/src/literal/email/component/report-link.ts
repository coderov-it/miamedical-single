import { COLORS } from '../../../brand.ts';
import { escapeHtml } from './escape.ts';
import type { EmailLanguage, Translated } from './language.ts';

/** The question, and the plain-text lead-in to the link. `text.ts` prints the second. */
export const REPORT_COPY: Translated<{ question: string; textLead: string }> = {
  it: {
    question: 'Non hai effettuato tu questo ordine?',
    textLead: 'Non hai effettuato tu questo ordine? Segnalacelo qui:',
  },
  en: {
    question: 'You did not place this order?',
    textLead: 'You did not place this order? Tell us here:',
  },
  fr: {
    question: 'Vous n’avez pas passé cette commande ?',
    textLead: 'Vous n’avez pas passé cette commande ? Signalez-le ici :',
  },
  de: {
    question: 'Sie haben diese Bestellung nicht aufgegeben?',
    textLead: 'Sie haben diese Bestellung nicht aufgegeben? Melden Sie es hier:',
  },
};

/**
 * "You didn't place this order?" — the quiet escape hatch, in all three order emails
 * rather than only the one for a new account. An already-activated account is exactly
 * the case where somebody else ordering under that address matters most.
 *
 * One piece rather than the same sentence written three times, so the copy cannot
 * drift between the three messages.
 */
export function reportLink(props: {
  reportUrl: string;
  language: EmailLanguage;
  /** Another wording for a message that is not an order confirmation. */
  copy?: { question: string; textLead: string };
}): string {
  const question = escapeHtml((props.copy ?? REPORT_COPY[props.language]).question);
  return `<p style="margin:0 0 10px;font-size:13px"><a href="${escapeHtml(props.reportUrl)}" style="color:${COLORS.inkSoft}">${question}</a></p>`;
}
