import { escapeHtml } from './escape.ts';

export function depositClauseIt(amount: string): string {
  return `<div class="deposit-box">
  <strong>Deposito cauzionale: €${escapeHtml(amount)}</strong>
  Il deposito cauzionale sarà addebitato tramite carta di credito o bonifico bancario al momento della consegna del dispositivo. Il deposito verrà restituito integralmente al momento della restituzione del dispositivo in buone condizioni, al netto di eventuali danni riscontrati.
</div>`;
}

export function depositClauseEn(amount: string): string {
  return `<div class="deposit-box">
  <strong>Security deposit: €${escapeHtml(amount)}</strong>
  The security deposit will be charged via credit card at the time of device delivery. The deposit will be refunded in full upon return of the device in good condition, less any damage charges.
</div>`;
}
