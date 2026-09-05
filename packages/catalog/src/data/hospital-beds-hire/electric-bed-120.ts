/**
 * Noleggio Letto Ospedaliero Elettrico 120cm con Materasso Antidecubito
 *
 * /prodotto/noleggio-letto-ospedaliero-elettrico-120cm-per-disabili-e-anziani-a-domicilio/
 * WooCommerce product 8849 — the 120 cm bed, three motors and six movements.
 * Delivery from 75 €, assembly included.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { hospitalBedsHire } from './category.ts';

export const electricBed120 = hospitalBedsHire.rental({
  code: 'electric-bed-120',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 155),
    days(30, 195),
    days(45, 270),
    days(60, 330),
    days(90, 435),
  ],

  translations: {
    it: {
      title: 'Noleggio Letto Ospedaliero Elettrico 120cm ( 1 piazza e mezzo) con Materasso Antidecubito',
      slug: 'noleggio-letto-ospedaliero-elettrico-120cm-per-disabili-e-anziani-a-domicilio',
      shortDescription: 'Noleggio Letto Ospedaliero Elettrico 120cm con materasso antidecubito Prenotazione facile, costi chiari, ausili di ultima generazione. Nessun deposito! Consegna a domicilio incluso di montaggio a partire da 75€ soltanto nel Lazio e Toscana. Lo stesso prezzo vale anche per il ritiro! Il costo sarà maggiorato in caso di consegna al piano senza ascensore. Per motivi igienici, è obbligatorio acquistare la copertura del materasso a 120€.',
      metaTitle: 'Noleggio Letto Ospedaliero 120cm + Materasso Antidecubito | Roma e Firenze',
      metaDescription: 'Noleggio letto ortopedico ospedaliero elettrico da 120cm a Roma e Firenze per anziani e disabili con antidecubito, sponde. I migliori prezzi del web.',
      description: [
        '<p><strong>Noleggia un letto ospedaliero ortopedico per degenza a casa con materasso antidecubito a Roma e Firenze per garantire comfort e sicurezza a chi ne ha bisogno. Scegli l’alternativa da 120 cm (1 piazza e mezzo) per ottenere un supporto ergonomico ancora più avanzato. Consegna rapida e assistenza professionale.</strong></p>',
        '<h4><a href="/come-scegliere-un-letto-ospedaliero/">Cosa è un letto ortopedico e quale scegliere</a></h4>',
        '<p>Un&nbsp;<strong>letto ortopedico elettrico ospedaliero</strong>&nbsp;è un dispositivo medico progettato per la degenza a casa e migliorare il comfort e la sicurezza delle persone con&nbsp;<strong>mobilità ridotta</strong>&nbsp;o in&nbsp;<strong>fase di riabilitazione</strong>. È dotato di&nbsp;<strong>movimenti elettrici regolabili</strong>&nbsp;che facilitano la gestione del paziente e migliorano la qualità della vita sia per il paziente che per i caregiver. Quando si ha bisogno di&nbsp;<strong>maggiore libertà di movimento</strong>&nbsp;e comfort, un&nbsp;<strong>letto ospedaliero elettrico da 120 cm</strong>&nbsp;è la soluzione ideale. Rispetto al <a href="/prodotto/noleggio-letto-ospedaliero-elettrico-incluso-di-materasso-antidecubito/">modello standard da 90 cm</a>, questa versione&nbsp;<strong>offre più spazio</strong>.</p>',
        '<p>Inoltre, <strong>incluso nel prezzo di noleggio su Roma e Firenze,</strong> il letto sarà dotato di materasso antidecubito per prevenire le piaghe da pressione e migliorare la qualità del riposo. Scopri di più sui nostri materassi.</p>',
        '<h4>A chi è consigliato il noleggio di un letto ospedaliero elettrico</h4>',
        '<p>Il nostro servizio di&nbsp;<strong>noleggio letti ortopedici ospedalieri</strong>&nbsp;è pensato per chiunque abbia difficoltà motorie o necessiti di un supporto medico adeguato a casa. È particolarmente utile per:</p>',
        '<ul><li><strong>Anziani con problemi di mobilità</strong></li><li><strong>Persone in fase post-operatoria o riabilitativa</strong></li><li><strong>Pazienti con patologie croniche che obbligano a una lunga degenza</strong> a casa</li><li><strong>Disabili o individui con ridotta autonomia</strong>&nbsp;</li></ul>',
        '<p>Grazie alla&nbsp;<strong>consegna veloce e all’installazione a domicilio</strong>, potrai avere un letto ospedaliero da 120cm professionale senza doverti preoccupare della logistica.</p>',
        '<h4><a href="/noleggio-letti-ortopedici-ospedalieri-in-provincia-di-firenze/?_gl=1*1mcjupk*_up*MQ..*_ga*MzI1MDg1MTM0LjE3Mzk2MTAzNjc.*_ga_D9FZ9V3LL7*MTczOTYxODQ3My4zLjEuMTczOTYxODYzMS4wLjAuMA..">Funzionamento</a> e caratteristiche principali </h4>',
        '<p>Il servizio di noleggio del&nbsp;<strong>letto ospedaliero 120</strong>cm <strong>a una piazza e mezza</strong><span>, disponibile sia a Roma che Firenze, è progettato per&nbsp;</span><strong>garantire sicurezza e comfort</strong><span>, grazie a una serie di regolazioni elettriche intuitive manovrabili da remoto:</span></p>',
        '<ul><li><strong>Altezza regolabile</strong>&nbsp;per facilitare l’accesso e la gestione del paziente</li><li><strong>Inclinazione della testiera e della pediera</strong>&nbsp;per adattare la posizione alle esigenze del momento</li><li><strong>Sponde laterali di sicurezza</strong>&nbsp;rimovibili</li><li><strong>Ruote con freno</strong>&nbsp;per un facile spostamento e stabilità</li></ul>',
        '<p>Tutto è&nbsp;<strong>controllabile con un telecomando</strong>&nbsp;semplice da usare, che permette al paziente o ai caregiver di&nbsp;<strong>modificare la posizione con un solo tocco</strong>.</p>',
        '<h4><a href="/come-scegliere-il-materasso-antidecubito/">Il materasso antidecubito: un supporto essenziale </a></h4>',
        '<p>Incluso nel noleggio del letto ortopedico c’è un&nbsp;<strong>materasso antidecubito</strong>, studiato per:</p>',
        '<ul><li><strong>Prevenire le lesioni da pressione</strong>&nbsp;nelle persone allettate a lungo termine</li><li><strong>Garantire una distribuzione ottimale del peso</strong>&nbsp;per ridurre il rischio di piaghe o alleviare il dolore in caso di presenza</li><li><strong>Favorire il comfort e il benessere del paziente</strong></li></ul>',
        '<p>Se già soffri di lesioni da pressione, o sei il caregiver di una persona non autosufficiente e hai bisogno di un aiuto, il nostro <strong>infermiere</strong> di fiducia <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> è specializzato proprio nella cura delle lesioni cutanee e nel campo dell’assistenza domiciliare. <strong>Non esitare a contattarlo! </strong></p>',
        '<p><strong>Caratteristiche del letto ospedaliero elettrico 1 Piazza e mezza&nbsp; (120CM) a Roma e Firenze</strong></p>',
        '<ul><li>regolazione elettrica completa.</li><li>Superficie netta: 195×115 cm;</li><li>Lunghezza totale: 212 cm;</li><li>Larghezza totale: 135 cm.</li><li>Peso max. paziente: 150 Kg.;</li><li>Carico max. di sicuro utilizzo: 180Kg.</li><li>Regolazione in altezza con telecomando: minima: 30 cm. – massima: 80 cm.</li></ul>',
        '<p><strong>Tutti i nostri letti elettrici&nbsp; sono igienizzati e sanificati prima della consegna. Il materasso in dotazione preventivo antidecubito ha una copertura sanitaria integrale</strong>.</p>',
        '<h4>I Benefici del Noleggio di un Letto Ortopedico Elettrico con Materasso Antidecubito &#8211; Roma e Firenze</h4>',
        '<ul><li><strong>Migliora la qualità del riposo</strong> grazie alla regolazione personalizzata</li><li><strong>Facilita l’assistenza </strong>riducendo lo sforzo di chi si prende cura del paziente </li><li><strong>Previene</strong> la comparsa di piaghe da decubito grazie al materasso incluso</li><li><strong>Aumenta la sicurezza</strong> con sponde laterali e blocco ruote</li></ul>',
        '<h4>Perchè scegliere il nostro servizio per il noleggio su Roma e Firenze di un letto ospedaliero da 120cm?</h4>',
        '<ul><li><strong>Letto ortopedico elettrico regolabile della migliore qualità sul mercato a prezz</strong>i <strong>super convenient</strong>i per un comfort senza paragoni</li><li><strong>Incluso materasso antidecubito</strong>&nbsp;per prevenire le piaghe da decubito</li><li><strong>Noleggio flessibile</strong>&nbsp;con opzioni personalizzate</li><li><strong>Assistenza e consegna rapida</strong>&nbsp;a domicilio in Lazio e Toscana</li><li>Il letto permette ai clienti di trascorrere una serena <strong>degenza a casa</strong>, non solo in struttura </li></ul>',
        '<p>Chiamaci al numero +<strong>39 06 5309 6674</strong> o <a href="https://wa.me/393926509237">contattaci su whatsapp</a> per noleggiare il tuo letto ospedaliero ortopedico oggi stesso. </p>',
        '<p><strong>Scegli Mia Medical Italia!</strong></p>',
      ].join(''),
    },
    en: {
      title: 'Electric hospital bed, 120 cm, with pressure-relief mattress, for hire',
      slug: 'noleggio-letto-ospedaliero-elettrico-120cm-per-disabili-e-anziani-a-domicilio',
      shortDescription: '120 cm Electric Hospital Bed Rental with Anti-Decubitus Mattress Easy booking, clear costs, state-of-the-art aids. No deposit! Home delivery installation included from only €75 in Lazio and Tuscany alone. The same price also applies for collection! The cost will be increased in the case of delivery to a floor without a lift. For hygiene reasons, it mandatory purchase of the mattress cover at €120.',
      metaTitle: '120 cm hospital bed + pressure-relief mattress | Rome and Florence',
      metaDescription: 'Hire a 120 cm electric orthopaedic hospital bed in Rome and Florence for older and disabled users, with pressure-relief mattress and side rails.',
      description: [
        '<p><strong>Hire an orthopedic hospital bed for home care with an anti-decubitus mattress in Rome and Florence to ensure comfort and safety for those who need it. Choose the 120 cm (double/large single) option for even more advanced ergonomic support. Fast delivery and professional assistance.</strong></p>',
        '<h4><a href="/en/come-scegliere-un-letto-ospedaliero/">What is an orthopaedic bed and which one to choose</a></h4>',
        '<p>A&nbsp;<strong>orthopaedic electric hospital bed</strong>&nbsp;it is a medical device designed for home care and to improve the comfort and safety of people with&nbsp;<strong>reduced mobility</strong>&nbsp;or in&nbsp;<strong>rehabilitation phase</strong>. It is equipped with&nbsp;<strong>adjustable electric movements</strong>&nbsp;that facilitate patient management and improve the quality of life for both patient and carers. When you need&nbsp;<strong>greater freedom of movement</strong>&nbsp;and comfort, a&nbsp;<strong>120 cm electric hospital bed</strong>&nbsp;is the ideal solution. Compared to the <a href="/en/product/noleggio-letto-ospedaliero-elettrico-incluso-di-materasso-antidecubito/">90 cm standard model</a>this version&nbsp;<strong>offers more space</strong>.</p>',
        '<p>In addition, <strong>included in the rental price in Rome and Florence,</strong> the bed will be equipped with an anti-decubitus mattress to prevent pressure sores and improve the quality of rest. Find out more about our mattresses.</p>',
        '<h4>To whom the hire of an electric hospital bed is recommended</h4>',
        '<p>Our service of&nbsp;<strong>rental of orthopaedic hospital beds</strong>&nbsp;is designed for anyone who has mobility difficulties or needs adequate medical support at home. It is particularly useful for:</p>',
        '<ul><li><strong>Elderly people with mobility problems</strong></li><li><strong>People in post-operative or rehabilitation phase</strong></li><li><strong>Patients with chronic diseases requiring long hospital stays</strong> at home</li><li><strong>Disabled or individuals with reduced autonomy</strong>&nbsp;</li></ul>',
        '<p>Thanks to the&nbsp;<strong>fast delivery and home installation</strong>you can have a professional 120 cm hospital bed without having to worry about logistics.</p>',
        '<h4><a href="/en/noleggio-letti-ortopedici-ospedalieri-in-provincia-di-firenze/?_gl=1*1mcjupk*_up*MQ..*_ga*MzI1MDg1MTM0LjE3Mzk2MTAzNjc.*_ga_D9FZ9V3LL7*MTczOTYxODQ3My4zLjEuMTczOTYxODYzMS4wLjAuMA..">Operation</a> and main features </h4>',
        '<p>The rental service of the&nbsp;<strong>hospital bed 120</strong>cm <strong>one-and-a-half</strong><span>, available in both Rome and Florence, is designed to&nbsp;</span><strong>ensuring safety and comfort</strong><span>with a series of intuitive electrical adjustments that can be operated remotely:</span></p>',
        '<ul><li><strong>Adjustable height</strong>&nbsp;to facilitate patient access and management</li><li><strong>Headboard and footboard inclination</strong>&nbsp;to adapt the position to the needs of the moment</li><li><strong>Safety side rails</strong>&nbsp;removable</li><li><strong>Wheels with brake</strong>&nbsp;for easy movement and stability</li></ul>',
        '<p>Everything is&nbsp;<strong>controllable by remote control</strong>&nbsp;easy to use, which allows the patient or caregiver to&nbsp;<strong>change position with a single touch</strong>.</p>',
        '<h4><a href="/en/come-scegliere-il-materasso-antidecubito/">The anti-decubitus mattress: an essential support </a></h4>',
        '<p>Included in the rental of the orthopaedic bed is a&nbsp;<strong>anti-decubitus mattress</strong>, designed for:</p>',
        '<ul><li><strong>Preventing pressure injuries</strong>&nbsp;in long-term bedridden persons</li><li><strong>Ensuring optimal weight distribution</strong>&nbsp;to reduce the risk of sores or alleviate pain in case of presence</li><li><strong>Promoting patient comfort and well-being</strong></li></ul>',
        '<p>If you already suffer from pressure injuries, or are the carer of a dependent person and need help, our <strong>nurse</strong> trustworthy <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> specialises precisely in the treatment of skin lesions and in home care. <strong>Do not hesitate to contact him! </strong></p>',
        '<p><strong>Features of electric hospital bed 1 and a half squares (120CM) in Rome and Florence</strong></p>',
        '<ul><li>full electric adjustment.</li><li>Net surface area: 195×115 cm;</li><li>Total length: 212 cm;</li><li>Total width: 135 cm.</li><li>Maximum patient weight: 150 kg;</li><li>Maximum safe load: 180 kg.</li><li>Height adjustment with remote control: minimum: 30 cm. - maximum: 80 cm.</li></ul>',
        '<p><strong>All our electric beds are sanitised and disinfected before delivery. The preventive anti-decubitus mattress has full sanitary coverage</strong>.</p>',
        '<h4>The Benefits of Renting an Electric Orthopaedic Bed with an Anti-Decubitus Mattress – Rome and Florence</h4>',
        '<ul><li><strong>Improves sleep quality</strong> thanks to customised adjustment</li><li><strong>Facilitates assistance </strong>reducing the carer\'s effort </li><li><strong>Prevents</strong> the occurrence of bed sores thanks to the included mattress</li><li><strong>Increasing security</strong> with side rails and wheel block</li></ul>',
        '<h4>Why choose our service for the rental of a 120 cm hospital bed in Rome and Florence?</h4>',
        '<ul><li><strong>Adjustable electric orthopaedic bed of the best quality on the market at prices</strong>i <strong>super convenient</strong>i for unrivalled comfort</li><li><strong>Including anti-decubitus mattress</strong>&nbsp;to prevent pressure sores</li><li><strong>Flexible rental</strong>&nbsp;with customised options</li><li><strong>Fast service and delivery</strong>&nbsp;at home in Lazio and Tuscany</li><li>The bed allows customers to enjoy a peaceful night\'s sleep. <strong>home care</strong>, not only in structure </li></ul>',
        '<p>Call us on +<strong>39 06 5309 6674</strong> o <a href="https://wa.me/393926509237">contact us on whatsapp</a> to rent your orthopaedic hospital bed today. </p>',
        '<p><strong>Choose Mia Medical Italia!</strong></p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 150,
    'safe-working-load': 180,
    'mattress-surface': { it: '195 × 115 cm', en: '195 × 115 cm' },
    'total-length': { min: 212, max: 212 },
    'total-width': { min: 135, max: 135 },
    'height-adjustment': { min: 30, max: 80 },
    articulation: { it: '3 motori, 6 movimenti', en: 'Three motors, six movements' },
    'side-rails': true,
    'includes-mattress': true,
  },

  media: {
    thumbnail: 'electric-bed-120-1.jpg',
    gallery: [
      'electric-bed-120-2.jpg',
    ],
  },

  addons: [homeDelivery(75)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
