/**
 * Noleggio e Affitto Letto Ospedaliero Elettrico con Antidecubito
 *
 * /prodotto/noleggio-letto-ospedaliero-elettrico-incluso-di-materasso-antidecubito/
 * WooCommerce product 8842 — the 90 cm bed. Its prose block is the source:
 *
 *   Superficie netta 195×95 cm    Lunghezza totale 212 cm
 *   Larghezza totale 105 cm       Peso max. paziente 130 Kg
 *   Carico max. di sicuro utilizzo 180 Kg
 *   Regolazione in altezza con telecomando: minima 30 cm – massima 80 cm
 *
 * The attribute table on the same product disagrees with the prose in two places
 * (210 cm long, 30–70 cm high, and a `Maximum capacity` listing eight values at
 * once). The prose is what the page actually shows a customer, so it wins; the
 * conflict is recorded in docs/catalog/README.md.
 *
 * Delivery is quoted "a partire da 60€" including assembly, Lazio and Tuscany
 * only, and the same again for collection.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { hospitalBedsHire } from './category.ts';

export const electricBed90 = hospitalBedsHire.rental({
  code: 'electric-bed-90',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 120),
    days(30, 150),
    days(45, 200),
    days(60, 250),
    days(90, 315),
  ],

  translations: {
    it: {
      title: 'Noleggio e Affitto Letto Ospedaliero Elettrico con Antidecubito | Roma e Firenze',
      slug: 'noleggio-letto-ospedaliero-elettrico-incluso-di-materasso-antidecubito',
      shortDescription: 'Noleggio letto ospedaliero elettrico 90cm + materasso antidecubito Prenotazione facile, costi chiari, ausili di ultima generazione. Nessun deposito! Consegna a domicilio incluso di montaggio a partire da 60€ soltanto nel Lazio e Toscana. Lo stesso prezzo vale anche per il ritiro! Il costo sarà maggiorato in caso di consegna al piano senza ascensore. Per motivi igienici, è obbligatorio acquistare la copertura del materasso a 80€.',
      metaTitle: 'Noleggio letto ortopedico + materasso antidecubito Roma e Firenze',
      metaDescription: 'Noleggio Roma e Firenze di letto elettrico ospedaliero per anziani incluso di materasso antidecubito. Chiamaci al +39 3926509237!',
      description: [
        '<h3>Noleggio Letto Ortopedico Elettrico 1 PIAZZA (90 cm) &#8211; Roma e Firenze </h3>',
        '<p><strong>Affitta il nostro letto ortopedico elettrico per la degenza a casa con sponde 90 cm (1 piazza). Disponibile sia a Roma che Firenze, riceverai anche un materasso antidecubito incluso nel prezzo di noleggio! Pensato per garantire il massimo del confort e della sicurezza a chi ne ha bisogno. Con Consegna rapida e assistenza professionale. </strong></p>',
        '<h4>Cosa è un Letto Ospedaliero Elettrico per la degenza a casa?</h4>',
        '<p>Un&nbsp;<strong>letto ortopedico elettrico ospedaliero</strong>&nbsp;è un dispositivo medico progettato per migliorare la degenza a casa, il comfort e la sicurezza delle persone con&nbsp;<strong>mobilità ridotta</strong>&nbsp;o in&nbsp;<strong>fase di riabilitazione</strong>. È dotato di&nbsp;<strong>movimenti elettrici regolabili</strong>&nbsp;che facilitano la gestione del paziente e migliorano la qualità della vita sia per il paziente che per i caregiver.</p>',
        '<h4>A chi può essere utile? </h4>',
        '<ul><li><strong>Anziani</strong>&nbsp;con difficoltà motorie</li><li><strong>Persone in convalescenza post-operatoria</strong></li><li><strong>Pazienti con disabilità o patologie croniche</strong></li><li><strong>Soggetti allettati a lungo termine</strong></li><li><strong>Familiari che vogliono garantire comfort e sicurezza a un caro</strong></li><li>Persone con necessità di <strong>degenza a casa</strong></li></ul>',
        '<h4>Come Funziona un Letto Ospedaliero Elettrico a Noleggio &#8211; Roma e Firenze </h4>',
        '<p>Il nostro letto ortopedico ospedaliero è&nbsp;<strong>completamente regolabile</strong>&nbsp;grazie a un&nbsp;<strong>telecomando facile da usare</strong>. In tal modo, sarà possibile, sia per il paziente che per chi se ne prende cura, di sfruttare tutte le funzionalità che il letto dispone.&nbsp;</p>',
        '<p>Le principali funzioni includono:</p>',
        '<ul><li><strong>Regolazione dell’altezza</strong>&nbsp;per facilitare l’accesso al letto.&nbsp;</li><li><strong>Inclinazione della testiera e della pediera</strong>&nbsp;per un comfort ottimale.</li><li><strong>Sponde laterali di sicurezza</strong>&nbsp;per prevenire cadute.</li><li><strong>Ruote con freno</strong>&nbsp;per una mobilità controllata.</li><li><strong>Maniglia</strong> alza-malato</li><li><strong>Materasso Antidecubito</strong> per prevenire la comparsa di <a href="https://www.humanitas.it/malattie/piaghe-da-decubito/">piaghe da decubito</a>, soprattutto per i soggetti più a rischio.&nbsp;</li></ul>',
        '<p><a href="/prodotto/noleggio-materasso-antidecubito-ad-alto-rischio/?_gl=1*etcak*_up*MQ..*_ga*MzI1MDg1MTM0LjE3Mzk2MTAzNjc.*_ga_D9FZ9V3LL7*MTczOTYxNDM2Mi4yLjAuMTczOTYxNDM2Mi4wLjAuMA..">Scopri di più sui nostri materassi antidecubito!</a></p>',
        '<h4>I Benefici del Noleggio di un Letto Ospedaliero Elettrico per anziani con Materasso Antidecubito</h4>',
        '<p><strong>Tutti i nostri letti elettrici&nbsp;sono igienizzati e sanificati prima della consegna. Il materasso in dotazione è&nbsp; preventivi antidecubito ed ha una copertura sanitaria integrale.</strong></p>',
        '<ul><li><strong>Migliora la qualità del riposo</strong>&nbsp;grazie alla regolazione personalizzata.</li><li><strong>Facilita l’assistenza</strong>&nbsp;riducendo lo sforzo di chi si prende cura del paziente.</li><li><strong>Previene le piaghe da decubito</strong>&nbsp;grazie al materasso antidecubito incluso.</li><li><strong>Aumenta la sicurezza</strong>&nbsp;con sponde laterali e blocco ruote.</li></ul>',
        '<p><strong>Caratteristiche del letto elettrico medicale con sponde 1 Piazza&nbsp; (90CM) </strong>&#8211; Roma e Firenze</p>',
        '<ul><li>regolazione elettrica completa.</li><li>Superficie netta: 195×95 cm;</li><li>Lunghezza totale: 212 cm;</li><li>Larghezza totale: 105 cm.</li><li>Peso max. paziente: 130 Kg.;</li><li>Carico max. di sicuro utilizzo: 180Kg.</li><li>Regolazione in altezza con telecomando: minima: 30 cm. – massima: 80 cm.</li></ul>',
        '<h4>Perché scegliere il nostro servizio di noleggio a Roma e Firenze ?</h4>',
        '<ul><li><strong>Letto ortopedico elettrico regolabile della migliore qualità sul mercato a prezz</strong>i super convenienti per un comfort senza paragoni</li><li><strong>Incluso materasso antidecubito</strong>&nbsp;per prevenire le piaghe da decubito</li><li><strong>Noleggio flessibile</strong>&nbsp;con opzioni personalizzate</li><li><strong>Assistenza e consegna rapida</strong>&nbsp;a domicilio</li></ul>',
        '<p>Se sei un caregiver di una persona non autosufficiente e hai bisogno di una mano, il nostro <strong>infermiere</strong> di fiducia <strong><a href="http://Www.arnaldiandrea.com">Andrea Arnaldi</a></strong> è specializzato nel campo <strong>dell’assistenza domiciliare</strong>, sempre pronto a garantire la continuità delle cure necessarie nel comfort della casa del paziente. <strong>Non esitare a contattarlo!</strong></p>',
        '<p>Prenota il <strong>tuo letto ortopedico elettrico per </strong>degenza a casa oggi stesso!</p>',
      ].join(''),
    },
    en: {
      title: 'Electric hospital bed with pressure-relief mattress, for hire | Rome and Florence',
      slug: 'noleggio-letto-ospedaliero-elettrico-incluso-di-materasso-antidecubito',
      shortDescription: 'Electric hospital bed rental 90 cm + anti-decubitus mattress Easy booking, clear costs, state-of-the-art aids. No deposit! Home delivery including assembly starting from just €60 in Lazio and Tuscany only. The same price applies for collection too! The cost will be increased in the case of delivery to a floor without a lift. For hygiene reasons, it compulsory to buy the mattress cover for €80.',
      metaTitle: 'Hospital bed + pressure-relief mattress hire | Rome and Florence',
      metaDescription: 'Hire an electric hospital bed for older users in Rome and Florence, with a pressure-relief mattress included. Call +39 392 650 9237',
      description: [
        '<h3>Electric Orthopaedic Bed Hire 1 BED (90 cm) - Rome and Florence </h3>',
        '<p><strong>Rent our electric orthopaedic bed for home care with 90 cm side rails (single bed). Available in both Rome and Florence, you will also receive an anti-decubitus mattress included in the rental price! Designed to ensure maximum comfort and safety for those who need it. With fast delivery and professional assistance. </strong></p>',
        '<h4>What is an electric hospital bed for home care?</h4>',
        '<p>A&nbsp;<strong>orthopaedic electric hospital bed</strong>&nbsp;it is a medical device designed to improve home care, comfort and safety for people with&nbsp;<strong>reduced mobility</strong>&nbsp;or in&nbsp;<strong>rehabilitation phase</strong>. It is equipped with&nbsp;<strong>adjustable electric movements</strong>&nbsp;that facilitate patient management and improve the quality of life for both patient and carers.</p>',
        '<h4>To whom can it be useful? </h4>',
        '<ul><li><strong>Seniors</strong>&nbsp;with motor difficulties</li><li><strong>People in post-operative convalescence</strong></li><li><strong>Patients with disabilities or chronic illnesses</strong></li><li><strong>Long-term bedridden subjects</strong></li><li><strong>Family members who want to provide comfort and security for a loved one</strong></li><li>People with a need for <strong>home care</strong></li></ul>',
        '<h4>How an Electric Hospital Bed for Hire Works - Rome and Florence </h4>',
        '<p>Our orthopaedic hospital bed is&nbsp;<strong>fully adjustable</strong>&nbsp;thanks to a&nbsp;<strong>easy-to-use remote control</strong>. In this way, it will be possible for both patient and carer to make use of all the functions that the bed has to offer.&nbsp;</p>',
        '<p>The main functions include:</p>',
        '<ul><li><strong>Height adjustment</strong>&nbsp;to facilitate access to the bed.&nbsp;</li><li><strong>Headboard and footboard inclination</strong>&nbsp;for optimal comfort.</li><li><strong>Safety side rails</strong>&nbsp;to prevent falls.</li><li><strong>Wheels with brake</strong>&nbsp;for controlled mobility.</li><li><strong>Handle</strong> sick lift</li><li><strong>Antidecubitus mattress</strong> to prevent the occurrence of <a href="https://www.humanitas.it/malattie/piaghe-da-decubito/">bedsores</a>especially for those most at risk.&nbsp;</li></ul>',
        '<p><a href="/en/product/noleggio-materasso-antidecubito-ad-alto-rischio/">Learn more about our anti-decubitus mattresses!</a></p>',
        '<h4>The Benefits of Renting an Electric Hospital Bed for the Elderly with an Anti-Decubitus Mattress</h4>',
        '<p><strong>All our electric beds are hygienised and sanitised before delivery. The supplied mattress is a preventive anti-decubitus one and has a full healthcare cover.</strong></p>',
        '<ul><li><strong>Improves sleep quality</strong>&nbsp;thanks to customised adjustment.</li><li><strong>Facilitates assistance</strong>&nbsp;reducing the effort of caregivers.</li><li><strong>Prevents pressure sores</strong>&nbsp;thanks to the included anti-decubitus mattress.</li><li><strong>Increasing security</strong>&nbsp;with side rails and wheel block.</li></ul>',
        '<p><strong>Features of the electric medical bed with side rails, single size (90 cm) </strong>- Rome and Florence</p>',
        '<ul><li>full electric adjustment.</li><li>Net surface area: 195×95 cm;</li><li>Total length: 212 cm;</li><li>Total width: 105 cm.</li><li>Maximum patient weight: 130 kg;</li><li>Maximum safe load: 180 kg.</li><li>Height adjustment with remote control: minimum: 30 cm. - maximum: 80 cm.</li></ul>',
        '<h4>Why choose our car rental service in Rome and Florence?</h4>',
        '<ul><li><strong>Adjustable electric orthopaedic bed of the best quality on the market at prices</strong>the super convenient for unparalleled comfort</li><li><strong>Including anti-decubitus mattress</strong>&nbsp;to prevent pressure sores</li><li><strong>Flexible rental</strong>&nbsp;with customised options</li><li><strong>Fast service and delivery</strong>&nbsp;at home</li></ul>',
        '<p>If you are a caregiver of a dependent person and need a hand, our <strong>nurse</strong> trustworthy <strong><a href="http://Www.arnaldiandrea.com">Andrea Arnaldi</a></strong> specialises in the field <strong>home care</strong>always ready to ensure continuity of care in the comfort of the patient\'s home. <strong>Do not hesitate to contact him!</strong></p>',
        '<p>Book the <strong>your electric orthopaedic bed for </strong>Stay at home today!</p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 130,
    'safe-working-load': 180,
    'mattress-surface': { it: '195 × 95 cm', en: '195 × 95 cm' },
    'total-length': { min: 212, max: 212 },
    'total-width': { min: 105, max: 105 },
    'height-adjustment': { min: 30, max: 80 },
    articulation: { it: 'Regolazione elettrica dello schienale da 0° a circa 75°, elevazione parte testa 80°', en: 'Electric backrest from 0° to about 75°, head section raising to 80°' },
    'includes-mattress': true,
  },

  media: {
    thumbnail: { file: 'electric-bed-90-1.jpg', alt: { it: 'letto a noleggio electrico' } },
    gallery: [
      'electric-bed-90-2.jpg',
      'electric-bed-90-3.jpg',
    ],
  },

  addons: [homeDelivery(60)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
