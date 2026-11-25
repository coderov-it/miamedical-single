/**
 * What the page says back: the order overview's delivery row, total and
 * pay-now line, the confirm step's review, and the per-item accordion.
 *
 * All display, no decisions. Money here is the SERVER'S figure — the items total
 * arrives in `data-items-total` and a priced home delivery's fee in
 * `data-home-delivery-fee`, both resolved by `@mia/pricing` over the same inputs
 * the order will be written from. The only sum this file makes is goods + that fee,
 * and only to paint it.
 */
import { requestCopyKey } from '~/lib/product-mode-copy';

import type { CheckoutContext } from './context.ts';

export interface Summary {
  paintTotal: () => void;
  paintReview: () => void;
}

export function createSummary(context: CheckoutContext): Summary {
  const { root, overview, state, value, label, money } = context;

  /**
   * The overview's delivery row, running total and what is paid now.
   *
   * Three cases, from `state.delivery` and `context.homeDeliveryFee`:
   *   - home delivery, PRICED   → the row shows the fee; total and pay-now are
   *     goods + fee, charged online together.
   *   - home delivery, UNPRICED → the row says it is paid to the carrier on the
   *     doorstep; total and pay-now are the goods alone.
   *   - collection / nothing chosen → free, goods alone.
   */
  function paintTotal(): void {
    const home = state.delivery === 'homeDelivery';
    const fee = home ? context.homeDeliveryFee : null;
    const payNow = context.itemsTotal + (fee ?? 0);

    const row = overview.querySelector<HTMLElement>('[data-overview-delivery]');
    if (row) {
      row.hidden = !state.delivery;
      const rowLabel = row.querySelector('[data-overview-delivery-label]');
      const amount = row.querySelector('[data-overview-delivery-fee]');
      if (rowLabel)
        rowLabel.textContent = context.deliveryShort(state.delivery) || label('delivery');
      if (amount) amount.textContent = deliveryAmountText(home, fee);
    }

    const total = overview.querySelector('[data-overview-total]');
    if (total) total.textContent = money.format(payNow);

    const footnote = overview.querySelector('[data-overview-footnote]');
    const unpricedHome = home && fee === null;
    const template = unpricedHome ? label('payNowFootnoteCarrier') : label('payNowFootnote');
    if (footnote) footnote.textContent = template.replace('{amount}', money.format(payNow));
  }

  /** The delivery row's right-hand text for the three cases above. */
  function deliveryAmountText(home: boolean, fee: number | null): string {
    if (!home) return label('free');
    if (fee === null) return label('deliveryPaidToCarrier');
    return money.format(fee);
  }

  /** Whichever fiscal identifier the chosen identity carries, if any. */
  function fiscalValue(): string {
    if (state.type === 'private') return value('codiceFiscale');
    if (state.type === 'company') return value('partitaIva');
    return '';
  }

  /** The delivery in one line — a home address flattened, or the branch. */
  function deliveryDetail(): string {
    if (state.delivery === 'homeDelivery') {
      /* Newlines become separators: the review line is one line. */
      return value('address')
        .split('\n')
        .map((part) => part.trim())
        .filter(Boolean)
        .join(' · ');
    }
    if (state.delivery === 'storePickup') {
      /* The return block exists only when a line is rented; without one nothing
         comes back, so the branch line says collection alone (CART-014). */
      const key = requestCopyKey('collectedAtBranch', context.returnSame !== null);
      return label(key).replace('{city}', state.pickup);
    }
    return '';
  }

  function paintReview(): void {
    const typeLabel = context.customerTypeLabel(state.type);
    const fiscal = fiscalValue();
    const detail = deliveryDetail();

    /* Only when it differs. "Collected from the delivery address" is what the
       review already says by not saying anything. */
    const returnDetail =
      context.returnSame && !context.returnSame.checked ? value('returnAddress') : '';

    const fill = (key: string, text: string) => {
      const node = root.querySelector(`[data-review="${key}"]`);
      if (node) node.textContent = text || '—';
    };

    fill('name', `${value('firstName')} ${value('lastName')}`.trim());
    fill('email', value('email'));
    fill('phone', value('phone'));
    fill('type', fiscal ? `${typeLabel} · ${fiscal}` : typeLabel);
    fill('delivery', context.deliveryName(state.delivery));
    fill(
      'deliveryDetail',
      returnDetail ? `${detail} · ${label('returnStage')}: ${returnDetail}` : detail,
    );
  }

  // --- line-item accordion ---------------------------------------------------

  for (const toggle of overview.querySelectorAll<HTMLButtonElement>('[data-item-toggle]')) {
    toggle.addEventListener('click', () => {
      const panel = overview.querySelector<HTMLElement>(
        `[data-item-panel="${toggle.dataset.itemToggle}"]`,
      );
      if (!panel) return;
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  return { paintTotal, paintReview };
}
