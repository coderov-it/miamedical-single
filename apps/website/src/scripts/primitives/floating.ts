import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';

interface FloatingOptions {
  matchReferenceWidth?: boolean;
  fullScreenOnPhone?: boolean;
}

interface FloatingController {
  start: () => void;
  stop: () => void;
}

const PHONE = '(max-width: 719px)';
const VIEWPORT_PADDING = 16;

/**
 * Anchors a temporary surface without changing document height. Desktop uses
 * the best of bottom/top and constrains overflow to the viewport; phone
 * calendars can opt into a fixed full-screen surface.
 */
export function createFloating(
  reference: HTMLElement,
  floating: HTMLElement,
  options: FloatingOptions = {},
): FloatingController {
  const phone = window.matchMedia(PHONE);
  let stopAutoUpdate: (() => void) | undefined;
  let previousBodyOverflow = '';

  function clearInlinePosition(): void {
    floating.style.removeProperty('left');
    floating.style.removeProperty('top');
    floating.style.removeProperty('max-width');
    floating.style.removeProperty('max-height');
    floating.style.removeProperty('min-width');
    floating.style.removeProperty('overflow-y');
  }

  function setPhoneMode(enabled: boolean): void {
    floating.toggleAttribute('data-mobile-fullscreen', enabled);
    if (enabled) {
      clearInlinePosition();
      if (document.body.style.overflow !== 'hidden') {
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      return;
    }
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = previousBodyOverflow;
    }
  }

  async function update(): Promise<void> {
    const fullScreen = options.fullScreenOnPhone === true && phone.matches;
    setPhoneMode(fullScreen);
    if (fullScreen) return;

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
    phone.addEventListener('change', update);
    stopAutoUpdate = autoUpdate(reference, floating, update);
  }

  function stop(): void {
    stopAutoUpdate?.();
    stopAutoUpdate = undefined;
    phone.removeEventListener('change', update);
    setPhoneMode(false);
    clearInlinePosition();
  }

  return { start, stop };
}
