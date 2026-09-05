/**
 * Kinetec + Tens o Magnetoterapia
 *
 * /prodotto/kinetec-elettrostimolatore-tens-o-magnetoterapia/
 * WooCommerce product 9431 — a CPM machine paired with EITHER a TENS unit or a
 * magnetotherapy one; the page leaves the choice open and so does this.
 *
 * The site lists it under Kinetec, Magnetoterapia and Tens. It is filed here
 * because the site's OWN Yoast primary term for it is Tens — the only combined
 * package for which the site names a leaf category itself.
 *
 * Delivery from 30 €, free from 30 days. No deposit.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { tensHire } from './category.ts';

export const kinetecAndTensOrMagnetotherapy = tensHire.rental({
  code: 'kinetec-and-tens-or-magnetotherapy',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 240),
    days(20, 290),
    days(30, 360),
  ],

  translations: {
    it: {
      title: 'Kinetec + Tens o Magnetoterapia',
      slug: 'kinetec-elettrostimolatore-tens-o-magnetoterapia',
      shortDescription: 'Prenotazione facile, costi chiari, ausili di ultima generazione Consegna a Roma e Firenze a partire da 30€. Consegna gratuita per i noleggi da 30 giorni! Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Kinetec + Tens o Magnetoterapia - Mia Medical Italia',
      metaDescription: 'Noleggio del kinetec + elettrostimolatore Tens o magnetoterapia. Combo ideale per la fisioterapia a domicilio. Recupero veloce post trauma. Prenota online!',
      description: [
        '<h2><strong>Noleggio Combinato KINETEC + MAGNETOTERAPIA o TENS Elettrostimolatore&nbsp;</strong></h2>',
        '<p><strong>La soluzione completa per la riabilitazione elettromedicale a domicilio</strong></p>',
        '<p>Le terapie elettromedicali svolte in clinica o nei centri fisioterapici comportano spesso&nbsp;<strong>costi elevati, un numero limitato di sedute e vincoli di orario</strong>. Questo può rallentare il recupero, soprattutto nei percorsi post-operatori o post-traumatici che richiedono continuità e ripetizione quotidiana del trattamento.</p>',
        '<p>Il&nbsp;<strong>noleggio combinato di Kinetec con Magnetoterapia o TENS</strong>&nbsp;di Mia Medical Italia nasce proprio per offrire una soluzione più efficace e sostenibile, per consentire al paziente di&nbsp;<strong>proseguire la terapia ogni giorno direttamente a casa</strong>, senza limiti di sedute e senza interruzioni.</p>',
        '<p>Con il noleggio domiciliare, il percorso di cura non si ferma dopo 10 trattamenti, ma può continuare per tutto il tempo realmente necessario, con la possibilità di proroga in base all’evoluzione clinica.</p>',
        '<h3><strong>A chi è indicato il noleggio combinato di KINETEC + MAGNETOTERAPIA o TENS Elettrostimolatore&nbsp;</strong></h3>',
        '<p>Questo pacchetto è particolarmente indicato per pazienti che devono affrontare:</p>',
        '<ul><li>recupero post-operatorio al ginocchio</li><li>riabilitazione post-traumatica</li><li>rigidità articolare</li><li>dolore muscolare o articolare</li><li>riduzione del range di movimento</li><li>infiammazioni acute o croniche</li><li>interventi ortopedici agli arti inferiori</li><li>traumi sportivi</li><li>fase riabilitativa seguita da fisioterapista</li><li>sportivi in fase di recupero post-infortunio</li></ul>',
        '<p>Il pacchetto è adatto sia a pazienti in riabilitazione clinica sia a sportivi che necessitano di un recupero funzionale controllato.</p>',
        '<h3><strong>In cosa consiste il noleggio combinato di KINETEC + MAGNETOTERAPIA o TENS Elettrostimolatore&nbsp;</strong></h3>',
        '<p>Il noleggio include una combinazione di dispositivi elettromedicali professionali, utilizzati quotidianamente nei percorsi riabilitativi ortopedici.</p>',
        '<h4><strong><a href="/catalogo-noleggio/">Kinetec : Mobilizzatore passivo continuo (CPM)</a></strong></h4>',
        '<p>Il Kinetec è un dispositivo medico progettato per la&nbsp;<strong>mobilizzazione passiva dell’articolazione del ginocchio</strong>. Il movimento viene effettuato in modo automatico, senza sforzo attivo da parte del paziente.</p>',
        '<p><strong>Funzioni principali:</strong></p>',
        '<ul><li>flessione ed estensione controllata del ginocchio</li><li>regolazione graduale dell’angolo di movimento</li><li>movimento continuo e ripetitivo</li><li>utilizzo in fase precoce post-operatoria</li></ul>',
        '<p><strong>Benefici clinici:</strong></p>',
        '<ul><li>prevenzione della rigidità articolare</li><li>miglioramento del recupero del range articolare</li><li>riduzione del dolore post-operatorio</li><li>diminuzione dell’edema</li><li>stimolazione della circolazione</li></ul>',
        '<p>Il Kinetec è spesso prescritto già nei primi giorni dopo l’intervento, quando il movimento attivo non è ancora possibile.</p>',
        '<h4><strong>Magnetoterapia oppure Elettrostimolatore TENS&nbsp;</strong></h4>',
        '<p>Il pacchetto prevede la possibilità di scegliere&nbsp;<strong>uno dei due dispositivi</strong>, in base alle indicazioni terapeutiche.</p>',
        '<h4><strong><a href="/catalogo-noleggio/">Magnetoterapia</a></strong></h4>',
        '<p>La magnetoterapia utilizza campi magnetici pulsati a bassa frequenza.</p>',
        '<p>È indicata per:</p>',
        '<ul><li>accelerare i processi di guarigione</li><li>ridurre infiammazione e dolore</li><li>favorire il recupero osseo e tissutale</li></ul>',
        '<p>Utilizzata frequentemente in caso di:</p>',
        '<ul><li>edemi post-operatori</li><li>infiammazioni articolari</li><li>ritardi di consolidamento</li><li>artrosi</li><li>traumi muscolo-scheletrici</li></ul>',
        '<p>Può essere effettuata anche per molte ore al giorno, senza effetti collaterali.</p>',
        '<h4><strong><a href="/catalogo-noleggio/">Elettrostimolatore TENS</a></strong></h4>',
        '<p>La TENS (Stimolazione Elettrica Nervosa Transcutanea) agisce attraverso impulsi elettrici a bassa intensità.</p>',
        '<p>È indicata per:</p>',
        '<ul><li>riduzione del dolore</li><li>rilassamento muscolare</li><li>recupero muscolare</li><li>stimolazione neuromuscolare</li></ul>',
        '<p>È particolarmente utile in caso di:</p>',
        '<ul><li>dolore post-operatorio</li><li>contratture</li><li>debolezza muscolare</li><li>recupero funzionale dopo immobilizzazione</li></ul>',
        '<h4><strong>Impostazione personalizzata dei parametri</strong></h4>',
        '<p>Alla consegna, i nostri tecnici specializzati provvedono a:</p>',
        '<ul><li>impostazione personalizzata dei parametri terapeutici</li><li>spiegazione completa del funzionamento</li><li>formazione pratica sull’utilizzo</li><li>indicazioni per un trattamento efficace e sicuro</li></ul>',
        '<p>In questo modo il paziente può utilizzare i dispositivi&nbsp;<strong>in autonomia e con tranquillità</strong>, direttamente a casa.</p>',
        '<h3><strong>Perché scegliere il noleggio elettromedicale a domicilio</strong></h3>',
        '<p>Il noleggio consente di:</p>',
        '<ul><li>effettuare la terapia ogni giorno</li><li>ripetere il trattamento più volte</li><li>evitare i limiti delle sedute ambulatoriali</li><li>ridurre i costi complessivi</li><li>seguire i tempi reali del recupero</li><li>adattare la durata alle proprie esigenze</li></ul>',
        '<p>Il recupero funzionale non è uguale per tutti: la possibilità di proroga rende il percorso realmente personalizzato.</p>',
        '<p><strong>Opzioni di forfeit disponibili</strong></p>',
        '<p>Periodo minimo di noleggio: 15 giorni</p>',
        '<ul><li>Noleggio 30 giorni : Prezzo al giorno, 13,30 €</li><li>Noleggio 15 giorni : Prezzo al giorno, 15,30 €</li><li>Prezzi IVA inclusa</li><li>Nessun deposito cauzionale</li><li>Promozioni valide esclusivamente per noleggi effettuati tramite sito web</li></ul>',
        '<p>È sempre possibile prorogare il noleggio in base all’andamento della riabilitazione.</p>',
        '<h3><strong>Consegna, ritiro e tempistiche</strong></h3>',
        '<ul><li>Consegna a Roma e Firenze a partire da 30 € + 30 € di ritiro</li><li>Consegna gratuita per noleggi da 30 giorni</li><li>Consegna e ritiro presso magazzino gratuiti</li></ul>',
        '<p>Il costo del trasporto include:</p>',
        '<ul><li>consegna a domicilio</li><li>montaggio</li><li>impostazione iniziale</li></ul>',
        '<p>La consegna viene effettuata&nbsp;<strong>entro 48 ore dalla chiamata</strong>, salvo diversa disponibilità.</p>',
        '<p>Con il noleggio vengono fornite:</p>',
        '<ul><li>istruzioni complete all’uso</li><li>formazione pratica</li><li>supporto tecnico</li><li>assistenza durante tutto il periodo di noleggio</li></ul>',
        '<p>Il nostro obiettivo è permetterti di svolgere la terapia&nbsp;<strong>nel modo più efficace, sicuro e confortevole possibile</strong>.</p>',
        '<h3><strong>Perché scegliere Mia Medical Italia</strong></h3>',
        '<ul><li>dispositivi elettromedicali professionali certificati</li><li>tecnici esperti e formati per assistenza e consulenza&nbsp;</li><li>impostazione personalizzata dei trattamenti</li><li>nessun deposito cauzionale</li><li>consegna rapida</li><li>possibilità di proroga</li></ul>',
        '<p>Con Mia Medical Italia la riabilitazione non si interrompe ma prosegue a casa, con i giusti strumenti e con il giusto supporto. <a href="https://wa.me/393926509237">Contattaci per richiedere un preventivo.</a></p>',
      ].join(''),
    },
    en: {
      title: 'Kinetec + TENS or magnetotherapy, combined hire',
      slug: 'kinetec-elettrostimolatore-tens-o-magnetoterapia',
      shortDescription: 'Easy booking, clear costs, current-generation equipment. Delivery in Rome and Florence from €30. Free delivery on hires of 30 days or more! No deposit required. Delivery and collection at the warehouse are FREE!',
      metaTitle: 'Kinetec + TENS or magnetotherapy - Mia Medical Italia',
      metaDescription: 'Hire a Kinetec CPM machine with a TENS stimulator or magnetotherapy. The right set for physiotherapy at home and a quick recovery.',
      description: [
        '<h2><strong>KINETEC + MAGNETOTHERAPY or TENS Electrostimulator Combined Rental&nbsp;</strong></h2>',
        '<p><strong>The complete solution for electro-medical rehabilitation at home</strong></p>',
        '<p>Electromedical therapies carried out in clinics or physiotherapy centres often involve&nbsp;<strong>high costs, limited number of sessions and time constraints</strong>. This can slow down recovery, especially in post-operative or post-traumatic pathways that require continuity and daily repetition of treatment.</p>',
        '<p>The&nbsp;<strong>combined rental of Kinetec with Magnetotherapy or TENS</strong>&nbsp;of Mia Medical Italia was created precisely to offer a more effective and sustainable solution, to enable the patient to&nbsp;<strong>continue the therapy every day directly at home</strong>, unlimited sessions and without interruptions.</p>',
        '<p>With home hire, the course of treatment does not stop after 10 treatments, but can continue for as long as is really necessary, with the possibility of extension according to clinical evolution.</p>',
        '<h3><strong>For whom the combined rental of KINETEC + MAGNETOTHERAPY or TENS electro-stimulator is indicated&nbsp;</strong></h3>',
        '<p>This package is particularly suitable for patients who have to cope:</p>',
        '<ul><li>post-operative knee recovery</li><li>post-traumatic rehabilitation</li><li>joint stiffness</li><li>muscle or joint pain</li><li>reduced range of motion</li><li>acute or chronic inflammation</li><li>orthopaedic operations on the lower limbs</li><li>sports injuries</li><li>rehabilitation phase followed by physiotherapist</li><li>athletes recovering from injury</li></ul>',
        '<p>The package is suitable for patients undergoing clinical rehabilitation as well as for athletes in need of controlled functional recovery.</p>',
        '<h3><strong>What is the combined rental of KINETEC + MAGNETOTHERAPY or TENS Electrostimulator&nbsp;</strong></h3>',
        '<p>The rental includes a combination of professional electro-medical devices used daily in orthopaedic rehabilitation.</p>',
        '<h4><strong><a href="/en/rental-catalog/">Kinetec : Continuous passive mobiliser (CPM)</a></strong></h4>',
        '<p>The Kinetec is a medical device designed for the&nbsp;<strong>passive mobilisation of the knee joint</strong>. The movement is performed automatically, without active effort on the part of the patient.</p>',
        '<p><strong>Main functions:</strong></p>',
        '<ul><li>controlled knee flexion and extension</li><li>gradual adjustment of the angle of movement</li><li>continuous and repetitive movement</li><li>use in the early post-operative phase</li></ul>',
        '<p><strong>Clinical benefits:</strong></p>',
        '<ul><li>prevention of joint stiffness</li><li>improvement of joint range recovery</li><li>reduction of post-operative pain</li><li>reduction of oedema</li><li>stimulation of circulation</li></ul>',
        '<p>Kinetec is often prescribed already in the first days after surgery, when active movement is not yet possible.</p>',
        '<h4><strong>Magnetotherapy or TENS electro-stimulator&nbsp;</strong></h4>',
        '<p>The package includes a choice of&nbsp;<strong>one of the two devices</strong>, according to therapeutic indications.</p>',
        '<h4><strong><a href="/en/rental-catalog/">Magnetotherapy</a></strong></h4>',
        '<p>Magnetotherapy uses low-frequency pulsed magnetic fields.</p>',
        '<p>It is indicated for:</p>',
        '<ul><li>accelerate healing processes</li><li>reduce inflammation and pain</li><li>promote bone and tissue recovery</li></ul>',
        '<p>Frequently used in cases of:</p>',
        '<ul><li>post-operative oedemas</li><li>joint inflammations</li><li>consolidation delays</li><li>arthrosis</li><li>musculoskeletal trauma</li></ul>',
        '<p>It can also be carried out for many hours a day without side effects.</p>',
        '<h4><strong><a href="/en/rental-catalog/">TENS electro-stimulator</a></strong></h4>',
        '<p>TENS (Transcutaneous Nervous Electrical Stimulation) works through low-intensity electrical impulses.</p>',
        '<p>It is indicated for:</p>',
        '<ul><li>reduction of pain</li><li>muscle relaxation</li><li>muscle recovery</li><li>neuromuscular stimulation</li></ul>',
        '<p>It is particularly useful in cases of:</p>',
        '<ul><li>post-operative pain</li><li>contractures</li><li>muscle weakness</li><li>functional recovery after immobilisation</li></ul>',
        '<h4><strong>Customised parameter setting</strong></h4>',
        '<p>Upon delivery, our specialised technicians take care of:</p>',
        '<ul><li>customised setting of therapy parameters</li><li>full explanation of operation</li><li>practical user training</li><li>indications for effective and safe treatment</li></ul>',
        '<p>In this way, the patient can use the devices&nbsp;<strong>independently and with peace of mind</strong>, directly at home.</p>',
        '<h3><strong>Why choose home electromedical rental</strong></h3>',
        '<p>The rental allows</p>',
        '<ul><li>carry out therapy every day</li><li>repeat treatment several times</li><li>avoid the limits of outpatient sessions</li><li>reduce overall costs</li><li>follow actual recovery times</li><li>adapt the duration to your needs</li></ul>',
        '<p>Functional recovery is not the same for everyone: the possibility of extension makes the pathway truly customised.</p>',
        '<p><strong>Available forfeit options</strong></p>',
        '<p>Minimum rental period: 15 days</p>',
        '<ul><li>30-day rental: Price per day, €13.30</li><li>15-day rental: Price per day, €15.30</li><li>Prices incl. VAT</li><li>No security deposit</li><li>Promotions only valid for rentals made through the website</li></ul>',
        '<p>It is always possible to extend the rental depending on the progress of the rehabilitation.</p>',
        '<h3><strong>Delivery, collection and timing</strong></h3>',
        '<ul><li>Delivery in Rome and Florence starting from €30 + €30 for collection</li><li>Free delivery for 30-day rentals</li><li>Free delivery and pick-up at warehouse</li></ul>',
        '<p>The cost of transport includes:</p>',
        '<ul><li>home delivery</li><li>assembly</li><li>initial setting</li></ul>',
        '<p>Delivery is made&nbsp;<strong>within 48 hours of the call</strong>, unless otherwise available.</p>',
        '<p>With the rental comes</p>',
        '<ul><li>complete instructions for use</li><li>practical training</li><li>technical support</li><li>assistance throughout the rental period</li></ul>',
        '<p>Our aim is to enable you to carry out therapy&nbsp;<strong>in the most effective, safe and comfortable way possible</strong>.</p>',
        '<h3><strong>Why choose Mia Medical Italia</strong></h3>',
        '<ul><li>certified professional electromedical devices</li><li>experienced and trained technicians for assistance and advice&nbsp;</li><li>customised treatment settings</li><li>no security deposit</li><li>rapid delivery</li><li>possibility of extension</li></ul>',
        '<p>With Mia Medical Italia, rehabilitation does not stop but continues at home, with the right tools and the right support. <a href="https://wa.me/393926509237">Contact us to request a quote.</a></p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: 'kinetec-and-tens-or-magnetotherapy-1.jpg',
    gallery: [
      'kinetec-and-tens-or-magnetotherapy-2.jpg',
      'kinetec-and-tens-or-magnetotherapy-3.jpg',
      'kinetec-and-tens-or-magnetotherapy-4.jpg',
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
