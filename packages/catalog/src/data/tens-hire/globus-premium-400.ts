/**
 * Noleggio TENS Elettrostimolatore GLOBUS Premium 400
 *
 * /prodotto/noleggio-tens-elettrostimolatore-globus-premium-400/
 * WooCommerce product 12417. Also sold outright, as `tens-sale/globus-premium-400`.
 *
 * ⚠️ Eight variations, four durations — the same compulsory electrode axis as
 * 9455, with the packs at 8 € and 13 €.
 *
 * Delivery 15 € out and 15 € back, free from 45 days.
 */

import { days } from '../shared/packages.ts';
import { electrodes, homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { tensHire } from './category.ts';

export const globusPremium400 = tensHire.rental({
  code: 'globus-premium-400',
  status: 'active',
  brand: 'Globus',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(20, 100),  // 20 giorni - 100 € — label (the charged price bundles the compulsory electrode pack)
    days(30, 125),  // 30 giorni - 125 € — label (the charged price bundles the compulsory electrode pack)
    days(45, 160),  // 45 giorni - 160 € — label (the charged price bundles the compulsory electrode pack)
    days(60, 210),  // 60 giorni - 210 € — label (the charged price bundles the compulsory electrode pack)
  ],

  translations: {
    it: {
      title: 'Noleggio TENS Elettrostimolatore GLOBUS Premium 400',
      slug: 'noleggio-tens-elettrostimolatore-globus-premium-400',
      shortDescription: 'Noleggio Tens elettrostimolatore Consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Consegna gratis se acquisti un noleggio per un minimo di 45 giorni. Ricordati di acquistare anche gli elettrodi, necessari per usare l’elettrostimolatore Tens. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio TENS Elettrostimolatore GLOBUS Premium 400',
      metaDescription: 'Noleggio TENS Elettrostimolatore a partire da 2,90 Euro al giorno. Consegna a domicilio. Apparecchi per la Tens sicuri, affidabili e facili da usare.',
      description: [
        '<p>Scopri il servizio di <strong>noleggio del dispositivo GLOBUS Premium 400</strong>, <a href="https://www.globuscorporation.com/it/prodotti-domiciliari/premium-400/">l’elettrostimolatore professionale</a> ideale per trattare il dolore, rafforzare i muscoli e favorire il recupero funzionale direttamente a casa. Disponibile anche a noleggio con il servizio completo di&nbsp;<strong>Mia Medical Italia</strong>.</p>',
        '<h4>Cosa è la terapia TENS?</h4>',
        '<p>TENS è l&#8217;acronimo di&nbsp;<strong><a href="https://www.my-personaltrainer.it/salute-benessere/tens.html">Transcutaneous Electrical Nerve Stimulation</a></strong>: una terapia non invasiva che utilizza impulsi elettrici a bassa frequenza per&nbsp;<strong>alleviare il dolore</strong>. Gli impulsi, trasmessi tramite elettrodi sulla pelle, agiscono sul sistema nervoso per bloccare la percezione del dolore e stimolare la produzione di endorfine. <strong><a href="https://wa.me/393926509237">Contattaci ora</a></strong> per una consulenza gratuita, senza impegno, e <strong>noleggia oggi stesso il tuo dispositivo TENS Elettrostimolatore, consegna rapida</strong>!</p>',
        '<p>L&#8217;effetto è&nbsp;<strong>immediato</strong>, il paziente comincia a sentirsi notevolmente meglio dopo circa 15 minuti, ma questo effetto tende ad esaurirsi altrettanto rapidamente, dopo circa 4-5 ore. È quindi importante concludere un ciclo terapeutico di circa 10-20 sedute, della durata ciascuna di 30-50 minuti: in questo modo la contrattura muscolare riflessa si attenua di seduta in seduta ed i cataboliti eliminati consentono un&#8217;importante risoluzione del problema.</p>',
        '<h4>Noleggio Tens Elettrostimolatore <strong>GLOBUS Premium 400: caratteristiche del dispositivo</strong></h4>',
        '<p>Il GLOBUS Premium 400 è un elettrostimolatore di fascia alta, progettato per uso domiciliare e professionale.<br />Tra le sue&nbsp;<strong>principali caratteristiche tecniche</strong>:</p>',
        '<ul><li><strong>4 canali indipendenti</strong>&nbsp;per trattare più zone contemporaneamente</li><li><strong>TENS, EMS, ionoforesi e microcorrenti</strong>&nbsp;per trattamenti diversificati</li><li>Ampio&nbsp;<strong>display retroilluminato</strong>&nbsp;e interfaccia intuitiva</li><li><strong>Programmi preimpostati</strong>&nbsp;per oltre 400 trattamenti</li><li>Funzione&nbsp;<strong>“AutoStim”</strong>&nbsp;per facilitare l’utilizzo anche ai meno esperti</li><li>Alimentazione a batteria ricaricabile di lunga durata</li></ul>',
        '<h4>A chi è utile il Noleggio di GLOBUS Premium 400</h4>',
        '<p>Le patologie trattabili con GLOBUS Premium 400 sono varie, tra cui:</p>',
        '<ul><li><strong>Dolori muscolari e articolari</strong>&nbsp;(lombalgia, cervicalgia, tendiniti)</li><li><strong>Nevralgie</strong>&nbsp;(sciatica, tunnel carpale)</li><li><strong>Disturbi post-operatori</strong>&nbsp;(riabilitazione e analgesia)</li><li><strong>Infortuni sportivi</strong>&nbsp;(contratture, stiramenti)</li><li><strong>Problemi di circolazione e linfodrenaggio</strong></li><li><strong>Atrofie muscolari</strong>&nbsp;o&nbsp;<strong>ipotonia post-traumatica</strong></li></ul>',
        '<h4>Benefici dell’Elettroterapia con GLOBUS Premium 400</h4>',
        '<ul><li><strong>Riduzione immediata del dolore</strong>&nbsp;senza farmaci</li><li><strong>Recupero muscolare più rapido</strong></li><li><strong>Miglioramento della mobilità articolare</strong></li><li><strong>Prevenzione dell’atrofia</strong>&nbsp;in caso di immobilizzazione</li><li><strong>Azione drenante e tonificante</strong>&nbsp;per il benessere generale</li></ul>',
        '<h4><strong>Quale programma usare? TENS, EMS, ionoforesi o microcorrenti: le differenze spiegate</strong></h4>',
        '<p>Il GLOBUS Premium 400 è un elettrostimolatore multifunzione, progettato per offrire <strong>diversi tipi di trattamenti</strong> a seconda delle esigenze dell’utente. Ecco una guida per scegliere <strong>il programma giusto al momento giusto</strong>.</p>',
        '<p><strong>TENS</strong></p>',
        '<p><strong>Quando usarla</strong>: in presenza di <strong>dolore acuto o cronico</strong>, come:</p>',
        '<ul><li>Lombalgia, cervicalgia, sciatalgia</li><li>Nevralgie e dolori post-operatori</li><li>Dolore muscolare da sovraccarico</li></ul>',
        '<p>Come funziona: stimola le fibre nervose per <strong>bloccare la trasmissione del dolore</strong> e aumentare la produzione di <strong>endorfine</strong>. Ideale per chi soffre di dolori ricorrenti e/o vuole evitare i farmaci. </p>',
        '<p><strong>EMS</strong></p>',
        '<p><strong>Quando usarla</strong>: per&nbsp;<strong>rafforzare i muscoli</strong>&nbsp;o favorire il recupero dopo un infortunio o intervento:</p>',
        '<ul><li>Atrofia muscolare, ipotonia</li><li>riabilitazione post-frattura </li><li>tonificazione per sportivi</li></ul>',
        '<p>Come funziona: eccita i muscoli normo innervati o denervati, provocando contrazioni muscolari controllate, imitando l’attività fisica. Ideale per sportivi, anziani, persone in riabilitazione. </p>',
        '<p><strong>IONOFORESI</strong></p>',
        '<p>Quando utilizzarla: se si desidera&nbsp;<strong>applicare farmaci localmente</strong>&nbsp;(come antinfiammatori) senza iniezioni:</p>',
        '<ul><li>Tendiniti, infiammazioni locali</li><li>Artrite e dolori articolari</li></ul>',
        '<p>Come funziona: utilizza la corrente per <strong>veicolare principi attivi attraverso la pelle</strong>. Ideale per chi ha bisogno di un’azione farmacologica mirata in una specifica zona. </p>',
        '<p><strong>MICROCORRENTI</strong></p>',
        '<p><strong>Quando usarla</strong>: in caso di&nbsp;<strong>lesioni muscolari, edemi o infiammazioni lievi</strong>:</p>',
        '<ul><li>Traumi sportivi, contusioni, distorsioni</li><li>Recupero post-operatorio</li></ul>',
        '<p><strong>Come funziona</strong>: stimola&nbsp;<strong>la rigenerazione cellulare e la circolazione linfatica</strong>&nbsp;con impulsi a bassissima intensità. Ideal per accelerare i tempi di recupero e favorire la&nbsp;<strong>guarigione dei tessuti</strong>.</p>',
        '<p><strong>Consiglio dell’esperto</strong>:<br />In caso di dubbi, chiedi sempre un parere al tuo fisioterapista o al nostro team di assistenza. Utilizzare il programma corretto è essenziale per ottenere i&nbsp;<strong>massimi benefici</strong>&nbsp;dal tuo elettrostimolatore GLOBUS Premium 400.</p>',
        '<h4>Controindicazioni e Possibili Effetti Collaterali </h4>',
        '<p><strong>ATTENZIONE</strong>: Come tutti i dispositivi elettromedicali, anche l’uso del GLOBUS Premium 400 deve essere valutato con attenzione. Il dispositivo è <strong>CONTROINDICATO</strong> nei casi di:</p>',
        '<ul><li><strong>Portatori di pacemaker</strong></li><li><strong>Gravidanza</strong></li><li><strong>Epilessia</strong></li><li><strong>Lesioni cutanee aperte</strong></li><li><strong>Patologie cardiache non controllate</strong></li></ul>',
        '<p><strong>Possibili effetti collaterali:</strong></p>',
        '<ul><li><strong>Irritazione cutanea</strong>&nbsp;nei punti di applicazione degli elettrodi</li><li><strong>Contrazioni muscolari eccessive</strong>&nbsp;se il dispositivo non è utilizzato correttamente</li><li><strong>Malessere temporaneo</strong>&nbsp;in soggetti molto sensibili</li></ul>',
        '<p>Si consiglia sempre di consultare un medico prima dell’utilizzo.</p>',
        '<h4>Il Servizio di Noleggio di Mia Medical Italia: la tua salute al primo posto </h4>',
        '<p>Il noleggio del GLOBUS Premium 400 rappresenta una soluzione&nbsp;<strong>economica, flessibile e accessibile</strong>&nbsp;per chi ha bisogno di trattamenti temporanei o desidera testare il dispositivo prima dell’acquisto. Scegliendo&nbsp;<em>Mia Medical Italia</em>, hai accesso a un servizio affidabile e professionale:</p>',
        '<ul><li><strong>Dispositivi certificati e sicuri</strong>, dai migliori fornitori sul mercato</li><li><strong>Consulenza personalizzata gratuita</strong>, senza impegno</li><li><strong>Assistenza clienti dedicata</strong></li><li><strong>Consegna rapida in tutta Italia</strong></li><li><strong>Istruzioni d’uso chiare e supporto continuo</strong></li></ul>',
        '<p>Cosa aspetti! Recupera più velocemente, allevia il dolore e migliora la qualità della tua vita, scegli il servizio di <strong>noleggio del TENS Elettrostimolatore GLOBUS Premium 400</strong>.<br /><strong>Contattaci ora</strong>&nbsp;al <strong>+39 392 65 09 237</strong> per richiedere informazioni sul noleggio o per prenotare il tuo dispositivo.</p>',
      ].join(''),
    },
    en: {
      title: 'GLOBUS Premium 400 TENS stimulator, for hire',
      slug: 'noleggio-tens-elettrostimolatore-globus-premium-400',
      shortDescription: 'Tens electrostimulator rental Home delivery throughout Italy from 15€ + 15€ for collection. Free delivery if you purchase a rental for a minimum of 45 days. Remember to also buy the electrodes, which are needed to use the Tens electro-stimulator. No deposit required!',
      metaTitle: 'GLOBUS Premium 400 TENS stimulator hire',
      metaDescription: 'TENS stimulator hire from €2.90 a day, delivered to your door. Safe, reliable TENS units that are easy to use.',
      description: [
        '<p>Discover the service of <strong>GLOBUS Premium 400 device rental</strong>, <a href="https://www.globuscorporation.com/it/prodotti-domiciliari/premium-400/">the professional electrostimulator</a> ideal for treating pain, strengthening muscles and promoting functional recovery right at home. Also available for hire with the full service of&nbsp;<strong>Mia Medical Italia</strong>.</p>',
        '<h4>What is TENS therapy?</h4>',
        '<p>TENS stands for&nbsp;<strong><a href="https://www.my-personaltrainer.it/salute-benessere/tens.html">Transcutaneous Electrical Nerve Stimulation</a></strong>a non-invasive therapy that uses low-frequency electrical impulses to&nbsp;<strong>alleviate pain</strong>. The impulses, transmitted via electrodes on the skin, act on the nervous system to block the perception of pain and stimulate the production of endorphins. <strong><a href="https://wa.me/393926509237">Contact us now</a></strong> for a free, no-obligation consultation, and <strong>rent your TENS electro-stimulator device today, fast delivery</strong>!</p>',
        '<p>The effect is&nbsp;<strong>immediate</strong>The patient begins to feel noticeably better after about 15 minutes, but this effect tends to wear off just as quickly, after about 4-5 hours. It is therefore important to complete a therapeutic cycle of about 10-20 sessions, each lasting 30-50 minutes: in this way, the reflex muscle contracture subsides from session to session and the catabolites eliminated allow a significant resolution of the problem.</p>',
        '<h4>Tens Electrostimulator Hire <strong>GLOBUS Premium 400: Device features</strong></h4>',
        '<p>The GLOBUS Premium 400 is a high-end electrostimulator designed for home and professional use.<br />Among its&nbsp;<strong>main technical features</strong>:</p>',
        '<ul><li><strong>4 independent channels</strong>&nbsp;to treat several areas simultaneously</li><li><strong>TENS, EMS, iontophoresis and microcurrents</strong>&nbsp;for diversified treatment</li><li>Large&nbsp;<strong>backlit display</strong>&nbsp;and intuitive interface</li><li><strong>Preset programmes</strong>&nbsp;for over 400 treatments</li><li>Function&nbsp;<strong>\'AutoStim\'</strong>&nbsp;for ease of use even for the less experienced</li><li>Long-lasting rechargeable battery power supply</li></ul>',
        '<h4>Who benefits from GLOBUS Premium 400 Rental</h4>',
        '<p>The diseases that can be treated with GLOBUS Premium 400 are varied, including:</p>',
        '<ul><li><strong>Muscle and joint pain</strong>&nbsp;(lumbago, cervicalgia, tendinitis)</li><li><strong>Neuralgia</strong>&nbsp;(sciatica, carpal tunnel)</li><li><strong>Post-operative disorders</strong>&nbsp;(rehabilitation and analgesia)</li><li><strong>Sports injuries</strong>&nbsp;(contractures, strains)</li><li><strong>Circulation problems and lymph drainage</strong></li><li><strong>Muscle atrophies</strong>&nbsp;o&nbsp;<strong>post-traumatic hypotonia</strong></li></ul>',
        '<h4>Benefits of Electrotherapy with GLOBUS Premium 400</h4>',
        '<ul><li><strong>Immediate pain reduction</strong>&nbsp;without drugs</li><li><strong>Faster muscle recovery</strong></li><li><strong>Improved joint mobility</strong></li><li><strong>Prevention of atrophy</strong>&nbsp;in case of immobilisation</li><li><strong>Draining and toning action</strong>&nbsp;for general well-being</li></ul>',
        '<h4><strong>Which programme to use? TENS, EMS, Iontophoresis or microcurrents: the differences explained</strong></h4>',
        '<p>The GLOBUS Premium 400 is a multifunctional electrostimulator designed to offer <strong>different types of treatment</strong> depending on the user\'s needs. Here is a guide to choosing <strong>the right programme at the right time</strong>.</p>',
        '<p><strong>TENS</strong></p>',
        '<p><strong>When to use it</strong>: in the presence of <strong>acute or chronic pain</strong>, such as:</p>',
        '<ul><li>Lumbago, cervicalgia, sciatica</li><li>Neuralgia and post-operative pain</li><li>Muscle pain from overload</li></ul>',
        '<p>How it works: stimulates nerve fibres to <strong>blocking the transmission of pain</strong> and increase the production of <strong>endorphins</strong>. Ideal for those who suffer from recurring pain and/or want to avoid medication. </p>',
        '<p><strong>EMS</strong></p>',
        '<p><strong>When to use it</strong>: for&nbsp;<strong>strengthening muscles</strong>&nbsp;or aid recovery after injury or surgery:</p>',
        '<ul><li>Muscle atrophy, hypotonia</li><li>post-fracture rehabilitation </li><li>toning for athletes</li></ul>',
        '<p>How it works: excites normo- or denervated muscles, causing controlled muscle contractions, mimicking physical activity. Ideal for sportspeople, the elderly, people in rehabilitation. </p>',
        '<p><strong>IONOPHORESIS</strong></p>',
        '<p>When to use it: if you want to&nbsp;<strong>apply drugs locally</strong>&nbsp;(as anti-inflammatories) without injections:</p>',
        '<ul><li>Tendinitis, local inflammation</li><li>Arthritis and joint pain</li></ul>',
        '<p>How it works: it uses electricity to <strong>convey active ingredients through the skin</strong>. Ideal for those who need targeted pharmacological action in a specific area. </p>',
        '<p><strong>MICROCORRENTS</strong></p>',
        '<p><strong>When to use it</strong>: in case of&nbsp;<strong>muscle injuries, oedema or mild inflammation</strong>:</p>',
        '<ul><li>Sports injuries, bruises, sprains</li><li>Post-operative recovery</li></ul>',
        '<p><strong>How it works</strong>: stimulates&nbsp;<strong>cell regeneration and lymphatic circulation</strong>&nbsp;with very low intensity pulses. Ideal for speeding up recovery times and promoting the&nbsp;<strong>tissue healing</strong>.</p>',
        '<p><strong>Expert\'s advice</strong>:<br />If in doubt, always seek advice from your physiotherapist or our service team. Using the correct programme is essential to achieve the&nbsp;<strong>maximum benefits</strong>&nbsp;from your GLOBUS Premium 400 electrostimulator.</p>',
        '<h4>Contraindications and Possible Side Effects </h4>',
        '<p><strong>ATTENTION</strong>: Like all electromedical devices, the use of the GLOBUS Premium 400 must be carefully considered. The device is <strong>CONTRAINDICATED</strong> in cases of:</p>',
        '<ul><li><strong>Pacemaker wearers</strong></li><li><strong>Pregnancy</strong></li><li><strong>Epilepsy</strong></li><li><strong>Open skin lesions</strong></li><li><strong>Uncontrolled heart disease</strong></li></ul>',
        '<p><strong>Possible side effects:</strong></p>',
        '<ul><li><strong>Skin irritation</strong>&nbsp;at electrode application points</li><li><strong>Excessive muscle contractions</strong>&nbsp;if the device is not used correctly</li><li><strong>Temporary malaise</strong>&nbsp;in very sensitive subjects</li></ul>',
        '<p>It is always advisable to consult a doctor before use.</p>',
        '<h4>Mia Medical Italia\'s Rental Service: your health comes first </h4>',
        '<p>Hiring the GLOBUS Premium 400 is a solution&nbsp;<strong>cheap, flexible and accessible</strong>&nbsp;for those who need temporary treatments or wish to test the device before purchase. By choosing&nbsp;<em>Mia Medical Italia</em>you have access to a reliable and professional service:</p>',
        '<ul><li><strong>Certified and safe devices</strong>from the best suppliers on the market</li><li><strong>Free personalised counselling</strong>, without obligation</li><li><strong>Dedicated customer support</strong></li><li><strong>Fast delivery throughout Italy</strong></li><li><strong>Clear operating instructions and continuous support</strong></li></ul>',
        '<p>What are you waiting for! Recover faster, relieve pain and improve your quality of life, choose the service of <strong>rental of the GLOBUS Premium 400 TENS electro-stimulator</strong>.<br /><strong>Contact us now</strong>&nbsp;at <strong>+39 392 65 09 237</strong> to request rental information or to reserve your device.</p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: { file: 'globus-premium-400-1.jpg', alt: { it: 'Noleggio ausili per terapia a domicilio' } },
    gallery: [
      'globus-premium-400-2.jpg',
      'globus-premium-400-3.jpg',
    ],
  },

  addons: [electrodes('5 x 5 cm', 8), electrodes('5 x 9 cm', 13), homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
