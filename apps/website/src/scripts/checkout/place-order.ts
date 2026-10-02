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
 *
 * ONE ORDER PER CHECKOUT. Which clicks may send, and what each failure is
 * allowed to offer afterwards, is the state machine in `placement-lock.ts`.
 * This file only drives it and paints its four phases.
 */
import { documentLocale } from '../locale';
import type { CheckoutContext } from './context.ts';
import { clearOrderedCartLines, createPlacementLock, type PlacementRecord } from './placement-lock.ts';
import { type PlacedOrder, submitOrder } from './submit-order.ts';

export interface PlaceOrder {
  /** Fills the no-JavaScript handover link with what has been typed so far. */
  refreshHandover: () => void;
  /**
   * Paints whatever is remembered for this checkout — a reload, a back button,
   * a tab opened before another placed it. Call once the stepper exists.
   */
  resume: () => void;
}

export interface PlaceOrderOptions {
  /**
   * The server refused fields it named. Returns true when at least one of them
   * maps to a control on this page — which is then marked, scrolled to and
   * focused — and false when none does, so the generic failure is shown.
   */
  onRejected: (fields: Record<string, string>) => boolean;
  /**
   * A remembered outcome took over the page (on load, or written by another
   * tab). The caller opens step 3, where its panel lives.
   */
  onAdopted: () => void;
}

