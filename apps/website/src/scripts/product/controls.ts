/**
 * The two plain controls on the product page: the gallery thumbnails and the
 * quantity steppers.
 *
 * Neither knows anything about pricing. The stepper writes the input and
 * dispatches `change`, which is what reaches the estimate — the same
 * write-through the calendar uses, so a value only ever has one owner.
 */

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
 * Every `− n +` stepper on the page — the order panel's quantity and each
 * add-on's — driven by the input's OWN `min`/`max`, so the back office's ceiling
 * for a given extra is respected without this knowing what it is.
 */
export function wireQuantitySteppers(): void {
  for (const button of document.querySelectorAll('[data-qty-dec], [data-qty-inc]')) {
    button.addEventListener('click', () => {
      const row = button.closest('[data-qty-row]');
      const input = row?.querySelector<HTMLInputElement>('[data-qty-input]');
      if (!input) return;

      const current = Number.parseInt(input.value, 10) || 1;
      const min = Number.parseInt(input.min, 10) || 1;
      const max = Number.parseInt(input.max, 10) || 10;
      const next = button.hasAttribute('data-qty-dec')
        ? Math.max(min, current - 1)
        : Math.min(max, current + 1);

      input.value = String(next);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}
