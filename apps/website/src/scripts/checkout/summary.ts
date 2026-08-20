/**
 * What the page says back: the order overview's delivery row and total, the
 * step-3 review, and the per-item accordion.
 *
 * All display, no decisions. Money here is the SERVER'S figure — the items total
 * arrives in `data-items-total`, already priced by `@mia/pricing` over the same
 * choices the order will be written from — and nothing on this page adds to it.
 */
import type { CheckoutContext } from './context.ts';

export interface Summary {
  paintTotal: () => void;
  paintReview: () => void;
}

export function createSummary(context: CheckoutContext): Summary {
  const { root, overview, state, value, label, money } = context;

  /**
   * The overview's delivery row and running total.
   *
   * Collection is free and says so. Home delivery costs something nobody knows
   * yet — nothing prices it — so the row shows words where an amount would go and
   * the total below stays the goods alone. Adding a zero would read as free,
   * which is the one thing it is not.
   */
  function paintTotal(): void {
    const unknown = state.delivery === 'homeDelivery';

    const row = overview.querySelector<HTMLElement>('[data-overview-delivery]');
    if (row) {
      row.hidden = !state.delivery;
      const rowLabel = row.querySelector('[data-overview-delivery-label]');
      const amount = row.querySelector('[data-overview-delivery-fee]');
      if (rowLabel)
        rowLabel.textContent = context.deliveryShort(state.delivery) || label('delivery');
      if (amount) amount.textContent = unknown ? label('deliveryPending') : label('free');
    }

    const total = overview.querySelector('[data-overview-total]');
    if (total) total.textContent = money.format(context.itemsTotal);
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
      return label('collectedAtBranch').replace('{city}', state.pickup);
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
