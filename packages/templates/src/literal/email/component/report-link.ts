import { COLORS } from '../../../brand.ts';
import { escapeHtml } from './escape.ts';

/**
 * "You didn't place this order?" — the quiet escape hatch, in all three order emails
 * rather than only the one for a new account. An already-activated account is exactly
 * the case where somebody else ordering under that address matters most.
 *
 * One piece rather than the same sentence written three times, so the copy cannot
 * drift between the three messages.
 */
export function reportLink(props: { reportUrl: string }): string {
  return `<p style="margin:0 0 10px;font-size:13px"><a href="${escapeHtml(props.reportUrl)}" style="color:${COLORS.inkSoft}">Non hai effettuato tu questo ordine?</a></p>`;
}
