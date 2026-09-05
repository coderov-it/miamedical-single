/**
 * The terms & conditions document, transcribed from the live page at
 * `/termini-e-condizioni-contratto-mia-medical-italia/`.
 *
 * There is ONE document, not three. The site publishes a single
 * "Condizioni Generali di Vendita" covering both hire and sale, and its
 * clause 8 is where the security deposit lives — so a separate
 * "deposit rental" document would be a document the shop has never written.
 * Every product links to this one.
 *
 * The English is not the site's: TranslatePress leaves this page in Italian
 * (the `/en/` copy is byte-identical), so the English below is an equivalent
 * drafted from the Italian rather than a machine translation of it. The
 * Italian is the text that governs.
 *
 * `defineTerms` brands what it returns, so a product's `terms` accepts only a
 * document this function produced — a document has to exist as its own row
 * before anything can link to it.
 */
import { defineTerms } from '../../lib/define.ts';

export const generalTerms = defineTerms({
  code: 'general-terms',
  status: 'published',
  translations: {
    it: {
      title: 'Condizioni Generali di Vendita',
      slug: 'termini-e-condizioni-contratto-mia-medical-italia',
      body: [
        '<p><em>Ultimo aggiornamento: 04 marzo 2025</em></p>',
        '<p>Benvenuti su MIAMEDICALITALIA.IT, il sito ufficiale di noleggio e vendita di prodotti sanitari e medicali. L’accesso e l’utilizzo del sito sono soggetti ai seguenti termini e condizioni. Effettuando un ordine, l’utente accetta integralmente le presenti Condizioni Generali di Vendita.</p>',
        '<h2>1. Identità del venditore</h2>',
        '<p>MIAMEDICAL ITALIA SRL<br />Sede legale: Via Gian Pietro Talamini 44 Roma 00144<br />P.IVA: 16028971006<br />Email: info@miamedicalitalia.it<br />Telefono: 800031962</p>',
        '<h2>2. Prodotti e disponibilità</h2>',
        '<p>Tutti i prodotti visibili sul sito sono descritti in modo accurato. Tuttavia, non possiamo garantire che le immagini visualizzate siano perfettamente rappresentative delle caratteristiche reali. La disponibilità dei prodotti è aggiornata costantemente, ma può variare in tempo reale.</p>',
        '<h2>3. Prezzi e pagamento</h2>',
        '<p>I prezzi sono espressi in Euro, comprensivi di IVA ove applicabile. MIA MEDICAL ITALIA accetta i seguenti metodi di pagamento:</p>',
        '<ul><li>Carta di credito/debito</li><li>Bonifico bancario anticipato</li><li>Contrassegno (ove previsto)</li></ul>',
        '<p>L’ordine verrà evaso solo dopo la ricezione del pagamento (salvo contrassegno).</p>',
        '<h2>4. Spedizione e consegna</h2>',
        '<p>I tempi di consegna variano da 2 a 5 giorni lavorativi, salvo cause di forza maggiore. La spedizione è gratuita dove specificato e solamente su Roma e Firenze per i dispositivi che richiedono un’installazione specifica, altrimenti ha un costo variabile da 10€ a 20€. Eventuali ritardi non possono essere imputati direttamente a MIA MEDICAL ITALIA, ma ai corrieri incaricati.</p>',
        '<h2>5. Esclusione di responsabilità per mancata consegna o ritiro</h2>',
        '<p>MIA MEDICAL ITALIA non potrà essere ritenuta responsabile in caso di mancata consegna o ritardo dovuti a:</p>',
        '<ul><li>assenza del destinatario all’indirizzo indicato, anche in caso di consegna concordata con fascia oraria predefinita con il corriere;</li><li>errato o incompleto indirizzo fornito dal cliente;</li><li>mancata indicazione da parte del cliente, al momento della consegna, della dicitura “accettazione con riserva” sulla ricevuta o sul palmare del corriere, in presenza di pacco danneggiato o sospetto.</li></ul>',
        '<p>In tali casi, eventuali spese di giacenza, riconsegna o nuova spedizione saranno a carico del cliente. È responsabilità del cliente assicurarsi della propria presenza al momento della consegna concordata e verificare l’integrità del pacco prima di accettarlo. In mancanza di “accettazione con riserva”, non sarà possibile aprire pratiche di reclamo per danni da trasporto.</p>',
        '<h2>6. Prodotto danneggiato alla consegna</h2>',
        '<p>Il cliente è tenuto a verificare lo stato dell’imballo esterno al momento della consegna. In presenza di anomalie visibili (pacco danneggiato, bagnato, aperto, ecc.), è obbligatorio firmare con dicitura “ACCETTO CON RISERVA”, specificando il motivo (es. “imballo danneggiato”).</p>',
        '<p>Se il cliente accetta la consegna senza riserva e successivamente segnala un danno al dispositivo, MIA MEDICAL ITALIA declina ogni responsabilità, poiché il danneggiamento non potrà essere imputato con certezza al trasporto.</p>',
        '<p>Eventuali danni non visibili al momento della consegna devono essere segnalati via email a info@miamedicalitalia.it entro e non oltre 48 ore dalla ricezione del prodotto, allegando foto e descrizione dettagliata del problema. Oltre tale termine, non sarà possibile accettare reclami o richieste di sostituzione per danni da trasporto.</p>',
        '<h2>7. Diritto di recesso e resi</h2>',
        '<p>Ai sensi del D. Lgs. 206/2005 (Codice del Consumo), il cliente ha diritto di recedere dall’acquisto entro 14 giorni dalla data di ricezione del prodotto, senza obbligo di motivazione.</p>',
        '<p><strong>Eccezioni al diritto di recesso.</strong> In conformità con l’art. 59 del Codice del Consumo, il diritto di recesso non si applica in caso di noleggio di dispositivi medicali, trattandosi di prestazione di servizi relativi alla fornitura di beni personalizzati o chiaramente destinati a un uso specifico e urgente, per i quali la legge non prevede diritto di recesso.</p>',
        '<p><strong>Condizioni generali per il recesso (acquisti di beni).</strong></p>',
        '<ul><li>Il prodotto deve essere integro, non utilizzato e restituito nel suo imballaggio originale.</li><li>Non è possibile restituire articoli sigillati che siano stati aperti o utilizzati (es. dispositivi monouso o a contatto con la pelle).</li><li>Il cliente è responsabile delle spese di spedizione per il reso.</li></ul>',
        '<p><strong>Procedura di recesso (solo per acquisti non esclusi).</strong></p>',
        '<ul><li>Invia una comunicazione scritta a info@miamedicalitalia.it, indicando il numero d’ordine e il motivo del reso.</li><li>Dopo l’autorizzazione, riceverai istruzioni su come procedere.</li><li>Il rimborso verrà effettuato entro 14 giorni dal ricevimento e verifica del prodotto restituito.</li></ul>',
        '<h2>8. Deposito cauzionale per noleggio dispositivi</h2>',
        '<p>Per il noleggio di dispositivi medicali, MIAMEDICAL ITALIA richiede un deposito cauzionale il cui importo varia a seconda della tipologia di apparecchiatura noleggiata. L’importo del deposito viene comunicato al momento della conferma dell’ordine.</p>',
        '<p><strong>Condizioni del deposito.</strong></p>',
        '<ul><li>Il deposito è obbligatorio e deve essere versato prima della spedizione del dispositivo.</li><li>Viene interamente restituito entro 4 giorni lavorativi dalla restituzione del dispositivo, previa verifica tecnica.</li><li>Il controllo tecnico viene effettuato dal nostro ufficio competente per accertare che l’apparecchiatura sia integra, funzionante e completa di tutti gli accessori.</li></ul>',
        '<p>In caso di danni, manomissioni, mancanza di accessori o usura anomala del dispositivo, MIAMEDICAL ITALIA si riserva il diritto di trattenere parte o l’intero importo del deposito, dandone comunicazione scritta al cliente.</p>',
        '<h2>9. Garanzie legali</h2>',
        '<p>Tutti i prodotti venduti sono coperti dalla garanzia legale di conformità prevista dagli articoli 128-135 del Codice del Consumo. In caso di prodotto difettoso o non conforme, MIA MEDICAL ITALIA si impegna alla sostituzione o al rimborso.</p>',
        '<h2>10. Limitazione di responsabilità</h2>',
        '<p>MIA MEDICAL ITALIA non è responsabile per eventuali danni diretti o indiretti derivanti dall’utilizzo improprio dei prodotti venduti o per cause non imputabili direttamente all’azienda.</p>',
        '<h2>11. Legge applicabile e foro competente</h2>',
        '<p>Le presenti Condizioni sono regolate dalla legge italiana. Per qualsiasi controversia sarà competente il Foro del luogo di residenza o domicilio della MIA MEDICAL ITALIA SRL.</p>',
      ].join(''),
    },
    en: {
      title: 'General Terms and Conditions of Sale',
      slug: 'terms-and-conditions',
      body: [
        '<p><em>Last updated: 4 March 2025</em></p>',
        '<p>Welcome to MIAMEDICALITALIA.IT, the official site for the hire and sale of medical and healthcare products. Access to and use of the site are subject to the terms and conditions below. By placing an order you accept these General Terms and Conditions of Sale in full.</p>',
        '<h2>1. Seller</h2>',
        '<p>MIAMEDICAL ITALIA SRL<br />Registered office: Via Gian Pietro Talamini 44, 00144 Rome, Italy<br />VAT no.: 16028971006<br />Email: info@miamedicalitalia.it<br />Telephone: 800031962</p>',
        '<h2>2. Products and availability</h2>',
        '<p>Every product shown on the site is described accurately. We cannot, however, guarantee that the images shown represent the real article exactly. Availability is kept up to date but may change at any moment.</p>',
        '<h2>3. Prices and payment</h2>',
        '<p>Prices are in euro and include VAT where it applies. MIA MEDICAL ITALIA accepts the following means of payment:</p>',
        '<ul><li>credit or debit card</li><li>bank transfer in advance</li><li>cash on delivery, where offered</li></ul>',
        '<p>An order is fulfilled only once payment has been received, except where cash on delivery has been agreed.</p>',
        '<h2>4. Shipping and delivery</h2>',
        '<p>Delivery takes two to five working days, save for events beyond our control. Shipping is free where stated, and only in Rome and Florence for devices that need specific installation; otherwise it costs between €10 and €20. Delays are not attributable to MIA MEDICAL ITALIA but to the appointed courier.</p>',
        '<h2>5. Failed delivery or collection</h2>',
        '<p>MIA MEDICAL ITALIA cannot be held liable for failed or late delivery caused by:</p>',
        '<ul><li>the recipient being absent from the address given, including where a delivery window has been agreed with the courier;</li><li>an incorrect or incomplete address supplied by the customer;</li><li>the customer failing to write “accettazione con riserva” (accepted subject to inspection) on the courier’s receipt or handheld device when a parcel arrives damaged or looks suspect.</li></ul>',
        '<p>In those cases any storage, redelivery or reshipping charges fall to the customer. It is the customer’s responsibility to be present at the agreed delivery and to check that the parcel is intact before accepting it. Without “accettazione con riserva”, no claim for transit damage can be opened.</p>',
        '<h2>6. Goods damaged on delivery</h2>',
        '<p>The customer must check the outer packaging on delivery. Where damage is visible — a parcel that is crushed, wet or already open — it is compulsory to sign “ACCETTO CON RISERVA” and state the reason, for example “imballo danneggiato”.</p>',
        '<p>If the customer accepts delivery without reservation and later reports damage to the device, MIA MEDICAL ITALIA accepts no liability, because the damage can no longer be attributed to transit with any certainty.</p>',
        '<p>Damage not visible on delivery must be reported by email to info@miamedicalitalia.it within 48 hours of receipt, with photographs and a detailed description. After that, claims and replacement requests for transit damage cannot be accepted.</p>',
        '<h2>7. Right of withdrawal and returns</h2>',
        '<p>Under Italian Legislative Decree 206/2005 (the Consumer Code), the customer may withdraw from a purchase within 14 days of receiving the goods, without giving a reason.</p>',
        '<p><strong>Exceptions.</strong> Under article 59 of the Consumer Code, the right of withdrawal does not apply to the hire of medical devices, which is the supply of a service involving goods configured for the customer or clearly intended for a specific and urgent use, and for which the law grants no right of withdrawal.</p>',
        '<p><strong>Conditions for withdrawal (purchases of goods).</strong></p>',
        '<ul><li>The product must be undamaged, unused and returned in its original packaging.</li><li>Sealed items that have been opened or used cannot be returned — single-use devices, or anything that touches the skin.</li><li>Return shipping is at the customer’s expense.</li></ul>',
        '<p><strong>How to withdraw (purchases not excluded above).</strong></p>',
        '<ul><li>Write to info@miamedicalitalia.it quoting the order number and the reason for the return.</li><li>Once authorised, you will receive instructions on how to proceed.</li><li>The refund is made within 14 days of the returned product being received and checked.</li></ul>',
        '<h2>8. Security deposit on hire</h2>',
        '<p>For the hire of medical devices MIAMEDICAL ITALIA takes a security deposit, the amount of which depends on the type of equipment hired. The amount is stated when the order is confirmed.</p>',
        '<p><strong>Deposit terms.</strong></p>',
        '<ul><li>The deposit is compulsory and must be paid before the device is dispatched.</li><li>It is returned in full within four working days of the device coming back, once it has been checked.</li><li>The check is carried out by our own department, to establish that the equipment is undamaged, working and complete with every accessory.</li></ul>',
        '<p>Where the device is damaged, tampered with, missing accessories or abnormally worn, MIAMEDICAL ITALIA reserves the right to retain part or all of the deposit, notifying the customer in writing.</p>',
        '<h2>9. Statutory guarantees</h2>',
        '<p>Every product sold is covered by the statutory guarantee of conformity under articles 128-135 of the Consumer Code. Where a product is faulty or does not conform, MIA MEDICAL ITALIA undertakes to replace it or refund it.</p>',
        '<h2>10. Limitation of liability</h2>',
        '<p>MIA MEDICAL ITALIA is not liable for direct or indirect loss arising from improper use of the products sold, or from causes not directly attributable to the company.</p>',
        '<h2>11. Governing law and jurisdiction</h2>',
        '<p>These Terms are governed by Italian law. Any dispute falls to the court of the place where MIA MEDICAL ITALIA SRL is resident or domiciled.</p>',
      ].join(''),
    },
  },
});
