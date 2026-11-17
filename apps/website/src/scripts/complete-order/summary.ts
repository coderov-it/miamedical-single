/**
 * Paints the order summary panel (`components/complete-order/OrderSummaryPanel.astro`) from
 * the link's summary: lines with package and period, add-ons, the money, and where the order
 * waits. Plain DOM, text only: nothing from the order is ever written as HTML.
 *
 *   lines    "Letto articolato"  /  "7 giorni · 1 dic 2026 – 7 dic 2026"  /  "1 × 180,00 €"  /  180,00 €
 *   money    subtotal, delivery (only if above 0), discount (only if above 0, shown as minus), total
 *   status   awaiting_signature / awaiting_payment, otherwise the order's own status word
 */
import type { AccountCopyData } from '../account/copy';
import { day, money } from './format.ts';
import type { LinkLine, LinkSummary } from './types.ts';

function element(tag: string, className: string, text: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function lineNode(line: LinkLine, currency: string): HTMLElement {
  const item = document.createElement('li');
  item.className = 'flex flex-col gap-1.5';

  const head = document.createElement('div');
  head.className = 'flex justify-between gap-3';
  head.append(
    element('strong', 'min-w-0 text-[14.5px]', line.title),
    element('span', 'font-semibold whitespace-nowrap tabular-nums', money(line.total, currency)),
  );
  item.append(head);

  if (line.rental) {
    const period = [line.rental.packageLabel, rentalSpan(line.rental)].filter(Boolean).join(' · ');
    if (period) item.append(element('span', 'text-ink-2 text-[13px]', period));
  }
  item.append(
    element(
      'span',
      'text-ink-2 text-[13px] tabular-nums',
      `${line.quantity} × ${money(line.unitPrice, currency)}`,
    ),
  );
  for (const addon of line.addons) {
    item.append(element('span', 'text-ink-2 text-[13px]', `+ ${addon.name} × ${addon.quantity}`));
  }
  return item;
}

function rentalSpan(rental: NonNullable<LinkLine['rental']>): string {
  if (!rental.startDate) return '';
  if (!rental.endDate || rental.endDate === rental.startDate) return day(rental.startDate);
  return `${day(rental.startDate)} – ${day(rental.endDate)}`;
}

/** Where the order waits, in words: the stage while pending, else its status. */
function statusWord(summary: LinkSummary, copy: AccountCopyData): string {
  if (summary.stage === 'awaiting_signature')
    return copy.text['completeOrder.status.awaitingSignature'] ?? '';
  if (summary.stage === 'awaiting_payment')
    return copy.text['completeOrder.status.awaitingPayment'] ?? '';
  return copy.status[summary.status] ?? '';
}

export function paintSummary(root: HTMLElement, summary: LinkSummary, copy: AccountCopyData): void {
  const pick = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-co-${name}]`)!;
  const { currency } = summary;

  pick('status').textContent = statusWord(summary, copy);
  pick('lines').replaceChildren(...summary.lines.map((line) => lineNode(line, currency)));
  pick('subtotal').textContent = money(summary.subtotal, currency);
  pick('total').textContent = money(summary.total, currency);

  const shipping = Number(summary.shippingTotal) > 0;
  pick('shipping-row').hidden = !shipping;
  if (shipping) pick('shipping').textContent = money(summary.shippingTotal, currency);

  const discount = Number(summary.discountTotal) > 0;
  pick('discount-row').hidden = !discount;
  if (discount) pick('discount').textContent = `−${money(summary.discountTotal, currency)}`;
}
