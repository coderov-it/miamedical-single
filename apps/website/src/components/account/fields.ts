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

/*
 * TYPE FOLLOWS THE THEME'S SEAMS (theme.css): controls, labels and buttons are
 * `font-ui` at the `text-ui` / `text-ui-strong` steps, prose is the body face at
 * the body size. These used to be pixel sizes in the body face, which is what
 * made the sign-in pages read as a different site from the header above them.
 */

export const FIELD =
  'font-ui text-ui-strong w-full rounded-field border-2 border-hair bg-tint px-3.75 py-2.5 aria-[invalid]:border-danger';

export const LABEL = 'font-ui text-ui mb-2 block font-semibold';

/** A line of help under a field or an action. Body face, one step down. */
export const HINT = 'text-ink-2 text-[15px]';

/**
 * No `disabled:` variant, and that is the point: nothing in this island
 * disables a forward action. Re-entry while a save is in flight is guarded by
 * a flag inside the handler, so the button stays clickable and the click
 * always says something. See AGENTS.md § "Never block a customer".
 */
export const PRIMARY =
  'font-ui text-ui-strong rounded-field bg-accent min-h-12 px-5 font-semibold text-white transition hover:bg-accent-deep';

/** The quiet action beside a primary one — the finder's own quiet button. */
export const SECONDARY =
  'font-ui text-ui-strong rounded-field bg-tint min-h-12 px-5 font-semibold text-ink transition hover:bg-tint-2';

/** An action that reads as a link: "Forgot password?", "Register Account". */
export const TEXT_ACTION = 'font-ui text-ui font-semibold text-accent hover:underline';

/** A failure the page reports above a form, rather than at one field. */
export const NOTICE_ERROR = 'rounded-field bg-danger-tint text-danger px-4 py-3 text-[15px]';

/** The gate's live region: `role="status"` carrying the two count templates. */
export const ANNOUNCE = 'sr-only';

/** One raised panel on the page ground — the storefront's own card. */
export const CARD = 'border-hair rounded-card border bg-white p-5 mid:p-6';

/**
 * THE SIGN-IN FAMILY'S CARD: sign-in, activation, reset and the order report.
 * One narrow white card on the grey ground (`fillGround` on BaseLayout), the
 * same width and air on all four so moving between them moves nothing.
 */
export const AUTH_CARD =
  'border-hair rounded-card mx-auto my-10 mid:my-16 w-[calc(100%-2rem)] max-w-[440px] border bg-white p-6 mid:p-8';

/** The card's `<h1>`. Face and weight come from the base heading styles. */
export const AUTH_TITLE = 'text-[clamp(1.625rem,2.4vw,2rem)]/[1.2]';

/** The line under it. No size: it inherits the body metric, phone step included. */
export const AUTH_LEDE = 'text-ink-2 mt-2';

/** A card's own title. Lexend 700 at the theme's h4 step. */
export const HEADING = 'text-h4 font-bold';

/** A summary tile's caption: small, secondary, and NOT a heading. */
export const TILE_LABEL = 'text-ink-2 text-[13px] font-semibold tracking-[0.08em] uppercase';
