/**
 * The account screens' shared class strings.
 *
 * Lifted verbatim from the three page files this island replaces, where each
 * of them declared its own copy in frontmatter. They are here rather than in
 * a component so the two forms and any later screen agree without importing
 * each other.
 *
 * THE CARD IS THE STOREFRONT'S CARD. The account area was the one surface that
 * never got one: its panels were `rounded-xl` with the site's own hairline, at
 * a width no other page uses. `--radius-card` and `bg-white` on the muted page
 * ground is what every other page in the shop raises its content with, and the
 * two forms now sit in the same box as a catalogue card.
 */

export const FIELD =
  'w-full rounded-field border-2 border-hair bg-tint px-3.75 py-3.25 text-[15.5px] aria-[invalid]:border-danger';

export const LABEL = 'mb-1.5 block text-[14.5px] font-semibold';

/**
 * No `disabled:` variant, and that is the point: nothing in this island
 * disables a forward action. Re-entry while a save is in flight is guarded by
 * a flag inside the handler, so the button stays clickable and the click
 * always says something. See AGENTS.md § "Never block a customer".
 */
export const PRIMARY =
  'rounded-field bg-accent px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-accent-deep';

/** The gate's live region: `role="status"` carrying the two count templates. */
export const ANNOUNCE = 'sr-only';

/** One raised panel on the page ground — the storefront's own card. */
export const CARD = 'border-hair rounded-card border bg-white p-5 mid:p-6';

/** A card's own title. Lexend 700 at the theme's h4 step. */
export const HEADING = 'text-h4 font-bold';

/** A summary tile's caption: small, secondary, and NOT a heading. */
export const TILE_LABEL = 'text-ink-2 text-[13px] font-semibold tracking-[0.08em] uppercase';
