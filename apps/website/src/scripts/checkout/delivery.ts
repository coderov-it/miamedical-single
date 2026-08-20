/**
 * Step 2's controls: the two delivery cards, the branch picker inside one of
 * them, the return leg, and the auto-growing address boxes.
 *
 * The cards are `role="radio"` rather than real radios because each is a whole
 * card with a panel inside it, which an `<input>` cannot be. That is also why the
 * chosen method lives in `state.delivery` and not in the DOM's own checked state
 * — and why the gate for it reads that variable rather than looking for a
 * control.
 */
import type { CheckoutContext } from './context.ts';

export interface DeliveryOptions {
  /** Anything downstream of a step-2 answer: the totals, the gate messages. */
  onChange: () => void;
}

export function wireDelivery(context: CheckoutContext, options: DeliveryOptions): void {
  const { root, state, returnSame, returnSameLabel, returnAddressField } = context;

  /**
   * A textarea that starts at its `rows` height and follows what is typed.
   *
   * Two rows is the resting size because an empty box three rows tall looks like
   * a field somebody already filled. It grows instead of scrolling, so a long
   * address is read in one piece rather than through a slot.
   *
   * Measured from `scrollHeight`, which needs the element laid out — inside a
   * hidden panel it reports 0 and would collapse the box to nothing. Hence the
   * visibility guard, and hence `growAll()` running when a panel opens rather
   * than on input alone.
   */
  const growers = [...root.querySelectorAll<HTMLTextAreaElement>('textarea[data-autogrow]')];

  function grow(box: HTMLTextAreaElement): void {
    if (box.offsetParent === null) return;
    box.style.height = 'auto';
    /* `scrollHeight` covers content and padding but not the border, and these
       controls are `border-box` — so the border has to be added back or the box
       ends up one row short and scrolls by a hair. */
    const border = box.offsetHeight - box.clientHeight;
    box.style.height = `${box.scrollHeight + border}px`;
  }

  const growAll = () => {
    for (const box of growers) grow(box);
  };

  for (const box of growers) box.addEventListener('input', () => grow(box));

  // --- the two methods -------------------------------------------------------

  function selectDelivery(id: string): void {
    state.delivery = id;

    for (const card of context.deliveryCards) {
      const on = card.dataset.deliveryCard === id;
      card.toggleAttribute('data-selected', on);
      card.querySelector('[data-delivery-select]')?.setAttribute('aria-checked', String(on));
      const panel = card.querySelector<HTMLElement>('[data-delivery-panel]');
      if (panel) panel.hidden = !on;
    }

    /* The panel this opened is only now measurable — see `grow`. */
    growAll();

    /* The return question is the same for both methods; only the noun changes.
       An address gets collected from, a sede gets brought back to. */
    if (returnSameLabel) {
      const wording =
        id === 'storePickup'
          ? returnSameLabel.dataset.labelPickup
          : returnSameLabel.dataset.labelHome;
      if (wording) returnSameLabel.textContent = wording;
    }

    options.onChange();
  }

  for (const card of context.deliveryCards) {
    card
      .querySelector('[data-delivery-select]')
      ?.addEventListener('click', () => selectDelivery(card.dataset.deliveryCard ?? ''));
  }

  // --- which branch ----------------------------------------------------------

  const pickupCards = [...root.querySelectorAll<HTMLButtonElement>('[data-pickup-card]')];

  function selectPickup(city: string): void {
    state.pickup = city;
    for (const card of pickupCards) {
      card.setAttribute('aria-checked', String(card.dataset.pickupCard === city));
    }
    options.onChange();
  }

  for (const card of pickupCards) {
    card.addEventListener('click', () => selectPickup(card.dataset.pickupCard ?? ''));
  }

  /* The first branch is server-rendered `aria-checked`, so the state has to agree
     with the markup from the start or the gate would ask for a choice the page is
     already showing as made. */
  const preselected = pickupCards.find((card) => card.getAttribute('aria-checked') === 'true');
  if (preselected) state.pickup = preselected.dataset.pickupCard ?? '';

  // --- the return leg --------------------------------------------------------

  /**
   * Unticking is the deliberate act, so it is what reveals the field. Ticking it
   * again CLEARS what was typed rather than remembering it: a stale address
   * hidden behind a ticked box is a fact nobody can see and the server would have
   * refused anyway.
   */
  function paintReturn(): void {
    if (!returnSame) return;
    const elsewhere = !returnSame.checked;
    if (returnAddressField) returnAddressField.hidden = !elsewhere;
    if (!elsewhere) {
      const input = context.field('returnAddress');
      if (input) input.value = '';
    }
    options.onChange();
  }

  returnSame?.addEventListener('change', paintReturn);
}
