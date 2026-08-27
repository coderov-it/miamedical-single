import { BANK } from '../../../contact.ts';

/**
 * Bank transfer coordinates from the official Italian contracts. Tourist
 * contracts do not show them — those customers pay cash or card on delivery.
 */
export function bankDetailsIt(): string {
  return `<div class="info-block bank-details">
  <label>Coordinate bancarie per bonifici</label>
  <span>IBAN ${BANK.iban}<br>Intestato a: ${BANK.accountHolder}<br>${BANK.bankName}</span>
</div>`;
}