export function wirePlaceOrder(context: CheckoutContext, options: PlaceOrderOptions): PlaceOrder {
  const { root, state, value, label } = context;

  const cta = root.querySelector<HTMLAnchorElement>('[data-place-order]');
  const pending = root.querySelector<HTMLElement>('[data-confirm-pending]');
  const placedPanel = root.querySelector<HTMLElement>('[data-confirm-placed]');
  const errorPanel = root.querySelector<HTMLElement>('[data-confirm-error]');
  const uncertainPanel = root.querySelector<HTMLElement>('[data-confirm-uncertain]');
  const idleLabel = cta?.textContent ?? '';
  const lock = createPlacementLock(context.orderItems);

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

  /** Puts the CTA back as it was rendered. Only a provable refusal gets here. */
  function setIdle(): void {
    state.placement = 'idle';
    if (uncertainPanel) uncertainPanel.hidden = true;
    if (!cta) return;
    cta.removeAttribute('aria-busy');
    cta.textContent = idleLabel;
  }

  function setSending(): void {
    state.placement = 'sending';
    if (errorPanel) errorPanel.hidden = true;
    if (!cta) return;
    cta.textContent = label('sendingRequest');
    cta.setAttribute('aria-busy', 'true');
  }

  /**
   * Final for this page. The form behind it stays editable but has nothing left
   * to send: the CTA lives in the pending block this hides, and `place()` turns
   * every later click away on the phase alone.
   */
  function showPlaced(order: PlacedOrder | null): void {
    state.placement = 'placed';
    if (pending) pending.hidden = true;
    if (errorPanel) errorPanel.hidden = true;
    if (uncertainPanel) uncertainPanel.hidden = true;
    if (!placedPanel) return;

    placedPanel.hidden = false;
    setHandover(
      placedPanel.querySelector<HTMLAnchorElement>('[data-placed-whatsapp]'),
      order?.number ?? null,
    );

    const greeting = placedPanel.querySelector<HTMLElement>('[data-placed-greeting]');
    const first = value('firstName');
    if (greeting && first) {
      greeting.textContent = (greeting.dataset.greetingTemplate ?? '').replace('{name}', first);
    }

    /* The order exists but its answer could not be read: say it was received,
       and claim no number or total this page never saw. */
    if (!order) return;

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
      total.textContent = new Intl.NumberFormat(documentLocale(), {
        style: 'currency',
        currency: order.totals.currency || 'EUR',
      }).format(Number(order.totals.total));
      totalRow.hidden = false;
    }

    /* Shown only when it is true. An already-activated customer being told to
       go and activate would read as the site not knowing who they are. */
    const accountLine = placedPanel.querySelector<HTMLElement>('[data-placed-account]');
    if (accountLine && order.accountInvite === 'activate') accountLine.hidden = false;
  }

  /** Refused before anything was written: say so, and offer the retry. */
  function showError(): void {
    if (!errorPanel) return;
    errorPanel.hidden = false;
    // The request is not lost: the handover still carries all of it, minus a
    // number that was never issued.
    setHandover(errorPanel.querySelector<HTMLAnchorElement>('[data-error-whatsapp]'), null);
    errorPanel.scrollIntoView({ block: 'nearest' });
  }

  /**
   * It may exist. The CTA keeps its place and its label, but a click on it now
   * brings this panel back into view rather than sending — see `place()`.
   */
  function showUncertain(): void {
    state.placement = 'uncertain';
    if (errorPanel) errorPanel.hidden = true;
    if (cta) {
      cta.removeAttribute('aria-busy');
      cta.textContent = idleLabel;
    }
    if (!uncertainPanel) return;
    uncertainPanel.hidden = false;
    setHandover(uncertainPanel.querySelector<HTMLAnchorElement>('[data-uncertain-whatsapp]'), null);
    uncertainPanel.scrollIntoView({ block: 'nearest' });
  }

  /** Paints what a stored record says — this tab's own, or another tab's. */
  function adopt(record: PlacementRecord): void {
    if (record.status === 'placed') {
      showPlaced((record.order as PlacedOrder | null) ?? null);
      return;
    }
    showUncertain();
  }

  async function place(): Promise<void> {
    if (!cta) return;
    /* NOT A SILENT RETURN. `sending` already reads "Invio in corso…" on the very
       control being clicked; `placed` has hidden it behind the confirmation; and
       `uncertain` is answered by bringing its explanation back into view. */
    if (state.placement === 'uncertain') {
      showUncertain();
      return;
    }
    if (state.placement !== 'idle') return;

    const known = lock.read();
    if (known) {
      adopt(known);
      return;
    }
    /* The one failure provably before sending: the browser knows it is offline. */
    if (!navigator.onLine) {
      showError();
      return;
    }

    setSending();
    const outcome = await lock.exclusive(async () => {
      /* Re-read INSIDE the lock: another tab may have finished this very order
         between the check above and acquiring it. */
      const raced = lock.read();
      if (raced) return { kind: 'adopt' as const, record: raced };
      lock.write({ status: 'sending', at: Date.now() });
      return submitOrder(context.apiBase, orderBody());
    });

    if (outcome === null) {
      showUncertain();
      return;
    }
    if (outcome.kind === 'adopt') {
      adopt(outcome.record);
      return;
    }
    if (outcome.kind === 'placed') {
      /* Remembered and cleared BEFORE painting, so a reload or a back button in
         the next instant finds the confirmation, not a cart to send again. */
      lock.write({ status: 'placed', at: Date.now(), order: outcome.order });
      clearOrderedCartLines(context.cartKeys);
      showPlaced(outcome.order);
      return;
    }
    if (outcome.kind === 'uncertain') {
      lock.write({ status: 'uncertain', at: Date.now() });
      showUncertain();
      return;
    }

    lock.clear();
    setIdle();
    if (!options.onRejected(outcome.fields)) showError();
  }

  cta?.addEventListener('click', (event) => {
    event.preventDefault();
    void place();
  });

  root.querySelector<HTMLButtonElement>('[data-confirm-retry]')?.addEventListener('click', () => {
    void place();
  });

  /** Adopts a record this tab did not just write, and shows it. */
  function takeOver(record: PlacementRecord): void {
    adopt(record);
    options.onAdopted();
  }

  lock.onChange(() => {
    const record = lock.read();
    if (record) {
      takeOver(record);
      return;
    }
    /* The other tab's attempt was refused, so nothing exists: this one may send. */
    if (state.placement === 'uncertain') setIdle();
  });

  return {
    refreshHandover: () => setHandover(cta, null),
    /* Whatever is remembered wins over the fresh form. */
    resume: () => {
      const remembered = lock.read();
      if (remembered) takeOver(remembered);
    },
  };
}
