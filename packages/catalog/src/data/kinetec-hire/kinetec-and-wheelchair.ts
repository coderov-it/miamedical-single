/**
 * Noleggio Kinetec CEMP + Carrozzina
 *
 * /prodotto/noleggio-kinetec-carrozzina/  ·  WooCommerce product 9444.
 *
 * A CPM machine paired with a wheelchair chosen for the patient. Listed under
 * both Kinetec and Carrozzine on the site; filed here after its own title.
 *
 * The page prints a daily-rate table — 9,00 € a day at 30 days, 12,30 € at 20,
 * 12,00 € at 15 — which is derived from the packages and is not itself a package.
 * The three real packages are the three variations.
 *
 * ⚠️ Its 30-day variation is labelled "30 giorni - 290 €" in the attribute term
 * list but charges 296 €. The charged figure is written.
 *
 * Delivery from 30 €, free from 30 days. No deposit.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { kinetecHire } from './category.ts';

export const kinetecAndWheelchair = kinetecHire.rental({
  code: 'kinetec-and-wheelchair',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 180),
    days(20, 230),
    days(30, 296),
  ],

  translations: {
    it: {
      title: 'Noleggio Kinetec CEMP + Carrozzina',
      slug: 'noleggio-kinetec-carrozzina',
      shortDescription: 'Consegna a Roma e Firenze Consegna a partire da 30€. Consegna gratuita per i noleggi da 30 giorni! Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Noleggio del Noleggio Kinetec CEMP + Carrozzina - Mia Medical Italia',
      metaDescription: 'Noleggio combo della carrozzina e il kinetec per ginocchio, perfetto per una riabilitazione veloce a casa tua, con consegna. Prenota online ora!',
      description: [
        '<h2><strong>Noleggio Combinato Kinetec + Carrozzina</strong></h2>',
        '<p><strong>La soluzione completa per il recupero post-operatorio e la mobilità assistita a domicilio</strong></p>',
        '<p>Durante una fase post-operatoria delicata, soprattutto in seguito a interventi ortopedici a ginocchio o anca, è fondamentale poter contare su dispositivi che permettano&nbsp;<strong>un recupero progressivo, sicuro e controllato</strong>, riducendo al minimo lo sforzo fisico del paziente.</p>',
        '<p>Il&nbsp;<strong>noleggio combinato Kinetec + Carrozzina</strong>&nbsp;di Mia Medical Italia nasce per rispondere a questa esigenza: un pacchetto pensato per accompagnare il paziente nelle diverse fasi della giornata, unendo&nbsp;<strong>mobilizzazione passiva continua</strong>&nbsp;e&nbsp;<strong>supporto alla mobilità quotidiana</strong>.</p>',
        '<p>Questa combinazione consente di proseguire la riabilitazione direttamente a casa, evitando continui spostamenti verso strutture sanitarie e garantendo continuità terapeutica.</p>',
        '<h3><strong>A chi è indicato il noleggio combinato</strong></h3>',
        '<p>Questa combinazione è particolarmente indicata per pazienti che devono:</p>',
        '<ul><li>limitare il carico e lo sforzo fisico</li><li>recuperare gradualmente la funzionalità articolare</li><li>muoversi in sicurezza durante la convalescenza</li><li>prevenire rigidità e complicanze post-operatorie</li></ul>',
        '<h4><strong>Principali scenari di utilizzo</strong></h4>',
        '<ul><li>interventi chirurgici al ginocchio</li><li>interventi all’anca</li><li>protesi articolari</li><li>post-trauma ortopedico</li><li>fase riabilitativa precoce</li><li>dimissione protetta dall’ospedale</li></ul>',
        '<p>È una soluzione ideale per pazienti che non possono ancora camminare in autonomia ma desiderano mantenere&nbsp;<strong>comfort, sicurezza e una minima indipendenza negli spostamenti quotidiani</strong>.</p>',
        '<h3><strong>In cosa consiste il noleggio combinato Kinetec + Carrozzina</strong></h3>',
        '<p>Il pacchetto include due dispositivi medicali fondamentali nel percorso di recupero funzionale.</p>',
        '<h4><strong><a href="/catalogo-noleggio/">Kinetec : Mobilizzatore passivo continuo (CPM)</a></strong></h4>',
        '<p>Il Kinetec è un dispositivo medico progettato per la&nbsp;<strong>mobilizzazione passiva dell’articolazione</strong>, in particolare del ginocchio.</p>',
        '<p>Il movimento viene effettuato in modo automatico, senza che il paziente debba contrarre attivamente la muscolatura.</p>',
        '<p><strong>Funzioni principali</strong></p>',
        '<ul><li>flessione ed estensione controllata dell’articolazione</li><li>regolazione progressiva dell’angolo di movimento</li><li>movimento continuo, lento e ripetitivo</li><li>utilizzo anche nelle fasi post-operatorie precoci</li></ul>',
        '<p><strong>Benefici</strong></p>',
        '<ul><li>prevenzione della rigidità articolare</li><li>recupero graduale del range di movimento</li><li>riduzione del dolore post-operatorio</li><li>diminuzione dell’edema</li><li>miglioramento della circolazione locale</li></ul>',
        '<p>Il Kinetec viene spesso prescritto già nei primi giorni dopo l’intervento, quando il movimento attivo non è ancora consentito.</p>',
        '<h4><strong><a href="/catalogo-noleggio/">Carrozzina</a></strong></h4>',
        '<p>La carrozzina consente al paziente di effettuare spostamenti brevi e quotidiani in totale sicurezza, evitando sovraccarichi articolari e affaticamento.</p>',
        '<p>È uno strumento essenziale per:</p>',
        '<ul><li>spostamenti interni all’abitazione</li><li>uscite controllate</li><li>mantenimento della socialità</li></ul>',
        '<p>Il modello viene scelto in base alle esigenze cliniche, alla struttura fisica del paziente e all’ambiente domestico.</p>',
        '<p><strong>Tipologie di carrozzine disponibili a noleggio</strong></p>',
        '<p>Mia Medical Italia offre la possibilità di scegliere tra diverse tipologie di carrozzine, per adattarsi a ogni scenario clinico e abitativo.</p>',
        '<p>Modelli disponibili:</p>',
        '<ul><li>carrozzina ad autospinta pieghevole</li><li>carrozzina da transito pieghevole</li><li>carrozzina reclinabile</li><li>carrozzina bariatrica</li><li>carrozzina pediatrica pieghevole</li></ul>',
        '<p>La scelta viene effettuata con il supporto del nostro team, così da garantire&nbsp;<strong>massima sicurezza, comfort e funzionalità</strong>.</p>',
        '<h3><strong>Perché scegliere il noleggio combinato Kinetec + Carrozzina</strong></h3>',
        '<p>Il noleggio combinato consente di:</p>',
        '<ul><li>eseguire la mobilizzazione passiva ogni giorno</li><li>ripetere i trattamenti anche più volte al giorno</li><li>adattare la durata alle reali tempistiche di recupero</li><li>evitare l’acquisto di dispositivi costosi</li><li>ridurre gli spostamenti verso centri riabilitativi</li><li>contare su assistenza tecnica continua</li></ul>',
        '<p>Il percorso riabilitativo non è uguale per tutti: per questo il noleggio può essere prorogato secondo necessità, con il nostro supporto costante.</p>',
        '<h3><strong>Come funziona il noleggio</strong></h3>',
        '<p>Il processo di noleggio è semplice e trasparente.</p>',
        '<p>1. Prenotazione online o telefonica del servizio&nbsp;</p>',
        '<p>2. Conferma del noleggio</p>',
        '<p>3. Organizzazione della consegna e del montaggio a domicilio</p>',
        '<p>Tutti i costi sono&nbsp;<strong>IVA inclusa</strong>&nbsp;e non sono previsti costi aggiuntivi nascosti.</p>',
        '<h4><strong>Durata del noleggio e tariffe</strong></h4>',
        '<p>Periodo minimo di noleggio: 15 giorni</p>',
        '<ul><li>Noleggio 30 giorni : Prezzo al giorno, 9,00 €</li><li>Noleggio 20 giorni : Prezzo al giorno, 12,30 €</li><li>Noleggio 15 giorni : Prezzo al giorno, 12,00 €</li></ul>',
        '<p>I prezzi indicati sono promozioni valide esclusivamente per i noleggi effettuati tramite il sito web.</p>',
        '<h4><strong>Consegna, montaggio e ritiro</strong></h4>',
        '<ul><li>Consegna a Roma e Firenze trasporto a partire da 30 €</li><li>Consegna e Ritiro gratuiti in Magazzino</li><li>Consegna gratuita per i noleggi da 30 giorni</li><li>Nessun deposito cauzionale richiesto</li></ul>',
        '<p>Il costo del trasporto include:</p>',
        '<ul><li>consegna a domicilio</li><li>montaggio</li><li>spiegazione completa del funzionamento</li></ul>',
        '<p>La consegna viene effettuata&nbsp;<strong>entro 48 ore dalla chiamata</strong>, salvo diversa disponibilità.</p>',
        '<p>Con il noleggio vengono fornite:</p>',
        '<ul><li>istruzioni dettagliate per l’utilizzo</li><li>formazione pratica all’avvio</li><li>indicazioni personalizzate</li><li>assistenza tecnica durante tutto il periodo di noleggio</li></ul>',
        '<p>Il nostro obiettivo è permetterti di utilizzare i dispositivi&nbsp;<strong>nel modo più efficace, sicuro e confortevole possibile direttamente a casa</strong>.</p>',
        '<h4><strong>Perché scegliere Mia Medical Italia</strong></h4>',
        '<ul><li>dispositivi medicali professionali certificati</li><li>ausili sanificati e controllati</li><li>tecnici esperti e qualificati</li><li>consegna rapida</li><li>nessun deposito cauzionale</li><li>possibilità di proroga del noleggio</li><li>assistenza reale e continua</li></ul>',
        '<p>Con Mia Medical Italia il recupero non si interrompe ma prosegue a casa, con strumenti adeguati e con un supporto affidabile.</p>',
        '<p>Scopri la nostra pagina <a href="https://facebook.com/MIAMedicalitalia/">Facebook&nbsp;</a></p>',
      ].join(''),
    },
    en: {
      title: 'Kinetec CPM + wheelchair, combined hire',
      slug: 'noleggio-kinetec-carrozzina',
      shortDescription: 'Delivery in Rome and Florence. Delivery from €30. Free delivery on hires of 30 days or more! No deposit required. Delivery and collection at the warehouse are FREE!',
      metaTitle: 'Kinetec CPM + wheelchair combined hire - Mia Medical Italia',
      metaDescription: 'Combined hire of a wheelchair and a knee CPM machine — the right pairing for a quick recovery at home, delivered. Book now.',
      description: [
        '<h2><strong>Combined Kinetec + Wheelchair Rental</strong></h2>',
        '<p><strong>The complete solution for post-operative recovery and assisted mobility at home</strong></p>',
        '<p>During a delicate post-operative phase, especially following orthopaedic surgery on the knee or hip, it is essential to be able to rely on devices that allow&nbsp;<strong>progressive, safe and controlled recovery</strong>, minimising the physical exertion of the patient.</p>',
        '<p>The&nbsp;<strong>combined Kinetec + Wheelchair rental</strong>&nbsp;by Mia Medical Italia was created to meet this need: a package designed to accompany the patient through the different stages of the day, combining&nbsp;<strong>continuous passive mobilisation</strong>&nbsp;e&nbsp;<strong>daily mobility support</strong>.</p>',
        '<p>This combination makes it possible to continue rehabilitation directly at home, avoiding constant travel to healthcare facilities and ensuring therapeutic continuity.</p>',
        '<h3><strong>Who is combined rental suitable for?</strong></h3>',
        '<p>This combination is particularly suitable for patients who need to:</p>',
        '<ul><li>limit the load and physical effort</li><li>gradually recover joint mobility</li><li>moving safely during convalescence</li><li>prevent postoperative stiffness and complications</li></ul>',
        '<h4><strong>Main usage scenarios</strong></h4>',
        '<ul><li>knee surgery</li><li>hip operations</li><li>joint replacements</li><li>orthopaedic post-trauma</li><li>early rehabilitation phase</li><li>safe discharge from hospital</li></ul>',
        '<p>It is an ideal solution for patients who cannot yet walk independently but wish to maintain&nbsp;<strong>comfort, safety and a minimum of independence in daily travel</strong>.</p>',
        '<h3><strong>What is the combined Kinetec + Wheelchair rental</strong></h3>',
        '<p>The package includes two medical devices that are essential in the path of functional recovery.</p>',
        '<h4><strong><a href="/en/rental-catalog/">Kinetec : Continuous passive mobiliser (CPM)</a></strong></h4>',
        '<p>The Kinetec is a medical device designed for the&nbsp;<strong>passive joint mobilisation</strong>, particularly of the knee.</p>',
        '<p>The movement is performed automatically, without the patient having to actively contract the muscles.</p>',
        '<p><strong>Main functions</strong></p>',
        '<ul><li>controlled flexion and extension of the joint</li><li>progressive adjustment of the movement angle</li><li>continuous, slow and repetitive movement</li><li>use even in early post-operative phases</li></ul>',
        '<p><strong>Benefits</strong></p>',
        '<ul><li>prevention of joint stiffness</li><li>gradual recovery of range of motion</li><li>reduction of post-operative pain</li><li>reduction of oedema</li><li>improvement of local circulation</li></ul>',
        '<p>The Kinetec is often prescribed within the first few days after surgery, when active movement is not yet permitted.</p>',
        '<h4><strong><a href="/en/rental-catalog/">Wheelchair</a></strong></h4>',
        '<p>The wheelchair allows the patient to make short, daily movements in total safety, avoiding joint overload and fatigue.</p>',
        '<p>It is an essential tool for:</p>',
        '<ul><li>moving around inside the home</li><li>controlled exits</li><li>maintaining social connection</li></ul>',
        '<p>The model is chosen based on clinical needs, the patient\'s physical build and the home environment.</p>',
        '<p><strong>Types of wheelchairs available for hire</strong></p>',
        '<p>Mia Medical Italia offers the choice of several types of wheelchairs, to adapt to every clinical and home scenario.</p>',
        '<p>Available models:</p>',
        '<ul><li>self-propelled folding wheelchair</li><li>folding transit wheelchair</li><li>reclining wheelchair</li><li>bariatric wheelchair</li><li>folding paediatric wheelchair</li></ul>',
        '<p>The choice is made with the support of our team, so as to guarantee&nbsp;<strong>maximum safety, comfort and functionality</strong>.</p>',
        '<h3><strong>Why choose the combined Kinetec + wheelchair rental</strong></h3>',
        '<p>Combined rental allows</p>',
        '<ul><li>perform passive mobilisation every day</li><li>repeat the treatments even multiple times a day</li><li>adapt the duration to the actual recovery time</li><li>avoid buying expensive devices</li><li>reduce travel to rehabilitation centres</li><li>rely on continuous technical assistance</li></ul>',
        '<p>The rehabilitation journey is not the same for everyone: this is why the rental can be extended as needed, with our constant support.</p>',
        '<h3><strong>How rental works</strong></h3>',
        '<p>The rental process is simple and transparent.</p>',
        '<p>1. Online or telephone booking of the service&nbsp;</p>',
        '<p>2. Confirmation of hire</p>',
        '<p>3. Organisation of home delivery and assembly</p>',
        '<p>All costs are&nbsp;<strong>VAT included</strong>&nbsp;and there are no additional hidden costs.</p>',
        '<h4><strong>Rental duration and rates</strong></h4>',
        '<p>Minimum rental period: 15 days</p>',
        '<ul><li>30-day rental: Price per day, €9.00</li><li>20-day rental: Price per day, €12.30</li><li>15-day hire: Price per day, €12.00</li></ul>',
        '<p>The prices indicated are promotions valid exclusively for rentals made via the website.</p>',
        '<h4><strong>Delivery, assembly and collection</strong></h4>',
        '<ul><li>Delivery in Rome and Florence, transport starting from €30</li><li>Free delivery and pick-up in the warehouse</li><li>Free delivery for 30-day rentals</li><li>No security deposit required</li></ul>',
        '<p>The cost of transport includes:</p>',
        '<ul><li>home delivery</li><li>assembly</li><li>full explanation of operation</li></ul>',
        '<p>Delivery is made&nbsp;<strong>within 48 hours of the call</strong>, unless otherwise available.</p>',
        '<p>With the rental comes</p>',
        '<ul><li>detailed instructions for use</li><li>practical training on start-up</li><li>customised indications</li><li>technical assistance throughout the rental period</li></ul>',
        '<p>Our goal is to allow you to use the devices&nbsp;<strong>in the most effective, safe and comfortable way possible directly at home</strong>.</p>',
        '<h4><strong>Why choose Mia Medical Italia</strong></h4>',
        '<ul><li>certified professional medical devices</li><li>sanitised and controlled aids</li><li>experienced and qualified technicians</li><li>rapid delivery</li><li>no security deposit</li><li>possibility of extending the rental</li><li>real and continuous assistance</li></ul>',
        '<p>With Mia Medical Italia, recovery does not stop but continues at home, with appropriate tools and reliable support.</p>',
        '<p>Discover our page <a href="https://facebook.com/MIAMedicalitalia/">Facebook&nbsp;</a></p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: 'kinetec-and-wheelchair-1.jpg',
    gallery: [
      { file: 'kinetec-and-wheelchair-2.jpg', alt: { it: 'Affitto carrozzina pieghevole ad autospinta' } },
      'kinetec-and-wheelchair-3.jpg',
      'kinetec-and-wheelchair-4.jpg',
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
