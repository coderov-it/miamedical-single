import { escapeHtml } from './escape.ts';
import type { ContractRentalItem } from './types.ts';

export function itemsTableIt(
  items: ContractRentalItem[],
  subtotal: string,
  shippingTotal: string,
  total: string,
): string {
  const rows = items
    .map(
      (item) => `<tr>
  <td>${escapeHtml(item.productTitle)}</td>
  <td>${escapeHtml(item.sku)}</td>
  <td class="num">${item.quantity}</td>
  <td>${escapeHtml(item.startDate)}${item.endDate ? ` – ${escapeHtml(item.endDate)}` : ''}</td>
  <td class="num">${item.duration}${item.durationUnit === 'hour' ? 'h' : 'g'}</td>
  <td class="num">€${escapeHtml(item.unitPrice)}</td>
  <td class="num">€${escapeHtml(item.total)}</td>
</tr>`,
    )
    .join('\n');

  return `<h2>Articoli Noleggiati</h2>
<table class="items">
  <thead><tr>
    <th>Prodotto</th><th>SKU</th><th>Qtà</th><th>Periodo</th><th>Durata</th><th>Prezzo/u</th><th>Totale</th>
  </tr></thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr><td colspan="6">Subtotale</td><td class="num">€${escapeHtml(subtotal)}</td></tr>
    <tr><td colspan="6">Spedizione</td><td class="num">€${escapeHtml(shippingTotal)}</td></tr>
    <tr><td colspan="6">Totale</td><td class="num">€${escapeHtml(total)}</td></tr>
  </tfoot>
</table>`;
}

export function itemsTableEn(
  items: ContractRentalItem[],
  subtotal: string,
  shippingTotal: string,
  total: string,
): string {
  const rows = items
    .map(
      (item) => `<tr>
  <td>${escapeHtml(item.productTitle)}</td>
  <td>${escapeHtml(item.sku)}</td>
  <td class="num">${item.quantity}</td>
  <td>${escapeHtml(item.startDate)}${item.endDate ? ` – ${escapeHtml(item.endDate)}` : ''}</td>
  <td class="num">${item.duration}${item.durationUnit === 'hour' ? 'h' : 'd'}</td>
  <td class="num">€${escapeHtml(item.unitPrice)}</td>
  <td class="num">€${escapeHtml(item.total)}</td>
</tr>`,
    )
    .join('\n');

  return `<h2>Rented Items</h2>
<table class="items">
  <thead><tr>
    <th>Product</th><th>SKU</th><th>Qty</th><th>Period</th><th>Duration</th><th>Unit Price</th><th>Total</th>
  </tr></thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr><td colspan="6">Subtotal</td><td class="num">€${escapeHtml(subtotal)}</td></tr>
    <tr><td colspan="6">Shipping</td><td class="num">€${escapeHtml(shippingTotal)}</td></tr>
    <tr><td colspan="6">Total</td><td class="num">€${escapeHtml(total)}</td></tr>
  </tfoot>
</table>`;
}
