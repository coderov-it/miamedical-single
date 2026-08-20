/**
 * The product page's only JavaScript, and the one place its pieces meet.
 *
 * Everything here is an ENHANCEMENT. The page is a native GET form that works
 * with none of this: the buttons submit, the server re-resolves the request, and
 * the customer gets an answer. What the script adds is the panel keeping up with
 * the form, a calendar instead of the browser's, a cart write that does not cost
 * the customer their place — and the form gate, which is the one piece that
 * changes an outcome rather than an appearance, by refusing to send a request
 * the API would reject and saying which field is why.
 *
 * WIRING, and why it is this shape:
 *
 *   form 'change' ─┬─→ estimate.update()   the panel mirrors the form
 *                  ├─→ calendar.paint()    the shaded span follows the package
 *                  └─→ actions.refresh()   a field just answered clears its message
 *   form 'input'  ──→ the same three, so typing a number is not a special case
 *
 * `refresh()` only ever HIDES a message. Nothing here reveals one except a click
 * on an order action — a customer part-way through the form has not failed
 * anything yet.
 */
import { mountCalendar } from './calendar.ts';
import { createEstimate } from './estimate.ts';
import { readLabels } from './labels.ts';
import { wireGallery, wireQuantitySteppers } from './controls.ts';
import { wireOrderActions } from './order-actions.ts';

wireGallery();
wireQuantitySteppers();

/* Absent when the product is out of stock: that page renders the panel as a
   phone number instead of a form, and there is nothing here to drive. */
const form = document.getElementById('quote-form') as HTMLFormElement | null;

if (form) {
  const labels = readLabels();
  const estimate = createEstimate(form, labels);
  const actions = wireOrderActions(form);

  const calendar = mountCalendar({ form, labels, onChange: estimate.update });

  const packageToggle = document.querySelector<HTMLInputElement>('[data-pkg-toggle]');

  function sync(): void {
    estimate.update();
    calendar?.paint();
    actions.refresh();
  }

  form.addEventListener('change', (event) => {
    // Choosing a package closes the disclosure — the choice is made, and leaving
    // it open hides the panel underneath it.
    const target = event.target as HTMLElement;
    if (target.dataset?.estKind === 'package' && packageToggle) packageToggle.checked = false;
    sync();
  });
  form.addEventListener('input', sync);

  // A CSS disclosure has no dismiss of its own.
  if (packageToggle) {
    const wrapper = packageToggle.closest('div');
    document.addEventListener('click', (event) => {
      if (!packageToggle.checked) return;
      if (wrapper && !wrapper.contains(event.target as Node)) packageToggle.checked = false;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') packageToggle.checked = false;
    });
  }

  estimate.update();
}
