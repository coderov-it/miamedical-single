import { escapeHtml } from './escape.ts';
import type { ContractDamageItem } from './types.ts';

/**
 * The Italian legal articles, transcribed from the company's official contracts
 * (`blank-contracts /*.pdf`) with clerical errors corrected ("podestà"→"potestà",
 * "motociclo"→"bene", the general contract's ART. 6 renumbered to 5). Wording
 * changes beyond clerical fixes need office sign-off.
 */

const INTRO_IT =
  '<p class="intro-line">Le parti meglio indicate nel presente contratto convengono e stipulano quanto segue:</p>';

const ART_1_IT = `<div class="article">
  <div class="article-title">Art. 1 – Oggetto del contratto</div>
  <div class="article-body">Il presente contratto ha per oggetto la locazione di beni di proprietà della M.I.A. MEDICAL ITALIA SRL (denominata in seguito "Il Locatore"), i quali vengono locati alle condizioni ed ai presupposti indicati alla prima pagina del presente contratto al cliente (denominato di seguito "Il Locatario").</div>
</div>`;

const ART_2_IT = `<div class="article">
  <div class="article-title">Art. 2 – Responsabilità del Locatore e Locatario, manuali, avvertenze e precauzioni</div>
  <div class="article-body">Il locatario certifica che il/i bene/i in noleggio viene/vengono a lui consegnato/i in ottimo stato e dichiara, con la sottoscrizione del presente accordo, di averlo/i visionato/i e di averne verificato le ottime condizioni e di reputarlo/i idoneo/i all'uso previsto. I beni forniti dalla MIA MEDICAL ITALIA SRL hanno le certificazioni previste dalla legge, le quali sono rilasciate dagli uffici tecnici in capo al produttore degli ausili ortopedici in locazione, per i quali la MIA MEDICAL ITALIA SRL si obbliga nel fornirli in perfetta efficienza. È assolutamente vietato da parte del locatario l'uso dei beni, oggetto della locazione, a persone diverse dall'intestatario del presente contratto o diverse dalla persona sottoposta alla sua potestà genitoriale o tutela. Il locatario e/o l'utilizzatore è tenuto a conservare e custodire i beni affidatigli in noleggio con ogni diligenza. Egli è pertanto tenuto a rifondere alla M.I.A. MEDICAL ITALIA SRL l'eventuale costo relativo alla rottura o alla perdita dei medesimi anche se per cause dipese da terzi. Il sottoscrittore del presente contratto è il responsabile in solido del bene in locazione. Il Locatario è responsabile dei danni causati durante l'utilizzo dei beni in noleggio a se stesso, a terzi, a cose di terzi, ed agli stessi ausili in noleggio.</div>
</div>`;

const ART_3_IT = `<div class="article">
  <div class="article-title">Art. 3 – Durata della locazione</div>
  <div class="article-body">
    <p>La durata della locazione è concordata e specificata nel presente contratto:</p>
    <ul>
      <li>Ha validità dal giorno della consegna e scadenza il giorno della restituzione del bene ad un nostro incaricato, che ne attesterà detta operazione con il rilascio di ricevuta al cliente;</li>
      <li><strong>Non prevede alcun rimborso economico e/o nota di credito da parte della M.I.A. MEDICAL ITALIA SRL a favore del locatario, della somma corrisposta dallo stesso, in caso di restituzione anticipata del bene in noleggio da parte di quest'ultimo prima della data di scadenza della locazione concordata tra le parti nel presente contratto.</strong></li>
    </ul>
    <p>Il Locatore si riserva il diritto di risolvere il contratto, in caso di violazioni degli articoli del presente contratto a suo insindacabile giudizio, e richiedere al Locatario l'immediata restituzione del/i bene/i in noleggio, restituendo in tal caso unicamente la differenza del prezzo del noleggio relativo al periodo di mancato godimento, ovvero trattenere detto importo qualora venissero riscontrati danni al bene medesimo di valore superiore alla cauzione versata.</p>
    <p class="clause-critical">Allo scadere della locazione cui al presente contratto, il locatario si obbliga a restituire il bene alla MIA MEDICAL ITALIA SRL. In mancanza di espressa comunicazione o disdetta tra le parti, opera il tacito rinnovo, che prevede l'applicazione delle condizioni contrattuali precedentemente vigenti.</p>
  </div>
</div>`;

