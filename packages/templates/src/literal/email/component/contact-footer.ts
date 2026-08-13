import { COLORS } from '../../../brand.ts';
import { CONTACT, whatsappUrl } from '../../../contact.ts';

const BUTTON_STYLE = `display:block;min-height:44px;line-height:44px;padding:0 18px;border:1px solid ${COLORS.hair};border-radius:6px;color:${COLORS.ink};text-decoration:none;font-size:14px;font-weight:500`;

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
export function contactFooter(): string {
  return `<div style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${COLORS.hair};text-align:center">
<p style="margin:0 0 10px;font-size:13px;color:${COLORS.inkSoft}">Questa email arriva da un indirizzo che non riceve risposte: se rispondi, non la leggeremo.</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLORS.ink}">Hai bisogno di aiuto? Scrivici su WhatsApp o chiamaci.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto">
<tr><td style="padding:0 0 8px"><a href="${whatsappUrl()}" style="${BUTTON_STYLE}">Scrivici su WhatsApp</a></td></tr>
<tr><td><a href="tel:${CONTACT.phoneE164}" style="${BUTTON_STYLE}">Chiama ${CONTACT.phoneDisplay}</a></td></tr>
</table>
<p style="margin:12px 0 0;font-size:12px;color:${COLORS.inkFaint}">Numero verde, gratuito. ${CONTACT.hours}.</p>
</div>`;
}
