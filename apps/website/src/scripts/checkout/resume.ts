/**
 * An empty checkout reached by GET, with a cart in this browser: post the cart.
 *
 * The cart lives in localStorage and reaches the checkout as a form POST, so any
 * other way in — a reload, the language switch, a new tab, a bookmark — arrived
 * with nothing and said "Non c'è niente da confermare" while the header still
 * counted the items. The page renders `[data-resume-cart]` only on that GET, so
 * the post below lands on a request with lines and can never loop.
 */
import { cartWireFields, readCartLines } from '~/lib/cart-store';

export function resumeFromCart(): void {
  const form = document.querySelector<HTMLFormElement>('[data-resume-cart]');
  if (!form) return;

  const lines = readCartLines();
  if (lines.length === 0) return;

  for (const field of cartWireFields(lines)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = field.name;
    input.value = field.value;
    form.append(input);
  }
  form.submit();
}
