import { createFloating, type FloatingController, type FloatingOptions } from './floating';

export interface SurfaceOptions extends FloatingOptions {
  /**
   * Below `mid`, stop anchoring this surface to its trigger and lock the
   * document behind it — it is a sheet the customer is inside, not a popover
   * hanging off a control.
   *
   * WHAT THAT SHEET LOOKS LIKE IS NOT DECIDED HERE. The dropdown is a centred
   * 90vw modal and the calendar is a full-screen page; both say so in their own
   * `max-mid:` classes, next to the desktop shape they replace. This flag only
   * says "the trigger no longer decides where you are", which is the one part
   * that cannot be expressed in CSS.
   */
  phoneSheet?: boolean;
}

export type SurfaceController = FloatingController;

const PHONE = '(max-width: 719px)';

/* Shared across every surface on the page, because `document.body` is. Two
   overlapping locks that each remembered the "previous" overflow would restore
   `hidden` when the first one closed and leave the page frozen. */
let locks = 0;
let restoreOverflow = '';

function lockDocument(): void {
  if (locks++ > 0) return;
  restoreOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
}

function unlockDocument(): void {
  if (locks === 0 || --locks > 0) return;
  document.body.style.overflow = restoreOverflow;
}

/**
 * Presents a temporary surface, and owns the ONE decision the stylesheet cannot
 * make: at this width, is this thing anchored to a trigger or is it a sheet?
 *
 * Both answers are live for as long as the surface is open, so a rotation or a
 * desktop window dragged narrow swaps between them rather than leaving an
 * anchored popover pinned at coordinates that no longer mean anything.
 */
export function createSurface(
  reference: HTMLElement,
  floating: HTMLElement,
  options: SurfaceOptions = {},
): SurfaceController {
  const anchored = createFloating(reference, floating, options);
  if (options.phoneSheet !== true) return anchored;

  const query = window.matchMedia(PHONE);
  let open = false;
  let mode: 'anchored' | 'sheet' | undefined;

  function leave(): void {
    if (mode === 'anchored') anchored.stop();
    if (mode === 'sheet') unlockDocument();
    mode = undefined;
  }

  function present(): void {
    const next = query.matches ? 'sheet' : 'anchored';
    if (next === mode) return;
    leave();
    mode = next;
    if (next === 'anchored') {
      anchored.start();
      return;
    }
    /* The sheet is placed entirely in CSS, so there is nothing to start —
       only the inline coordinates of the anchored mode to have cleared, which
       `anchored.stop()` did on the way out. */
    lockDocument();
  }

  return {
    start(): void {
      if (open) return;
      open = true;
      query.addEventListener('change', present);
      present();
    },
    stop(): void {
      if (!open) return;
      open = false;
      query.removeEventListener('change', present);
      leave();
    },
  };
}
