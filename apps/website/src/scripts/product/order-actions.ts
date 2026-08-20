/**
 * The two things the buy box can do, and the one check that stands in front of
 * both: request this configuration now, or put it in the cart and keep looking.
 *
 * NOTHING IS EVER DISABLED HERE. Both buttons are live at all times; a click
 * runs the form gate, and if anything is missing the gate marks it at the field,
 * scrolls there and announces the count — see `lib/form-validation.ts` and the
 * rule in AGENTS.md. The previous arrangement disabled the request button
 * whenever a rental lacked a package or a date, which stopped the customer dead
 * and told them nothing, and let "aggiungi alla richiesta" through regardless
 * because `reportValidity()` had nothing to check: the package radios carry no
 * `required`, and being `sr-only` they could not carry one that worked.
 *
 * NATIVE VALIDATION IS TURNED OFF BY THE SCRIPT, never in the markup. With no
 * JavaScript the `required` attributes are the whole defence and the browser's
 * own bubbles are the whole message; here the gate takes over so that every
 * field fails the same way, including the ones the browser cannot see.
 */
import { discoverGates } from '~/lib/form-gate-markup';
import { createFormGate } from '~/lib/form-validation';
import {
  CART_PRODUCT_FIELD,
  CART_QUANTITY_FIELD,
  type CartLine,
  cartCount,
  clampQuantity,
  lineKey,
  readCartLines,
  writeCartLines,
} from '~/lib/cart-store';

/**
 * The form as a cart line: every field except the quantity, which lives beside
 * the config rather than inside it (see `CartLine`).
 *
 * Read from `FormData` rather than a list of names, so a control added to the
 * buy box later is carried without this having to learn about it.
 */
function serializeConfig(form: HTMLFormElement): { config: string; quantity: number } {
  const config = new URLSearchParams();
  let quantity = 1;

  for (const [key, value] of new FormData(form)) {
    if (typeof value !== 'string') continue;
    if (key === CART_QUANTITY_FIELD) {
      quantity = clampQuantity(value);
      continue;
    }
    if (value === '') continue;
    config.append(key, value);
  }

  return { config: config.toString(), quantity };
}

/** Adds the line, or raises the quantity of the identical one already there. */
function addLine(config: string, quantity: number): CartLine[] {
  const lines = readCartLines();
  const key = lineKey(config);
  const existing = lines.find((line) => lineKey(line.config) === key);

  if (existing) {
    // Same product, same configuration: one row, more of it.
    existing.quantity = clampQuantity(existing.quantity + quantity);
    return lines;
  }

  lines.push({
    /* Random is fine HERE — unlike the server-rendered ids in `cart.ts`, this
       runs only in the browser, so there is no markup to disagree with, and a
       fresh row genuinely is a new identity. */
    id: `line-${Math.random().toString(36).slice(2, 10)}`,
    config,
    quantity,
  });
  return lines;
}

/** The visible confirmation and the spoken one, which are deliberately separate. */
function confirmAdded(lines: CartLine[]): void {
  const panel = document.querySelector<HTMLElement>('[data-cart-added]');
  if (panel) panel.hidden = false;

  /* Revealing a `role="status"` region announces it once; revealing it again
     changes nothing in the DOM, so a screen-reader user would hear nothing on
     every add after the first. This text ends in the cart's new SIZE, which does
     change every time. */
  const region = document.querySelector<HTMLElement>('[data-cart-announce]');
  if (!region) return;

  const total = cartCount(lines);
  const countLabel = (
    total === 1 ? (region.dataset.countOne ?? '') : (region.dataset.countMany ?? '')
  ).replace('{count}', String(total));
  region.textContent = (region.dataset.messageTemplate ?? '').replace('{count}', countLabel);
}

export interface OrderActions {
  /** Clears any message a field has since answered. Wire to input/change. */
  refresh: () => void;
}

export function wireOrderActions(form: HTMLFormElement): OrderActions {
  /* The gate owns validation from here on, so the browser must stop competing:
     two error UIs on one form is worse than either alone. */
  form.noValidate = true;

  const gate = createFormGate(form, discoverGates(form), {
    announce: document.querySelector<HTMLElement>('[data-order-gate-announce]'),
  });

  /*
   * The gate stands in front of the FORM, not in front of one button, because
   * both actions submit it — "aggiungi alla richiesta" is a second submit with
   * `formaction`, and pressing Enter in a text field is a third way in that no
   * click handler would ever see.
   */
  form.addEventListener('submit', (event) => {
    if (!gate.enforce()) event.preventDefault();
  });

  /*
   * "Aggiungi alla richiesta" — upgraded from "navigate to /carrello/" to "write
   * the store and stay here".
   *
   * The button is a real submit with `formaction={routes.cart}`, so with this
   * script absent it still adds the product; it just arrives on the cart page to
   * do it, and the cart folds the URL's line into the store on mount. This
   * handler is the difference between that and not losing the customer's place.
   *
   * The gate runs FIRST and independently of the submit listener above: this
   * calls `preventDefault()`, and a prevented submit event never reaches it.
   */
  const addButton = document.querySelector<HTMLButtonElement>('[data-add-to-cart]');
  addButton?.addEventListener('click', (event) => {
    if (!gate.enforce()) {
      event.preventDefault();
      return;
    }
    event.preventDefault();

    const { config, quantity } = serializeConfig(form);
    if (!new URLSearchParams(config).get(CART_PRODUCT_FIELD)) return;

    const lines = addLine(config, quantity);
    writeCartLines(lines);
    confirmAdded(lines);
  });

  return { refresh: gate.refresh };
}
