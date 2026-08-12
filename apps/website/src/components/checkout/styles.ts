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

export const FIELD_INPUT =
  'rounded-[10px] border border-hair-strong bg-white px-3.75 py-3.25 text-[15.5px] font-normal';

/**
 * A combobox popup — the delivery cascade's three tiers and the street field.
 *
 * `max-h-64` with its own scroll because a province can hold ~320 comuni: the list
 * has to be filterable and scrollable rather than as long as the page.
 */
export const LISTBOX =
  'border-hair-strong shadow-pdp-card absolute top-full right-0 left-0 z-20 mt-1 max-h-64 ' +
  'list-none overflow-y-auto rounded-[11px] border bg-white p-1';

/** A conditional panel that opens under a delivery option. */
export const PANEL = 'mt-1 border-t border-hair px-4.5 pt-4 pb-4.5';

/**
 * The step's forward action. Rendered in the reachable state and driven to the
 * unreachable one by the page script, so it is never disabled without
 * JavaScript to re-enable it.
 */
export const CTA =
  'mt-1.5 cursor-pointer rounded-full border-0 bg-accent p-3.5 text-[15.5px] font-semibold text-white hover:bg-accent-deep ' +
  'aria-disabled:cursor-not-allowed aria-disabled:bg-hair aria-disabled:text-ink-2 aria-disabled:hover:bg-hair';

/** One of the three identity chips. Selection is the only thing accent marks. */
export const CHIP =
  'target-48 cursor-pointer rounded-full border-[1.5px] border-hair-strong bg-white px-5.5 py-2.75 text-[15.5px] font-semibold text-ink-2 ' +
  'aria-pressed:border-accent aria-pressed:bg-tint aria-pressed:text-accent';

/** The uppercase micro-label above a review block and the overview. */
export const EYEBROW = 'text-[11.5px] font-bold tracking-[0.1em] text-ink-2 uppercase';

/** One line of an estimate: label left, amount right. */
export const LINE_ROW = 'flex justify-between gap-3';
export const LINE_LABEL = 'min-w-0 text-ink-2';
export const LINE_AMOUNT = 'font-semibold whitespace-nowrap tabular-nums';
