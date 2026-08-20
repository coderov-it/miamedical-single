/**
 * The last step: record the order, then hand the conversation to WhatsApp.
 *
 * TWO PATHS, and the second is not a fallback. The CTA is an `<a>` pointing at a
 * `wa.me` link the SERVER already filled with the line items, so with no
 * JavaScript the customer still reaches a human with their whole request
 * attached. With JavaScript it records the order first and the handover moves to
 * the panel that appears afterwards, now carrying the order number — so the
 * navigation is cancelled rather than followed.
 *
 * NOT ONE PRICE IS SENT. The body carries choices only — a slug, option values,
 * dates, a quantity — because the API prices them again from the catalogue and
 * would ignore any figure from here. That is also why it is safe for the line
 * items to sit in the page as readable JSON: the worst a reader can do by editing
 * them is order something else at that thing's real price.
 */
import type { CheckoutContext } from './context.ts';

interface PlacedOrder {
  number: string;
  totals: { total: string; currency: string };
}

export interface PlaceOrder {
  /** Fills the no-JavaScript handover link with what has been typed so far. */
  refreshHandover: () => void;
}

export function wirePlaceOrder(context: CheckoutContext): PlaceOrder {
  const { root, state, value, label } = context;

  const cta = root.querySelector<HTMLAnchorElement>('[data-place-order]');
  const pending = root.querySelector<HTMLElement>('[data-confirm-pending]');
  const placedPanel = root.querySelector<HTMLElement>('[data-confirm-placed]');
  const errorPanel = root.querySelector<HTMLElement>('[data-confirm-error]');

  /**
   * The handover message: the server-built line items, then what the customer
   * typed into steps 1 and 2, then the order number once there is one.
   *
   * Every conditional line is gated on the CHOSEN option rather than merely on
   * the fields having values: a customer who fills the address and then switches
   * to collection would otherwise send both, and the agent cannot tell which is
   * real.
   */
  function handoverMessage(orderNumber: string | null): string {
    const base = cta?.dataset.waBase ?? '';
    const isCompany = state.type === 'company';
    const isHome = state.delivery === 'homeDelivery';
    const returnsElsewhere = context.returnSame !== null && !context.returnSame.checked;

    return [
      ...(orderNumber ? [`${label('requestNumberPrefix')} ${orderNumber}`, ''] : []),
      base,
      '',
      `${label('name')}: ${value('firstName')} ${value('lastName')}`.trim(),
      `${label('email')}: ${value('email')}`,
      `${label('phone')}: ${value('phone')}`,
      `${label('customerType')}: ${context.customerTypeLabel(state.type)}`,
      ...(state.type === 'private' ? [`${label('codiceFiscale')}: ${value('codiceFiscale')}`] : []),
      ...(isCompany
        ? [
            `${label('partitaIva')}: ${value('partitaIva')}`,
            `${label('codiceFiscale')}: ${value('companyCodiceFiscale')}`,
          ]
        : []),
      `${label('deliveryLine')}: ${context.deliveryName(state.delivery) || label('toBeArranged')}`,
      ...(isHome && value('address') ? [`${label('deliveryAddress')}: ${value('address')}`] : []),
      ...(state.delivery === 'storePickup' ? [`${label('pickupBranch')}: ${state.pickup}`] : []),
      /* Only when it is somewhere else — otherwise the agent already knows, and a
         line saying "the same address" is a line they read to learn nothing. */
      ...(returnsElsewhere && value('returnAddress')
        ? [`${label('returnStage')}: ${value('returnAddress')}`]
        : []),
      /* Says the delivery cost is still open, so the conversation starts on the
         thing that is actually unresolved — which, for a home delivery, always is. */
      ...(isHome ? [`${label('deliveryLine')}: ${label('deliveryPending')}`] : []),
      ...(value('comments') ? [`${label('notes')}: ${value('comments')}`] : []),
    ].join('\n');
  }

  /** Points a `wa.me` link at the current message. */
  function setHandover(link: HTMLAnchorElement | null, orderNumber: string | null): void {
    if (!link) return;
    const url = new URL(link.href);
    url.searchParams.set('text', handoverMessage(orderNumber));
    link.href = url.toString();
  }

  function orderBody(): Record<string, unknown> {
    const delivery: Record<string, unknown> = { method: state.delivery };
    if (state.delivery === 'homeDelivery') {
      // The address belongs to the delivery, and only to this one: the API
      // refuses it on a collection, which is exactly the mix-up that used to be
      // possible when it was asked for in step 1.
      delivery.address = { line1: value('address') };
    } else if (state.delivery === 'storePickup') {
      delivery.pickupCity = state.pickup;
    }
    /* Sent only when the order HAS a return leg. On a purchase the fields do not
       exist, and the API refuses a return address for something never returned. */
    if (context.returnSame) {
      delivery.returnToSameAddress = context.returnSame.checked;
      if (!context.returnSame.checked) delivery.returnAddress = value('returnAddress');
    }

    const customer: Record<string, unknown> = {
      firstName: value('firstName'),
      lastName: value('lastName'),
      email: value('email'),
      phone: value('phone'),
      customerType: state.type,
    };
    if (state.type === 'private') customer.codiceFiscale = value('codiceFiscale');
    if (state.type === 'company') {
      customer.partitaIva = value('partitaIva');
      customer.codiceFiscale = value('companyCodiceFiscale');
    }

    const body: Record<string, unknown> = { items: context.orderItems, customer, delivery };
    if (value('comments')) body.notes = value('comments');
    return body;
  }

  async function submitOrder(): Promise<PlacedOrder> {
    const response = await fetch(`${context.apiBase}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // The API is a different origin, so without this the customer session
      // cookie never arrives and a signed-in order links as `unverified` — the
      // one thing being signed in is supposed to settle. Checkout stays usable
      // without a session; this only matters when there is one.
      credentials: 'include',
      body: JSON.stringify(orderBody()),
    });
    if (!response.ok) throw new Error(`orders responded ${response.status}`);
    const payload = (await response.json()) as { data: PlacedOrder };
    return payload.data;
  }

  function showPlaced(order: PlacedOrder): void {
    state.placed = true;
    if (pending) pending.hidden = true;
    if (errorPanel) errorPanel.hidden = true;
    if (!placedPanel) return;

    placedPanel.hidden = false;

    const card = placedPanel.querySelector<HTMLElement>('[data-placed-number-card]');
    const number = placedPanel.querySelector<HTMLElement>('[data-placed-number]');
    if (card) card.hidden = false;
    if (number) number.textContent = order.number;

    /* The figure the SERVER computed, not the one this page added up. They agree
       — both run @mia/pricing over the same choices — and showing the stored one
       means the customer reads what the order actually says. */
    const totalRow = placedPanel.querySelector<HTMLElement>('[data-placed-total-row]');
    const total = placedPanel.querySelector<HTMLElement>('[data-placed-total]');
    if (totalRow && total && order.totals) {
      total.textContent = new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: order.totals.currency || 'EUR',
      }).format(Number(order.totals.total));
      totalRow.hidden = false;
    }

    const greeting = placedPanel.querySelector<HTMLElement>('[data-placed-greeting]');
    const first = value('firstName');
    if (greeting && first) {
      greeting.textContent = (greeting.dataset.greetingTemplate ?? '').replace('{name}', first);
    }

    setHandover(
      placedPanel.querySelector<HTMLAnchorElement>('[data-placed-whatsapp]'),
      order.number,
    );
  }

  function showError(): void {
    if (!errorPanel) return;
    errorPanel.hidden = false;
    // The request is not lost: the handover still carries all of it, minus a
    // number that was never issued.
    setHandover(errorPanel.querySelector<HTMLAnchorElement>('[data-error-whatsapp]'), null);
    errorPanel.scrollIntoView({ block: 'nearest' });
  }

  async function place(): Promise<void> {
    if (state.placed || state.sending || !cta) return;

    state.sending = true;
    const original = cta.textContent;
    cta.textContent = label('sendingRequest');
    cta.setAttribute('aria-busy', 'true');

    try {
      showPlaced(await submitOrder());
    } catch {
      showError();
    } finally {
      state.sending = false;
      cta.removeAttribute('aria-busy');
      cta.textContent = original;
    }
  }

  cta?.addEventListener('click', (event) => {
    event.preventDefault();
    void place();
  });

  root.querySelector<HTMLButtonElement>('[data-confirm-retry]')?.addEventListener('click', () => {
    if (errorPanel) errorPanel.hidden = true;
    void place();
  });

  return { refreshHandover: () => setHandover(cta, null) };
}
