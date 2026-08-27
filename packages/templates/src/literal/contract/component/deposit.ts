import { escapeHtml } from './escape.ts';

/**
 * Front-page deposit summary of the official scooter contracts. The full legal
 * clause is Art. 4 in `articles-it.ts` / `articles-en.ts`; this box is what the
 * customer sees before reading the articles.
 */

export function depositClauseIt(amount: string): string {
  return `<div class="deposit-box">
  <strong>Deposito cauzionale con carta di credito: €${escapeHtml(amount)}</strong>
  La cauzione verrà restituita per intero al Locatario salvo quanto previsto all'art. 4 del presente contratto. Il Locatario conferma di ritenersi responsabile dell'ausilio/i in noleggio fino ad avvenuta riconsegna alla MIA MEDICAL ITALIA SRL, consegna che verrà certificata da apposita ricevuta firmata dal rappresentante della MIA MEDICAL ITALIA SRL. Il Locatario dichiara di rimborsare alla MIA MEDICAL ITALIA SRL l'intero ammontare di eventuali danni causati al/ai beni in noleggio cui al presente contratto, tramite prelievo dalla carta di credito inserita per la cauzione.
</div>`;
}

export function depositClauseEn(amount: string): string {
  return `<div class="deposit-box">
  <strong>Deposit by credit card: €${escapeHtml(amount)}</strong>
  The deposit shall be returned in full to the Lessee except as provided for in Article 4 of this contract. The Lessee confirms that he/she shall be held responsible for the rented equipment until it is returned to MIA MEDICAL ITALIA SRL, which delivery shall be certified by a receipt signed by the representative of MIA MEDICAL ITALIA SRL. The Lessee declares to reimburse MIA MEDICAL ITALIA the entire amount of any damage caused to the rented equipment under this contract, by withdrawal from his/her credit card.
</div>`;
}
