import { COLORS } from '../../../brand.ts';
import { escapeHtml } from './escape.ts';

/**
 * The one prominent action in a message — activate, sign in, choose a password.
 *
 * There is never more than one per email. The contact footer's buttons are outlined
 * precisely so they cannot compete with this.
 *
 * 44px tall, because a tap target smaller than that fails on a phone and this is the
 * only thing in the message the reader is meant to press. 200px wide at minimum, so a
 * short label like "Accedi" still reads as a button rather than as a chip — and no
 * wider than its text needs, so it never becomes a full-width bar.
 *
 * The 200px is a `width` attribute on a `<td>`, not `min-width` on the link. Three
 * reasons: HTML treats a cell's width as a floor rather than a fixed size; Outlook's
 * Word engine honours the attribute where it ignores `min-width` outright; and
 * `min-width` on the link would have added the horizontal padding on top of the 200,
 * making every button 248px wide instead.
 *
 * The link is `display:block` so it fills that cell and the whole 200px is clickable,
 * and `white-space:nowrap` so a longer label grows the cell instead of wrapping inside
 * it — which is what turns the 200 into a minimum rather than a cap.
 */
export function button(props: { href: string; label: string }): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px">
<tr><td width="200" align="center" bgcolor="${COLORS.button}" style="border-radius:6px">
<a href="${escapeHtml(props.href)}" style="display:block;padding:0 24px;min-height:44px;line-height:44px;color:${COLORS.buttonText};text-decoration:none;font-weight:500;text-align:center;white-space:nowrap">${escapeHtml(props.label)}</a>
</td></tr>
</table>`;
}
