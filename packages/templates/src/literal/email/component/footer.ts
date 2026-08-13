import { BRAND, COLORS } from '../../../brand.ts';
import type { Audience } from './audience.ts';
import { contactFooter } from './contact-footer.ts';

/**
 * Everything below a message's own copy, closing what `header()` opened — including the
 * `<!--[if mso]>` wrapper, which is why the two closing sequences are not identical.
 *
 * `audience` is required rather than defaulted, so adding a message forces a decision
 * about the footer instead of inheriting one. `'internal'` gets no contact block: its
 * readers have the admin panel.
 *
 * The whole footer is centred while the body copy above it stays left-aligned. That is
 * the conventional split and it earns its keep here: centring marks the block as
 * closing matter rather than more message, so the reader's eye stops at the last
 * paragraph instead of carrying on into the boilerplate.
 */
export function footer(props: { audience: Audience }): string {
  return `${props.audience === 'customer' ? contactFooter() : ''}
<p style="margin:26px 0 0;font-size:12px;color:${COLORS.inkFaint};text-align:center">${BRAND.name} · ${BRAND.domain}</p>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}
