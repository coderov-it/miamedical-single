/**
 * Class strings the renewal modal's steps share.
 *
 * The modal is denser than the checkout page it borrows from: it lives inside
 * a dialog and asks less per step, so its forward action is a compact pill at
 * the end of the step rather than the checkout's full-width bar. One string,
 * so the three steps' buttons cannot drift apart.
 */
export const STEP_CTA =
  'group relative inline-flex min-h-0 cursor-pointer items-center justify-center gap-2 self-end rounded-full bg-accent px-7 py-2.5 text-[15px] font-semibold text-white hover:bg-accent-deep ' +
  /* Drawn at 42px, hit at the project's 48: the overlay carries the target. */
  "after:absolute after:inset-x-0 after:top-1/2 after:h-12 after:-translate-y-1/2 after:content-['']";
