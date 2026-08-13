import { escapeHtml } from './escape.ts';
import type { ContractDamageItem } from './types.ts';

export function articlesIt(damages: ContractDamageItem[]): string {
  const damageRows = damages.map((d) => `<tr><td>${escapeHtml(d.description)}</td><td class="num">€${escapeHtml(d.amount)}</td></tr>`).join('\n');

  return `<h2>Termini e Condizioni</h2>
<div class="article">
  <div class="article-title">Art. 1 – Oggetto del contratto</div>
  <div class="article-body">Il presente contratto ha per oggetto il noleggio dei dispositivi medici e/o ausili alla mobilità sopra indicati, per il periodo e alle condizioni qui specificate.</div>
</div>
<div class="article">
  <div class="article-title">Art. 2 – Durata del noleggio</div>
  <div class="article-body">Il noleggio decorre dalla data di consegna indicata e termina alla data di restituzione prevista. Il ritardo nella restituzione comporta l'addebito del costo giornaliero per ogni giorno aggiuntivo.</div>
</div>
<div class="article">
  <div class="article-title">Art. 3 – Obblighi del cliente</div>
  <div class="article-body">Il cliente si impegna a: utilizzare il dispositivo con la diligenza del buon padre di famiglia; non cedere a terzi il dispositivo noleggiato; restituire il dispositivo nelle medesime condizioni in cui è stato ricevuto, salvo il normale deperimento d'uso; segnalare immediatamente qualsiasi danno o malfunzionamento.</div>
</div>
<div class="article">
  <div class="article-title">Art. 4 – Responsabilità per danni</div>
  <div class="article-body">Il cliente è responsabile per qualsiasi danno causato al dispositivo durante il periodo di noleggio. I costi di riparazione o sostituzione saranno addebitati secondo il seguente listino:</div>
  <div class="damage-list">
    <table>
      <thead><tr><th>Descrizione</th><th class="num">Importo</th></tr></thead>
      <tbody>${damageRows}</tbody>
    </table>
  </div>
</div>
<div class="article">
  <div class="article-title">Art. 5 – Consegna e restituzione</div>
  <div class="article-body">La consegna e la restituzione avvengono presso l'indirizzo indicato dal cliente o presso la nostra sede. Il cliente deve essere presente o delegare una persona di fiducia per la consegna e la restituzione del dispositivo.</div>
</div>
<div class="article">
  <div class="article-title">Art. 6 – Recesso e risoluzione</div>
  <div class="article-body">Il cliente può recedere dal contratto con un preavviso di almeno 48 ore. In caso di recesso tardivo, sarà addebitato il costo di un giorno aggiuntivo. M.i.a. Medical Italia si riserva il diritto di risolvere il contratto in caso di uso improprio del dispositivo.</div>
</div>
<div class="article">
  <div class="article-title">Art. 7 – Trattamento dei dati personali</div>
  <div class="article-body">I dati personali del cliente saranno trattati nel rispetto del Regolamento UE 2016/679 (GDPR) e della normativa italiana vigente, esclusivamente ai fini dell'esecuzione del presente contratto.</div>
</div>`;
}

export function articlesEn(damages: ContractDamageItem[]): string {
  const damageRows = damages.map((d) => `<tr><td>${escapeHtml(d.description)}</td><td class="num">€${escapeHtml(d.amount)}</td></tr>`).join('\n');

  return `<h2>Terms and Conditions</h2>
<div class="article">
  <div class="article-title">Art. 1 – Subject of the contract</div>
  <div class="article-body">This contract covers the rental of the medical devices and/or mobility aids listed above, for the period and under the conditions specified herein.</div>
</div>
<div class="article">
  <div class="article-title">Art. 2 – Rental period</div>
  <div class="article-body">The rental begins from the delivery date indicated and ends on the expected return date. Late returns will incur the daily rate for each additional day.</div>
</div>
<div class="article">
  <div class="article-title">Art. 3 – Customer obligations</div>
  <div class="article-body">The customer agrees to: use the device with due care and diligence; not transfer the rented device to third parties; return the device in the same condition as received, subject to normal wear; report any damage or malfunction immediately.</div>
</div>
<div class="article">
  <div class="article-title">Art. 4 – Liability for damages</div>
  <div class="article-body">The customer is liable for any damage caused to the device during the rental period. Repair or replacement costs will be charged according to the following schedule:</div>
  <div class="damage-list">
    <table>
      <thead><tr><th>Description</th><th class="num">Amount</th></tr></thead>
      <tbody>${damageRows}</tbody>
    </table>
  </div>
</div>
<div class="article">
  <div class="article-title">Art. 5 – Delivery and return</div>
  <div class="article-body">Delivery and return take place at the address indicated by the customer or at our premises. The customer must be present or delegate a trusted person for the delivery and return of the device.</div>
</div>
<div class="article">
  <div class="article-title">Art. 6 – Withdrawal and termination</div>
  <div class="article-body">The customer may withdraw from the contract with at least 48 hours notice. Late withdrawal will result in an additional day's charge. M.i.a. Medical Italia reserves the right to terminate the contract in case of improper use of the device.</div>
</div>
<div class="article">
  <div class="article-title">Art. 7 – Data protection</div>
  <div class="article-body">The customer's personal data will be processed in compliance with EU Regulation 2016/679 (GDPR) and applicable Italian law, exclusively for the purpose of executing this contract.</div>
</div>`;
}
