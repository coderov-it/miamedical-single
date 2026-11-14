/**
 * The last step: place the order, then go and pay for it.
 *
 *   "Pay and Confirm" → POST /api/orders → 201 { number, payment }
 *                     → "Opening the payment page…" → the gateway's page
 *
 * The order is written BEFORE the customer pays, holding its stock, so the
 * page remembers it (placement-lock.ts): a back button from the gateway, a
 * reload, or a second tab finds "waiting for payment" with a "Pay now" — never
 * a form that would place it twice. Flow: docs/code/online-payments.md.
 *
 * NOT ONE PRICE IS SENT. The body carries choices only; the API prices them
 * again from the catalogue and would ignore any figure from here.
 */
import { routes } from '../../lib/routes.ts';
import { goToPayment, pageLanguage, retryPayment } from '../payment/client.ts';
import type { CheckoutContext } from './context.ts';
import {
  clearOrderedCartLines,
  createPlacementLock,
  type PlacementRecord,
} from './placement-lock.ts';
import { draftBody } from './order-body.ts';
import { type PlacedOrder, submitOrder } from './submit-order.ts';

export interface PlaceOrder {
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
  /** A remembered outcome took over the page. The caller opens the last step. */
  onAdopted: () => void;
  /**
   * Runs before anything is sent. False means the order is not ready to go —
   * the caller has already said why and where.
   */
  canPlace: () => boolean;
  /** `{ contractSignature }` on a rental, `{}` on a sale. */
  contractBody: () => Record<string, unknown>;
}

