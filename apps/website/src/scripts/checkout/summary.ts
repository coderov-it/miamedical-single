/**
 * What the page says back: the order overview's delivery row, total and
 * pay-now line, the confirm step's review, and the per-item accordion.
 *
 * All display, no decisions. Money here is the SERVER'S figure — the items total
 * arrives in `data-items-total`, already priced by `@mia/pricing` over the same
 * choices the order will be written from — and nothing on this page adds to it.
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
   * The goods are paid online, in full; a home delivery is paid to the carrier
   * on the doorstep (the owner's rule), so its row says so where an amount would
   * go and the total stays the goods alone. Collection is free and says so.
   */
  function paintTotal(): void {
    const carrier = state.delivery === 'homeDelivery';

    const row = overview.querySelector<HTMLElement>('[data-overview-delivery]');
    if (row) {
      row.hidden = !state.delivery;
      const rowLabel = row.querySelector('[data-overview-delivery-label]');
      const amount = row.querySelector('[data-overview-delivery-fee]');
      if (rowLabel)
        rowLabel.textContent = context.deliveryShort(state.delivery) || label('delivery');
      if (amount) amount.textContent = carrier ? label('deliveryPaidToCarrier') : label('free');
    }

    const total = overview.querySelector('[data-overview-total]');
    if (total) total.textContent = money.format(context.itemsTotal);

    const footnote = overview.querySelector('[data-overview-footnote]');
    const template = carrier ? label('payNowFootnoteCarrier') : label('payNowFootnote');
    if (footnote)
      footnote.textContent = template.replace('{amount}', money.format(context.itemsTotal));
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
