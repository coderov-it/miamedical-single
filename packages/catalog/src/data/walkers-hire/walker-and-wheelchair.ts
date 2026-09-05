/**
 * Deambulatore + Carrozzina
 *
 * /prodotto/deambulatore-carrozzina/  ·  WooCommerce product 9450.
 *
 * A combined hire: one walking frame and one wheelchair, both chosen for the
 * patient by the shop's own team. The site lists it under BOTH Carrozzine and
 * Deambulatori; it is filed here because the walker is the first device its title
 * names — see docs/catalog/source/placement.json.
 *
 * `specs` is empty and stays empty. The page names five walker models and five
 * wheelchair models it might supply and commits to none, so there is no seat
 * width, no weight and no load limit to record — the honest answer for a package
 * whose contents are decided per patient.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { walkersHire } from './category.ts';

export const walkerAndWheelchair = walkersHire.rental({
  code: 'walker-and-wheelchair',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 55),
    days(15, 64),
    days(30, 90),
    days(45, 120),
    days(60, 145),
    days(90, 180),
  ],

  translations: {
    it: {
      title: 'Deambulatore + Carrozzina',
      slug: 'deambulatore-carrozzina',
      shortDescription: 'Consegna e Ritiro in magazzino sono Gratuiti Consegna a domicilio a partire da 30€. Prenota online o contattaci tramite WhatsApp.',
      metaTitle: 'noleggio-affito-Deambulatore + Carrozzina - Mia Medical Italia',
      metaDescription: 'noleggio e affitto combinato della carrozzine e del deambulatore comodamente a casa tua. Combo ideale per la fisioterapia a casa. Chiama ora! 3926509237',
      description: [
        '<h3><strong>Noleggio combinato di deambulatore e carrozzina per supporto completo alla mobilità nelle diverse fasi della riabilitazione</strong></h3>',
        '<p>Il&nbsp;<strong>noleggio combinato di deambulatore e carrozzina</strong>&nbsp;è una soluzione pensata sia per accompagnare il paziente durante le&nbsp;<strong>diverse fasi del recupero motorio</strong>, offrendo un&nbsp;<strong>supporto attivo alla deambulazione</strong>, sia un&nbsp;<strong>ausilio sicuro per gli spostamenti quando la fatica o la limitazione funzionale aumentano</strong>.</p>',
        '<p>Questo pacchetto è ideale nei percorsi di&nbsp;<strong>riabilitazione post-operatoria, post-traumatica o geriatrica</strong>, dove le capacità motorie possono variare nel tempo e richiedere ausili differenti a seconda del momento della giornata o dello stato fisico del paziente.</p>',
        '<h3><strong>A chi è indicato il noleggio combinato di deambulatore e carrozzina&nbsp;</strong></h3>',
        '<p>Il pacchetto è indicato per:</p>',
        '<ul><li>pazienti in fase di recupero dopo interventi chirurgici</li><li>persone con ridotta stabilità o forza muscolare</li><li>soggetti che alternano cammino assistito e necessità di seduta</li><li>pazienti anziani in riabilitazione funzionale</li><li>situazioni di mobilità temporaneamente compromessa</li><li>percorsi di recupero progressivo dell’autonomia</li></ul>',
        '<p>L’obiettivo è garantire&nbsp;<strong>continuità, sicurezza e flessibilità</strong>, evitando sforzi eccessivi e riducendo il rischio di cadute.</p>',
        '<h4><strong>In cosa consiste il noleggio combinato</strong></h4>',
        '<p>Il pacchetto comprende:</p>',
        '<ul><li>deambulatore selezionato in base alle esigenze cliniche</li><li>carrozzina scelta tra i modelli disponibili</li><li>consulenza tecnica personalizzata</li><li>assistenza durante tutto il periodo di noleggio</li></ul>',
        '<p>La combinazione consente di utilizzare&nbsp;<strong>l’ausilio più adatto in ogni momento</strong>, adattandosi all’andamento della riabilitazione.</p>',
        '<h4><strong>1</strong><a href="/catalogo-noleggio/"><strong>. </strong>Deambulatore<strong>per supporto alla deambulazione&nbsp;</strong></a></h4>',
        '<p>Ausilio destinato alla&nbsp;<strong>mobilizzazione assistita</strong>.</p>',
        '<p>Viene selezionato in base a:</p>',
        '<ul><li>peso del paziente</li><li>grado di equilibrio</li><li>livello di autonomia residua</li><li>ambiente domestico (spazi, corridoi, soglie)</li></ul>',
        '<p>Il deambulatore permette:</p>',
        '<ul><li>recupero graduale della deambulazione</li><li>riduzione del rischio di cadute</li><li>maggiore sicurezza durante gli spostamenti brevi</li><li>supporto alla fisioterapia domiciliare</li></ul>',
        '<h4><strong>Benefici del deambulatore</strong></h4>',
        '<ul><li>aumento della stabilità</li><li>riduzione del rischio di cadute</li><li>supporto durante il recupero dell’autonomia</li><li>miglioramento della sicurezza negli spostamenti</li><li>stimolo alla mobilità attiva</li></ul>',
        '<p>Modelli disponibili:</p>',
        '<ul><li>Deambulatore con tavoletta per appoggio brachiale&nbsp;&nbsp;</li><li>Deambulatore in alluminio pieghevole</li><li>Deambulatore con sotto ascellare&nbsp;</li><li>Deambulatore rollator in alluminio&nbsp;</li><li>Deambulatore rollator con seduta&nbsp;</li></ul>',
        '<h4>2. <strong><a href="/catalogo-noleggio/">Carrozzina per mobilità assistita</a></strong></h4>',
        '<p>La carrozzina consente al paziente di effettuare&nbsp;<strong>spostamenti brevi e quotidiani in totale sicurezza</strong>, evitando sovraccarichi articolari, cadute e affaticamento.</p>',
        '<p>È uno strumento fondamentale per mantenere:</p>',
        '<ul><li>autonomia negli spostamenti interni</li><li>possibilità di uscire in sicurezza</li><li>continuità delle relazioni sociali</li><li>qualità della vita durante la riabilitazione</li></ul>',
        '<p>Il modello viene selezionato tenendo conto di:</p>',
        '<ul><li>quadro clinico</li><li>corporatura del paziente</li><li>livello di autonomia</li><li>ambiente domestico</li><li>necessità di assistenza</li></ul>',
        '<h4><strong>Tipologie di carrozzine disponibili a noleggio</strong></h4>',
        '<p>Mia Medical Italia mette a disposizione diverse tipologie di carrozzine per adattarsi a ogni scenario clinico e abitativo.</p>',
        '<p>Modelli disponibili:</p>',
        '<ul><li>carrozzina ad autospinta pieghevole</li><li>carrozzina da transito pieghevole</li><li>carrozzina reclinabile</li><li>carrozzina bariatrica</li><li>carrozzina pediatrica pieghevole</li></ul>',
        '<p>La scelta avviene sempre con il supporto del nostro team, per garantire&nbsp;<strong>massima sicurezza, comfort ed ergonomia</strong>.</p>',
        '<h4><strong>Assistenza e consulenza</strong></h4>',
        '<p>Con il noleggio vengono fornite:</p>',
        '<ul><li>istruzioni complete all’utilizzo</li><li>supporto nella scelta della carrozzina</li><li>assistenza tecnica durante il periodo di noleggio</li></ul>',
        '<p>Il nostro personale specializzato accompagna il paziente in ogni fase, garantendo sicurezza, chiarezza e continuità terapeutica.</p>',
        '<h3><strong>Perché scegliere Mia Medical Italia</strong></h3>',
        '<ul><li>dispositivi professionali certificati</li><li>consulenza personalizzata</li><li>tecnici specializzati</li><li>noleggi flessibili</li><li>assistenza continua</li></ul>',
        '<p>Mia Medical Italia è al fianco del paziente e della famiglia in ogni fase del percorso di cura domiciliare.</p>',
        '<p>Per informazioni, disponibilità e consulenza personalizzata è possibile contattare il numero <strong><a href="https://wa.me/393926509237">+39 392 6509237</a></strong> o scriverci su WhatsApp. Il nostro team è sempre disponibile per individuare la soluzione più adatta alle tue esigenze.</p>',
        '<p>Scopri la nostra pagine&nbsp;<a href="https://facebook.com/MIAMedicalitalia/">Facebook&nbsp;</a></p>',
      ].join(''),
    },
    en: {
      title: 'Walking frame + wheelchair, combined hire',
      slug: 'deambulatore-carrozzina',
      shortDescription: 'Delivery and collection at the warehouse are free. Home delivery from €30. Book online or contact us on WhatsApp.',
      metaTitle: 'Walking frame + wheelchair combined hire - Mia Medical Italia',
      metaDescription: 'Combined hire of a wheelchair and a walking frame, delivered to your home. The right pairing for physiotherapy at home. Call +39 392 650 9237',
      description: [
        '<h3><strong>Combined walker and wheelchair rental for complete mobility support throughout the various stages of rehabilitation</strong></h3>',
        '<p>The&nbsp;<strong>combined walker and wheelchair hire</strong>&nbsp;it is a solution designed both to accompany the patient during the&nbsp;<strong>different stages of motor recovery</strong>, offering a&nbsp;<strong>active walking support</strong>, is a&nbsp;<strong>safe travel aid when fatigue or functional limitation increases</strong>.</p>',
        '<p>This package is ideal for use on&nbsp;<strong>post-operative, post-traumatic or geriatric rehabilitation</strong>, where motor skills can vary over time and require different aids depending on the time of day or the patient\'s physical state.</p>',
        '<h3><strong>Who is the combined rental of a walker and wheelchair suitable for?&nbsp;</strong></h3>',
        '<p>The package is indicated for:</p>',
        '<ul><li>patients recovering after surgery</li><li>people with reduced stability or muscle strength</li><li>individuals who alternate between assisted walking and the need to sit</li><li>elderly patients in functional rehabilitation</li><li>situations of temporarily compromised mobility</li><li>progressive autonomy recovery pathways</li></ul>',
        '<p>The objective is to ensure&nbsp;<strong>continuity, security and flexibility</strong>, avoiding excessive strain and reducing the risk of falls.</p>',
        '<h4><strong>What combined hire consists of</strong></h4>',
        '<p>The package includes:</p>',
        '<ul><li>walker selected according to clinical needs</li><li>wheelchair chosen from available models</li><li>personalised technical advice</li><li>assistance throughout the rental period</li></ul>',
        '<p>The combination allows the use of&nbsp;<strong>the most suitable aid at all times</strong>, adapting to the progress of the rehabilitation.</p>',
        '<h4><strong>1</strong><a href="/en/rental-catalog/"><strong>. </strong>Walker<strong>for walking support&nbsp;</strong></a></h4>',
        '<p>Ausilio destined for the&nbsp;<strong>assisted mobilisation</strong>.</p>',
        '<p>It is selected according to:</p>',
        '<ul><li>patient weight</li><li>degree of balance</li><li>level of remaining autonomy</li><li>domestic environment (spaces, corridors, thresholds)</li></ul>',
        '<p>The walker allows:</p>',
        '<ul><li>gradual recovery of walking</li><li>reducing the risk of falls</li><li>increased safety during short journeys</li><li>home physiotherapy support</li></ul>',
        '<h4><strong>Benefits of the walker</strong></h4>',
        '<ul><li>increase in stability</li><li>reducing the risk of falls</li><li>support during the recovery of independence</li><li>improving safety on the move</li><li>incentive for active mobility</li></ul>',
        '<p>Available models:</p>',
        '<ul><li>Walker with brachial support board&nbsp;&nbsp;</li><li>Folding aluminium walker</li><li>Underarm walker&nbsp;</li><li>Aluminium rollator walker&nbsp;</li><li>Rollator walker with seat&nbsp;</li></ul>',
        '<h4>2. <strong><a href="/en/rental-catalog/">Mobility scooter</a></strong></h4>',
        '<p>The wheelchair allows the patient to&nbsp;<strong>short, daily journeys in total safety</strong>, avoiding joint overloads, falls and fatigue.</p>',
        '<p>It is a fundamental tool for maintaining:</p>',
        '<ul><li>autonomy in internal travel</li><li>possibility of going out safely</li><li>Continuity of social relationships</li><li>Quality of life during rehabilitation</li></ul>',
        '<p>The model is selected taking into account</p>',
        '<ul><li>clinical picture</li><li>patient\'s build</li><li>level of autonomy</li><li>domestic environment</li><li>Need assistance</li></ul>',
        '<h4><strong>Types of wheelchairs available for hire</strong></h4>',
        '<p>Mia Medical Italia provides different types of wheelchairs to suit every clinical and living scenario.</p>',
        '<p>Available models:</p>',
        '<ul><li>self-propelled folding wheelchair</li><li>folding transit wheelchair</li><li>reclining wheelchair</li><li>bariatric wheelchair</li><li>folding paediatric wheelchair</li></ul>',
        '<p>The choice is always made with the support of our team, to ensure&nbsp;<strong>maximum safety, comfort and ergonomics</strong>.</p>',
        '<h4><strong>Assistance and advice</strong></h4>',
        '<p>With the rental comes</p>',
        '<ul><li>Full instructions for use</li><li>support in choosing a wheelchair</li><li>technical assistance during the rental period</li></ul>',
        '<p>Our specialised staff accompany the patient at every stage, ensuring safety, clarity, and therapeutic continuity.</p>',
        '<h3><strong>Why choose Mia Medical Italia</strong></h3>',
        '<ul><li>certified professional devices</li><li>personalised consultancy</li><li>specialised technicians</li><li>flexible hires</li><li>continuous assistance</li></ul>',
        '<p>Mia Medical Italia stands by the patient and their family at every stage of their home care journey.</p>',
        '<p>For information, availability, and personalised advice, please contact the number <strong><a href="https://wa.me/393926509237">+39 392 6509237</a></strong> Or write to us on WhatsApp. Our team is always available to find the solution that best suits your needs.</p>',
        '<p>Discover our pages&nbsp;<a href="https://facebook.com/MIAMedicalitalia/">Facebook&nbsp;</a></p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: 'walker-and-wheelchair-1.jpg',
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