function paymentsArticleIt(number: number): string {
  return `<div class="article">
  <div class="article-title">Art. ${number} – Pagamenti e fatturazione</div>
  <div class="article-body">L'importo pattuito per il noleggio dovrà essere corrisposto alla M.I.A. MEDICAL ITALIA SRL per il tramite di un suo incaricato contestualmente alla consegna del/i bene/i e ad ogni rinnovo della locazione. Nel caso in cui l'utilizzatore non paghi la quota di noleggio, il presente contratto s'intenderà automaticamente risolto e l'utilizzatore dovrà riconsegnare al noleggiatore il bene, il quale noleggiatore tratterrà le somme incassate a titolo di penale. Le operazioni di fatturazione verranno effettuate dalla M.I.A. MEDICAL ITALIA SRL.</div>
</div>`;
}

function lawArticleIt(number: number): string {
  return `<div class="article">
  <div class="article-title">Art. ${number} – Legge applicabile</div>
  <div class="article-body">Il presente contratto è disciplinato dalla legge italiana. Per quanto non espressamente previsto si applicano le norme del Codice civile, ed in particolare le norme previste dall'art. 1571 c.c. e seguenti.</div>
</div>`;
}

const GDPR_IT = `<div class="article">
  <div class="article-title">Trattamento dei dati personali</div>
  <div class="article-body">I dati personali del cliente saranno trattati nel rispetto del Regolamento UE 2016/679 (GDPR) e della normativa italiana vigente, esclusivamente ai fini dell'esecuzione del presente contratto.</div>
</div>`;

function damagePriceListIt(damages: ContractDamageItem[]): string {
  if (damages.length === 0) return '';
  const rows = damages
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.description)}</td><td class="num">€${escapeHtml(d.amount)}</td></tr>`,
    )
    .join('\n');
  return `<div class="article">
  <div class="article-title">Listino prezzi per eventuali danni</div>
  <div class="damage-list">
    <table>
      <thead><tr><th>Descrizione</th><th class="num">Importo</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>`;
}

/** "Contratto di locazione per dispositivi medicali" — private/company, no deposit. */
export function articlesItGeneral(damages: ContractDamageItem[]): string {
  return `<h2>Termini e Condizioni</h2>
${INTRO_IT}
${ART_1_IT}
${ART_2_IT}
${damagePriceListIt(damages)}
${ART_3_IT}
${paymentsArticleIt(4)}
${lawArticleIt(5)}
${GDPR_IT}`;
}

/** "Contratto di locazione per scooter e carrozzine elettriche" — with security deposit. */
export function articlesItScooterDeposit(
  damages: ContractDamageItem[],
  depositAmount: string,
): string {
  const depositArticle = `<div class="article">
  <div class="article-title">Art. 4 – Deposito cauzionale</div>
  <div class="article-body">Il Locatario versa al Locatore contestualmente alla sottoscrizione del presente contratto la somma di €${escapeHtml(depositAmount)} a titolo di deposito cauzionale/penale per ogni ausilio noleggiato, somma che verrà restituita al Locatario all'atto della riconsegna del/i bene/i, accertata l'assenza di vizi e danni arrecati allo/agli stesso/i, se versata in contanti, oppure svincolata automaticamente al termine del noleggio se trattenuta da carta di credito con procedura di pre-autorizzazione. La cauzione potrà essere utilizzata in toto o in parte per coprire eventuali danni causati nel periodo di noleggio, con l'eventuale aggiunta della spesa per la perizia di stima dei danni se necessaria. Il Locatario si obbliga a risarcire il Locatore per qualsiasi danno derivante dal furto del/dei bene/i o di parti dello stesso. Descrizione addebito o penale sul deposito cauzionale: furto o smarrimento del bene da €300,00 a €1.500,00.</div>
</div>`;

  return `<h2>Termini e Condizioni</h2>
${INTRO_IT}
${ART_1_IT}
${ART_2_IT}
${ART_3_IT}
${depositArticle}
${damagePriceListIt(damages)}
${paymentsArticleIt(5)}
${lawArticleIt(6)}
${GDPR_IT}`;
}