export function wirePlaceOrder(context: CheckoutContext, options: PlaceOrderOptions): PlaceOrder {
  const { root, state, label } = context;

  const cta = root.querySelector<HTMLButtonElement>('[data-place-order]');
  const pending = root.querySelector<HTMLElement>('[data-confirm-pending]');
  const awaitingPanel = root.querySelector<HTMLElement>('[data-confirm-awaiting]');
  const errorPanel = root.querySelector<HTMLElement>('[data-confirm-error]');
  const uncertainPanel = root.querySelector<HTMLElement>('[data-confirm-uncertain]');
  const resultPath = root.dataset.paymentResult ?? routes.paymentResult;
  const idleLabel = cta?.textContent ?? '';
  const lock = createPlacementLock(context.orderItems);

  function setIdle(): void {
    state.placement = 'idle';
    if (uncertainPanel) uncertainPanel.hidden = true;
    if (!cta) return;
    cta.removeAttribute('aria-busy');
    cta.textContent = idleLabel;
  }

  function setBusy(text: string): void {
    if (errorPanel) errorPanel.hidden = true;
    if (!cta) return;
    cta.textContent = text;
    cta.setAttribute('aria-busy', 'true');
  }

  /**
   * The order exists and waits for its money. Final for this form: the button
   * lives in the pending block this hides, and `place()` turns every later
   * click away on the phase alone.
   */
  function showAwaiting(order: PlacedOrder | null): void {
    state.placement = 'placed';
    if (pending) pending.hidden = true;
    if (errorPanel) errorPanel.hidden = true;
    if (uncertainPanel) uncertainPanel.hidden = true;
    if (!awaitingPanel) return;
    awaitingPanel.hidden = false;
    if (!order) return;

    const number = awaitingPanel.querySelector<HTMLElement>('[data-awaiting-number]');
    if (number) number.textContent = order.number;
    const detail = awaitingPanel.querySelector<HTMLElement>('[data-awaiting-detail]');
    if (detail)
      detail.textContent = (detail.dataset.template ?? '').replace('{number}', order.number);
    const account = awaitingPanel.querySelector<HTMLElement>('[data-placed-account]');
    if (account && order.accountInvite === 'activate') account.hidden = false;

    const pay = awaitingPanel.querySelector<HTMLAnchorElement>('[data-awaiting-pay]');
    const token = order.payment?.token;
    if (!pay || !token) return;
    pay.hidden = false;
    pay.onclick = (event) => {
      event.preventDefault();
      void payAgain(pay, token);
    };
  }

  /** "Pay now" on the waiting panel: a fresh gateway session for the same order. */
  async function payAgain(pay: HTMLAnchorElement, token: string): Promise<void> {
    if (pay.getAttribute('aria-busy') === 'true') return;
    pay.setAttribute('aria-busy', 'true');
    pay.textContent = label('openingPayment');
    try {
      goToPayment(await retryPayment(context.apiBase, token), resultPath);
    } catch {
      /* The result page knows how this attempt stands and offers its own retry. */
      window.location.assign(`${resultPath}?${new URLSearchParams({ token })}`);
    }
  }

  /** Refused before anything was written: say so — naming a sold-out product — and offer the retry. */
  function showError(outOfStock: string | null = null): void {
    if (!errorPanel) return;
    const detail = errorPanel.querySelector<HTMLElement>('[data-error-detail]');
    if (detail) {
      const fallback = detail.dataset.default ?? '';
      detail.textContent =
        outOfStock === null ? fallback : label('outOfStock').replace('{product}', outOfStock);
    }
    errorPanel.hidden = false;
    errorPanel.scrollIntoView({ block: 'nearest' });
  }

  /** It may exist. A click on the button now brings this panel back rather than sending. */
  function showUncertain(): void {
    state.placement = 'uncertain';
    if (errorPanel) errorPanel.hidden = true;
    if (cta) {
      cta.removeAttribute('aria-busy');
      cta.textContent = idleLabel;
    }
    if (!uncertainPanel) return;
    uncertainPanel.hidden = false;
    uncertainPanel.scrollIntoView({ block: 'nearest' });
  }

  function adopt(record: PlacementRecord): void {
    if (record.status === 'placed') {
      showAwaiting((record.order as PlacedOrder | null) ?? null);
      return;
    }
    showUncertain();
  }

  /** Placed: off to the gateway, or — with no gateway configured — the waiting panel. */
  function leaveForPayment(order: PlacedOrder | null): void {
    if (!order?.payment) {
      showAwaiting(order);
      return;
    }
    setBusy(label('openingPayment'));
    goToPayment(order.payment, resultPath);
  }

  async function place(): Promise<void> {
    if (!cta) return;
    /* NOT A SILENT RETURN. `sending` already reads "Opening…" on the very
       control being clicked; `placed` has hidden it; `uncertain` brings its
       explanation back into view. */
    if (state.placement === 'uncertain') {
      showUncertain();
      return;
    }
    if (state.placement !== 'idle') return;
    if (!options.canPlace()) return;

    const known = lock.read();
    if (known) {
      adopt(known);
      return;
    }
    if (!navigator.onLine) {
      showError();
      return;
    }

    state.placement = 'sending';
    setBusy(label('openingPayment'));
    const outcome = await lock.exclusive(async () => {
      const raced = lock.read();
      if (raced) return { kind: 'adopt' as const, record: raced };
      lock.write({ status: 'sending', at: Date.now() });
      return submitOrder(context.apiBase, {
        ...draftBody(context),
        ...options.contractBody(),
        language: pageLanguage(),
      });
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
      /* Remembered and cleared BEFORE leaving, so the back button from the
         gateway finds "waiting for payment", not a cart to send again. */
      lock.write({ status: 'placed', at: Date.now(), order: outcome.order });
      clearOrderedCartLines(context.cartKeys);
      state.placement = 'placed';
      leaveForPayment(outcome.order);
      return;
    }
    if (outcome.kind === 'uncertain') {
      lock.write({ status: 'uncertain', at: Date.now() });
      showUncertain();
      return;
    }

    lock.clear();
    setIdle();
    if (outcome.outOfStock !== null) {
      showError(outcome.outOfStock);
      return;
    }
    if (!options.onRejected(outcome.fields)) showError();
  }

  cta?.addEventListener('click', () => {
    void place();
  });

  root.querySelector<HTMLButtonElement>('[data-confirm-retry]')?.addEventListener('click', () => {
    void place();
  });

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
    resume: () => {
      const remembered = lock.read();
      if (remembered) takeOver(remembered);
    },
  };
}
