/**
 * Class strings the checkout's three step bodies share.
 *
 * They live here rather than in one of the components because a form control
 * that renders at a different size in step 1 than in step 2 is exactly the kind
 * of drift this page is copied from a reference design to avoid. Every value is
 * the reference design's own — see docs/code/storefront-checkout.md.
 */

/** `repeat(auto-fit, minmax(200px, 1fr))` — the design's two-up field row. */
export const FIELD_GRID = 'grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]';

/** The label owns the column and the gap; the control sits inside it. */
export const FIELD_LABEL = 'flex flex-col gap-1.75 text-[14.5px] font-semibold';

/**
 * A text control: tint well, and a 2px border ONE STEP DARKER than its own fill
 * (`--color-hair` on `--color-tint`) — visible enough to say where to type,
 * too close in tone to harden into a frame (owner, 2026-08-20).
 *
 * The width is 2px AT REST on purpose. `[aria-invalid='true']` in app.css paints
 * its danger border at 2px, so a 1px resting border made every flagged field
 * grow by a pixel and nudge the row; matching the width means feedback only ever
 * changes the COLOUR — accent on focus, danger when wrong.
 */
export const FIELD_INPUT =
  'rounded-[10px] border-2 border-hair bg-tint px-3.75 py-3.25 text-[15.5px] font-normal';

/** A conditional panel that opens under a delivery option. */
export const PANEL = 'mt-1 border-t border-hair px-4.5 pt-4 pb-4.5';

/**
 * The step's forward action.
 *
 * IT HAS NO UNREACHABLE STATE, and it used to. The script painted it
 * `aria-disabled` whenever the step was incomplete and then opened its click
 * handler with `if (aria-disabled) return` — a grey button that swallowed the
 * click and named none of the eleven fields that might have been the problem.
 *
 * It is one appearance now, always clickable, and the click runs the form gate:
 * either the step advances or every missing field is marked where it is. See
 * `scripts/checkout/gates.ts` and the "never block silently" rule in AGENTS.md.
 */
export const CTA =
  'mt-1.5 cursor-pointer rounded-full border-0 bg-accent p-3.5 text-[15.5px] font-semibold text-white hover:bg-accent-deep';

/** One of the three identity chips. Selection is the only thing accent marks. */
export const CHIP =
  'target-48 cursor-pointer rounded-full bg-tint px-5.5 py-2.75 text-[15.5px] font-semibold text-ink-2 hover:bg-tint-2 ' +
  'aria-pressed:bg-accent-tint aria-pressed:text-accent aria-pressed:hover:bg-accent-tint';

/** The uppercase micro-label above a review block and the overview. */
export const EYEBROW = 'text-[11.5px] font-bold tracking-[0.1em] text-ink-2 uppercase';

/** One line of an estimate: label left, amount right. */
export const LINE_ROW = 'flex justify-between gap-3';
export const LINE_LABEL = 'min-w-0 text-ink-2';
export const LINE_AMOUNT = 'font-semibold whitespace-nowrap tabular-nums';
