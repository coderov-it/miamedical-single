import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';

export interface FloatingOptions {
  matchReferenceWidth?: boolean;
}

export interface FloatingController {
  start: () => void;
  stop: () => void;
}

const VIEWPORT_PADDING = 16;

/**
 * ANCHORED POSITIONING, AND NOTHING ELSE. Ties a temporary surface to its
 * trigger without changing document height: the best of bottom/top, shifted
 * back inside the viewport, and capped so a long list scrolls rather than
 * running off the screen.
 *
 * It used to also carry a `fullScreenOnPhone` flag that locked the body and set
 * a `data-mobile-fullscreen` attribute nothing in the repo styled. Deciding
 * WHETHER a surface is anchored at all is a different question from WHERE an
 * anchored one goes, and it now lives in `surface.ts`.
 */
export function createFloating(
  reference: HTMLElement,
  floating: HTMLElement,
  options: FloatingOptions = {},
): FloatingController {
  let stopAutoUpdate: (() => void) | undefined;

  /* Everything this module writes, it writes inline — so everything it writes,
     it takes back. Leave one behind and the phone sheet inherits a `top` or a
     `max-width` from the last time the surface was anchored. */
  function clearInlinePosition(): void {
    floating.style.removeProperty('left');
    floating.style.removeProperty('top');
    floating.style.removeProperty('max-width');
    floating.style.removeProperty('max-height');
    floating.style.removeProperty('min-width');
    floating.style.removeProperty('overflow-y');
  }

  async function update(): Promise<void> {
    const result = await computePosition(reference, floating, {
      strategy: 'fixed',
      placement: 'bottom-start',
      middleware: [
        offset(8),
        flip({ fallbackPlacements: ['top-start'], padding: VIEWPORT_PADDING }),
        shift({ padding: VIEWPORT_PADDING }),
        size({
          padding: VIEWPORT_PADDING,
          apply({ availableWidth, availableHeight, rects }) {
            floating.style.maxWidth = `${Math.max(0, availableWidth)}px`;
            floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
            floating.style.overflowY = 'auto';
            if (options.matchReferenceWidth === true) {
              floating.style.minWidth = `${rects.reference.width}px`;
            }
          },
        }),
      ],
    });

    floating.style.left = `${result.x}px`;
    floating.style.top = `${result.y}px`;
  }

  function start(): void {
    if (stopAutoUpdate) return;
    stopAutoUpdate = autoUpdate(reference, floating, update);
  }

  function stop(): void {
    stopAutoUpdate?.();
    stopAutoUpdate = undefined;
    clearInlinePosition();
  }

  return { start, stop };
}
