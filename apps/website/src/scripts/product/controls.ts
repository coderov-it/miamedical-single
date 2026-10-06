/**
 * The two plain controls on the product page: the gallery thumbnails and the
 * quantity steppers.
 *
 * Neither knows anything about pricing. The stepper writes the input and
 * dispatches `change`, which is what reaches the estimate — the same
 * write-through the calendar uses, so a value only ever has one owner.
 */
import { requestQuantity } from '~/lib/quantity-cap';

/** Thumbnails swap the main image, and say which one is showing. */
export function wireGallery(): void {
  const main = document.querySelector<HTMLImageElement>('[data-pdp-main-img]');
  const thumbs = [...document.querySelectorAll<HTMLButtonElement>('[data-pdp-thumb]')];

  for (const thumb of thumbs) {
    thumb.addEventListener('click', () => {
      if (!main) return;
      main.src = thumb.dataset.src ?? main.src;
      main.alt = thumb.dataset.alt ?? '';

      for (const other of thumbs) {
        const active = other === thumb;
        other.classList.toggle('border-accent', active);
        other.classList.toggle('border-transparent', !active);
        if (active) other.setAttribute('aria-current', 'true');
        else other.removeAttribute('aria-current');
      }
    });
  }
}

/**
 * Shows or clears the "more than 10, call us" note tied to a quantity input —
 * the order panel's has one (`data-qty-cap-for`), an add-on's does not.
 */
export function showQuantityCap(input: HTMLInputElement, capped: boolean): void {
  const note = document.querySelector<HTMLElement>(`[data-qty-cap-for="${input.id}"]`);
  if (note) note.hidden = !capped;
}

/**
 * A typed quantity past the cap is brought back to it AND the customer is told
 * why, at the field (PUB-011). Exactly the cap neither raises the note nor clears
 * it: the clamp written back can fire a second `change` on blur.
 */
function wireTypedCap(input: HTMLInputElement): void {
  input.addEventListener('change', () => {
    const max = Number.parseInt(input.max, 10) || 10;
    const next = requestQuantity(input.value, max);
    if (input.value !== String(next.quantity)) input.value = String(next.quantity);
    if (next.capped) showQuantityCap(input, true);
    if (next.quantity < max) showQuantityCap(input, false);
  });
}

/**
 * Every `− n +` stepper on the page — the order panel's quantity and each
 * add-on's — driven by the input's OWN `min`/`max`, so the back office's ceiling
 * for a given extra is respected without this knowing what it is.
 */
export function wireQuantitySteppers(): void {
  for (const input of document.querySelectorAll<HTMLInputElement>('[data-qty-input]')) {
    if (document.querySelector(`[data-qty-cap-for="${input.id}"]`)) wireTypedCap(input);
  }

  for (const button of document.querySelectorAll('[data-qty-dec], [data-qty-inc]')) {
    button.addEventListener('click', () => {
      const row = button.closest('[data-qty-row]');
      const input = row?.querySelector<HTMLInputElement>('[data-qty-input]');
      if (!input) return;

      const current = Number.parseInt(input.value, 10) || 1;
      const min = Number.parseInt(input.min, 10) || 1;
      const max = Number.parseInt(input.max, 10) || 10;

      /* "+" is never dead: at the cap it stays put and says why. */
      if (button.hasAttribute('data-qty-dec')) {
        input.value = String(Math.max(min, current - 1));
        showQuantityCap(input, false);
      } else {
        const next = requestQuantity(current + 1, max);
        input.value = String(next.quantity);
        showQuantityCap(input, next.capped);
      }
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}
