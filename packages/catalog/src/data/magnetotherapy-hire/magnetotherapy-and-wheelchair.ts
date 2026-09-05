/**
 * Noleggio Magnetoterapia + Carrozzina
 *
 * /prodotto/noleggio-e-affitto-della-magnetoterapia-e-della-carrozzina/
 * WooCommerce product 9461 — a CEMP unit paired with a wheelchair chosen for the
 * patient. The site lists it under both Magnetoterapia and Carrozzine; filed here
 * after its own title.
 *
 * `specs` is empty: which wheelchair goes out is decided per patient, and the
 * page states nothing measurable about either device. Its contraindications —
 * pacemaker, active tumours, pregnancy — are in the description, where the shop
 * put them.
 *
 * Delivery from 30 €, free from 45 days. No deposit.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { magnetotherapyHire } from './category.ts';

export const magnetotherapyAndWheelchair = magnetotherapyHire.rental({
  code: 'magnetotherapy-and-wheelchair',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(20, 100),
    days(30, 130),
    days(45, 170),
    days(60, 210),
  ],

  translations: {
    it: {
      title: 'Noleggio Magnetoterapia + Carrozzina',
      slug: 'noleggio-e-affitto-della-magnetoterapia-e-della-carrozzina',
      shortDescription: 'Carrozzina + Magnetoterapia Cemp BIO compatibile Consegna a Roma e Firenze a partire da 30€. Consegna gratuita per i noleggi da 45 giorni! Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Noleggio Magnetoterapia + Carrozzina - Mia Medical Italia',
      metaDescription: 'Noleggio combinato della carrozzina e della magnetoterapia Cemp. Combo perfetto per la riabilitazione a casa tua, prezzi bassi. Prenota online!',
      description: [
        '<p><strong>Supporto alla mobilità e terapia rigenerativa direttamente a domicilio</strong></p>',
        '<p>Il&nbsp;<strong>noleggio combinato carrozzina + magnetoterapia CEMP biocompatibile</strong>&nbsp;rappresenta una soluzione completa per pazienti che necessitano di&nbsp;<strong>supporto alla mobilità temporaneo o prolungato</strong>, associato a un&nbsp;<strong>trattamento terapeutico mirato alla riduzione del dolore e alla rigenerazione dei tessuti</strong>.</p>',
        '<p>Questa combinazione è particolarmente indicata durante percorsi di&nbsp;<strong>riabilitazione post-traumatica, post-operatoria o in presenza di patologie osteo-articolari</strong>, consentendo al paziente di mantenere autonomia, sicurezza e continuità terapeutica.</p>',
        '<h3><strong>A chi è indicato il noleggio combinato di Carrozzina + Magnetoterapia CEMP Biocompatibile</strong></h3>',
        '<p>Il pacchetto è indicato per:</p>',
        '<ul><li>pazienti con difficoltà temporanee o permanenti nella deambulazione</li><li>persone in fase di recupero post-operatorio</li><li>soggetti reduci da traumi o fratture</li><li>pazienti anziani con ridotta mobilità</li><li>situazioni di riabilitazione domiciliare</li><li>necessità di prevenzione dell’affaticamento articolare</li></ul>',
        '<p>L’obiettivo è&nbsp;<strong>facilitare gli spostamenti quotidiani</strong>&nbsp;e, allo stesso tempo,&nbsp;<strong>favorire il recupero clinico</strong>&nbsp;attraverso una terapia fisica mirata.</p>',
        '<h3><strong>In cosa consiste il noleggio combinato</strong> di MAGNETOTERAPIA e Carrozzina </h3>',
        '<p>Il pacchetto comprende:</p>',
        '<ul><li>carrozzina selezionata in base alle esigenze del paziente</li><li>dispositivo professionale per magnetoterapia CEMP biocompatibile</li><li>assistenza tecnica</li><li>consulenza per la scelta del modello più idoneo</li></ul>',
        '<h4><strong><a href="/catalogo-noleggio/">Carrozzina per mobilità assistita</a></strong></h4>',
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
        '<h4><strong><a href="/catalogo-noleggio/">Magnetoterapia CEMP biocompatibile</a></strong></h4>',
        '<p>La magnetoterapia CEMP (Campi ElettroMagnetici Pulsati) è una terapia fisica non invasiva che utilizza campi magnetici a bassa frequenza per stimolare i naturali processi biologici di recupero dell’organismo.</p>',
        '<p><strong>Meccanismo d’azione</strong></p>',
        '<p>Il campo magnetico pulsato agisce sui tessuti biologici favorendo:</p>',
        '<ul><li>riattivazione del metabolismo cellulare</li><li>miglioramento degli scambi ionici</li><li>incremento dell’ossigenazione tissutale</li><li>stimolazione dei processi di rigenerazione ossea</li></ul>',
        '<p>Questo consente una&nbsp;<strong>accelerazione dei tempi di recupero</strong>&nbsp;in presenza di patologie traumatiche o degenerative.</p>',
        '<p><strong>Benefici clinici della magnetoterapia</strong></p>',
        '<ul><li>riduzione dell’infiammazione</li><li>stimolazione della rigenerazione ossea</li><li>miglioramento del trofismo tissutale</li><li>riduzione del dolore</li><li>supporto alla riabilitazione</li></ul>',
        '<p>È particolarmente indicata in caso di:</p>',
        '<ul><li>fratture</li><li>ritardi di consolidamento osseo</li><li>artrosi</li><li>infiammazioni croniche</li><li>edemi</li><li>patologie muscolo-scheletriche</li></ul>',
        '<p><strong>Controindicazioni della magnetoterapia</strong></p>',
        '<p>La magnetoterapia è generalmente ben tollerata, tuttavia è controindicata in presenza di:</p>',
        '<ul><li>pacemaker o dispositivi elettronici impiantati</li><li>patologie tumorali attive</li><li>gravidanza (per precauzione)</li></ul>',
        '<p>È sempre necessario attenersi alle indicazioni del medico curante e alle istruzioni del dispositivo.</p>',
        '<h3><strong>Perché scegliere il noleggio combinato di Carrozzina e Magnetoterapia&nbsp;</strong></h3>',
        '<p>Il noleggio carrozzina + magnetoterapia CEMP consente di:</p>',
        '<ul><li>supportare la mobilità in sicurezza</li><li>ridurre dolore e infiammazione</li><li>favorire la rigenerazione dei tessuti</li><li>evitare l’acquisto di ausili costosi</li><li>adattare la durata del noleggio alle reali esigenze cliniche</li></ul>',
        '<p>È una soluzione completa per accompagnare il paziente durante tutto il percorso riabilitativo.</p>',
        '<h4><strong>Consegna, ritiro e condizioni</strong></h4>',
        '<ul><li>Consegna a Roma e Firenze a partire da 30 €</li><li>Consegna gratuita per noleggi da 45 giorni</li><li>Nessun deposito richiesto</li><li>Consegna e ritiro in magazzino gratuiti</li></ul>',
        '<p>La consegna viene effettuata entro 48 ore dalla chiamata, salvo disponibilità.</p>',
        '<p><strong>Assistenza e consulenza</strong></p>',
        '<p>Con il noleggio vengono fornite:</p>',
        '<ul><li>istruzioni complete all’utilizzo</li><li>supporto nella scelta della carrozzina</li><li>assistenza tecnica durante il periodo di noleggio</li></ul>',
        '<p>Il nostro personale specializzato accompagna il paziente in ogni fase, garantendo sicurezza, chiarezza e continuità terapeutica.</p>',
        '<h3><strong>Perché scegliere Mia Medical Italia</strong></h3>',
        '<ul><li>dispositivi professionali certificati</li><li>consulenza personalizzata</li><li>tecnici specializzati</li><li>noleggi flessibili</li><li>nessuna cauzione</li><li>assistenza continua</li></ul>',
        '<p>Mia Medical Italia è al fianco del paziente e della famiglia in ogni fase del percorso di cura domiciliare.</p>',
        '<p>Per informazioni, disponibilità e consulenza personalizzata è possibile contattare il numero <strong><a href="https://wa.me/393926509237">+39 392 6509237</a></strong> o scriverci su WhatsApp. Il nostro team è sempre disponibile per individuare la soluzione più adatta alle tue esigenze.</p>',
      ].join(''),
    },
    en: {
      title: 'Magnetotherapy + wheelchair, combined hire',
      slug: 'noleggio-e-affitto-della-magnetoterapia-e-della-carrozzina',
      shortDescription: 'Wheelchair + biocompatible CEMP magnetotherapy. Delivery in Rome and Florence from €30. Free delivery on hires of 45 days or more. No deposit required. Delivery and collection at the warehouse are FREE!',
      metaTitle: 'Magnetotherapy + wheelchair hire - Mia Medical Italia',
      metaDescription: 'Combined hire of a wheelchair and CEMP magnetotherapy. The right pairing for rehabilitation at home, at low prices.',
      description: [
        '<p><strong>Mobility support and regenerative therapy directly at home</strong></p>',
        '<p>The&nbsp;<strong>combined wheelchair + PEMF biocompatible magnetotherapy rental</strong>&nbsp;is a complete solution for patients requiring&nbsp;<strong>temporary or extended mobility support</strong>, associated with a&nbsp;<strong>therapeutic treatment aimed at pain reduction and tissue regeneration</strong>.</p>',
        '<p>This combination is particularly suitable during periods of&nbsp;<strong>post-traumatic, post-operative rehabilitation or in the presence of osteo-articular pathologies</strong>, allowing the patient to maintain autonomy, safety, and therapeutic continuity.</p>',
        '<h3><strong>The combined rental of a wheelchair and biocompatible PEMF Magnetotherapy is indicated for individuals who require assistance with mobility, such as those with physical disabilities, elderly individuals, or people recuperating from injuries or surgery. It is also suitable for individuals seeking therapeutic benefits from PEMF Magnetotherapy, such as pain relief, accelerated healing, or improved circulation.</strong></h3>',
        '<p>The package is indicated for:</p>',
        '<ul><li>patients with temporary or permanent walking difficulties</li><li>people in post-operative recovery</li><li>individuals recovering from trauma or fractures</li><li>elderly patients with reduced mobility</li><li>home rehabilitation situations</li><li>the need for prevention of joint fatigue</li></ul>',
        '<p>The objective is&nbsp;<strong>facilitating daily movements</strong>&nbsp;and at the same time,&nbsp;<strong>promote clinical recovery</strong>&nbsp;through targeted physical therapy.</p>',
        '<h3><strong>What combined hire consists of</strong> of MAGNETOTHERAPY and Wheelchair </h3>',
        '<p>The package includes:</p>',
        '<ul><li>wheelchair selected according to patient needs</li><li>professional PEMF biocompatible magnetotherapy device</li><li>technical assistance</li><li>Consultation for choosing the most suitable model</li></ul>',
        '<h4><strong><a href="/en/rental-catalog/">Mobility scooter</a></strong></h4>',
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
        '<h4><strong><a href="/en/rental-catalog/">Biocompatible PEMF magnetotherapy</a></strong></h4>',
        '<p>Pulsed Electromagnetic Field (PEMF) therapy is a non-invasive physical therapy that uses low-frequency magnetic fields to stimulate the body\'s natural recovery processes.</p>',
        '<p><strong>Mechanism of action</strong></p>',
        '<p>The pulsed magnetic field acts on biological tissues by promoting:</p>',
        '<ul><li>reactivation of cell metabolism</li><li>improvement of ion exchange</li><li>increase in tissue oxygenation</li><li>stimulation of bone regeneration processes</li></ul>',
        '<p>This allows a&nbsp;<strong>acceleration of recovery times</strong>&nbsp;in the presence of traumatic or degenerative pathologies.</p>',
        '<p><strong>Clinical benefits of magnetotherapy</strong></p>',
        '<ul><li>reduction of inflammation</li><li>stimulation of bone regeneration</li><li>improvement of tissue trophism</li><li>reduction of pain</li><li>rehabilitation support</li></ul>',
        '<p>It is particularly suitable for cases of:</p>',
        '<ul><li>fractures</li><li>delays in bone consolidation</li><li>arthrosis</li><li>chronic inflammations</li><li>oedemas</li><li>musculoskeletal pathologies</li></ul>',
        '<p><strong>Contraindications of magnetotherapy</strong></p>',
        '<p>Magnetotherapy is generally well tolerated; however, it is contraindicated in the presence of:</p>',
        '<ul><li>pacemakers or implanted electronic devices</li><li>active tumour pathologies</li><li>pregnancy (as a precaution)</li></ul>',
        '<p>It is always necessary to follow the indications of your doctor and the instructions for the device.</p>',
        '<h3><strong>Why choose the combined hire of a wheelchair and magnetotherapy equipment&nbsp;</strong></h3>',
        '<p>The CEMP wheelchair + magnetotherapy rental enables:</p>',
        '<ul><li>support safe mobility</li><li>reduce pain and inflammation</li><li>promote tissue regeneration</li><li>avoid buying expensive aids</li><li>adapt the duration of the hire to actual clinical needs</li></ul>',
        '<p>It is a complete solution to support the patient throughout the entire rehabilitation journey.</p>',
        '<h4><strong>Delivery, collection and conditions</strong></h4>',
        '<ul><li>Delivery in Rome and Florence from 30 €</li><li>Free delivery for rentals from 45 days</li><li>No deposit required</li><li>Free delivery and collection from warehouse</li></ul>',
        '<p>Delivery is made within 48 hours of the call, subject to availability.</p>',
        '<p><strong>Assistance and advice</strong></p>',
        '<p>With the rental comes</p>',
        '<ul><li>Full instructions for use</li><li>support in choosing a wheelchair</li><li>technical assistance during the rental period</li></ul>',
        '<p>Our specialised staff accompany the patient at every stage, ensuring safety, clarity, and therapeutic continuity.</p>',
        '<h3><strong>Why choose Mia Medical Italia</strong></h3>',
        '<ul><li>certified professional devices</li><li>personalised consultancy</li><li>specialised technicians</li><li>flexible hires</li><li>no bail</li><li>continuous assistance</li></ul>',
        '<p>Mia Medical Italia stands by the patient and their family at every stage of their home care journey.</p>',
        '<p>For information, availability, and personalised advice, please contact the number <strong><a href="https://wa.me/393926509237">+39 392 6509237</a></strong> Or write to us on WhatsApp. Our team is always available to find the solution that best suits your needs.</p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: { file: 'magnetotherapy-and-wheelchair-1.jpg', alt: { it: 'COMBO CARROZZINA + MAGNETOTERAPIA' } },
    gallery: [
      'magnetotherapy-and-wheelchair-2.jpg',
      { file: 'magnetotherapy-and-wheelchair-3.jpg', alt: { it: 'Affitto carrozzina pieghevole ad autospinta' } },
      'magnetotherapy-and-wheelchair-4.jpg',
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
