import { escapeHtml } from './escape.ts';
import type { ContractCustomer } from './types.ts';

export function customerInfoIt(customer: ContractCustomer): string {
  const fiscalFields: string[] = [];
  if (customer.codiceFiscale) {
    fiscalFields.push(`<div class="info-block"><label>Codice Fiscale</label><span>${escapeHtml(customer.codiceFiscale)}</span></div>`);
  }
  if (customer.partitaIva) {
    fiscalFields.push(`<div class="info-block"><label>Partita IVA</label><span>${escapeHtml(customer.partitaIva)}</span></div>`);
  }
  if (customer.codiceUnivoco) {
    fiscalFields.push(`<div class="info-block"><label>Codice Univoco</label><span>${escapeHtml(customer.codiceUnivoco)}</span></div>`);
  }

  return `<h2>Dati del Cliente</h2>
<div class="info-grid">
  <div class="info-block"><label>Nome e Cognome</label><span>${escapeHtml(customer.fullName)}</span></div>
  <div class="info-block"><label>Indirizzo</label><span>${escapeHtml(customer.address)}</span></div>
  <div class="info-block"><label>Email</label><span>${escapeHtml(customer.email)}</span></div>
  <div class="info-block"><label>Telefono</label><span>${escapeHtml(customer.phone)}</span></div>
  ${fiscalFields.join('\n  ')}
</div>`;
}

export function customerInfoEn(customer: ContractCustomer): string {
  return `<h2>Customer Information</h2>
<div class="info-grid">
  <div class="info-block"><label>Full Name</label><span>${escapeHtml(customer.fullName)}</span></div>
  <div class="info-block"><label>Address</label><span>${escapeHtml(customer.address)}</span></div>
  <div class="info-block"><label>Email</label><span>${escapeHtml(customer.email)}</span></div>
  <div class="info-block"><label>Phone</label><span>${escapeHtml(customer.phone)}</span></div>
</div>`;
}
