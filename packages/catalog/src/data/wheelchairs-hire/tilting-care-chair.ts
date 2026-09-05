/**
 * Noleggio seggiolone polifunzionale basculante
 *
 * /prodotto/noleggio-seggiolone-polifunzionale-basculante/
 * WooCommerce product 9040, four variations.
 *
 * A "seggiolone polifunzionale basculante" is a tilt-in-space care chair. The
 * site's own English calls it a "high chair", which in English is a baby's seat —
 * so the English here is corrected throughout rather than copied.
 *
 * ⚠️ This product takes a 300 € security deposit ("Deposito richiesto: 300€").
 * The schema has no per-product deposit amount, only a category-wide
 * `requiresDeposit` boolean, and the other nine products in this category take
 * nothing — so the deposit survives only in the copy below. See
 * docs/catalog/README.md.
 *
 * Measurements: the page publishes none, and none are invented. What it does
 * state is that the chair does NOT fold, which is the fact a customer needs.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const tiltingCareChair = wheelchairsHire.rental({
  code: 'tilting-care-chair',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 70),
    days(15, 110),
    days(30, 180),
    days(45, 250),
  ],

  translations: {
    it: {
      title: 'Noleggio seggiolone polifunzionale basculante',
      slug: 'noleggio-seggiolone-polifunzionale-basculante',
      shortDescription: 'Seggiolone polifunzionale Affitto e noleggio del seggiolone polifunzionale a Roma e provincia e Firenze e provincia. Consegna a partire da 40€. Il ritiro in magazzino è gratuito. Guarda anche la versione elettrica: seggiolone polifunzionale basculante elettrico Deposito richiesto: 300€ Per il noleggio di questo articolo è richiesto un deposito di 300€.',
      metaTitle: 'Noleggio seggiolone polifunzionale per disabili | Roma e Firenze',
      metaDescription: 'Noleggio seggiolone polifunzionale basculante per disabili a Roma e Firenze. Noleggio rapido. Prenota online con disponibilità immediata.',
      description: [
        '<h2>Seggiolone polifunzionale basculante per disabili: comfort e sicurezza</h2>',
        '<p>Il <strong>noleggio seggiolone polifunzionale basculante per disabili</strong> è la soluzione ideale per garantire comfort, sicurezza e un corretto posizionamento posturale durante tutta la giornata. Questo ausilio è pensato per persone con difficoltà motorie o posturali che necessitano di una seduta stabile, regolabile e confortevole, sia in ambito domiciliare sia assistenziale.</p>',
        '<p>Pratico e affidabile, il seggiolone polifunzionale in affitto consente di migliorare la qualità della vita del paziente e di facilitare il lavoro di chi presta assistenza.</p>',
        '<h2>Sistema basculante e schienale reclinabile</h2>',
        '<p>Il <strong>seggiolone polifunzionale basculante per disabili</strong> è dotato di schienale reclinabile e di un facile sistema basculante che permette di inclinare l’intera seduta fino alla posizione sdraiata. Questa funzione aiuta a ridurre i punti di pressione, favorendo il rilassamento e il benessere del paziente anche in caso di utilizzo prolungato.</p>',
        '<p>Il sistema basculante consente un posizionamento corretto e continuo, adattandosi alle esigenze specifiche della persona assistita in ogni momento della giornata.</p>',
        '<h2>Regolazioni complete e cuscini antidecubito</h2>',
        '<p>Il seggiolone polifunzionale è <strong>completamente regolabile</strong>, smontabile e dotato di <strong>cuscini antidecubito</strong>, progettati per offrire il massimo comfort e prevenire problematiche posturali. Ogni elemento è studiato per garantire stabilità, sostegno e adattabilità alle diverse necessità del paziente.</p>',
        '<p>Grazie alla sua struttura solida e modulare, il <strong>noleggio seggiolone polifunzionale basculante per disabili</strong> rappresenta una soluzione professionale e sicura.</p>',
        '<h2>Non solo una seduta: una soluzione posturale polifunzionale</h2>',
        '<p>Questo ausilio non è soltanto un sistema di seduta, ma una vera e propria soluzione polifunzionale. Il seggiolone svolge anche la funzione di <strong>seggiolone assistito</strong> e di <strong>sedia posturale ergonomica</strong>, adattandosi a molteplici contesti di utilizzo e necessità cliniche.</p>',
        '<p><strong>Attenzione:</strong> il seggiolone polifunzionale <strong>non è pieghevole</strong>.</p>',
        '<h2>Noleggio seggiolone polifunzionale a Roma e Firenze</h2>',
        '<p>Offriamo <strong>affitto e noleggio del seggiolone polifunzionale basculante per disabili a Roma e provincia e Firenze e provincia</strong>, con possibilità di consegna a domicilio o ritiro gratuito in magazzino.</p>',
        '<p>Prenota online subito il <strong>noleggio seggiolone polifunzionale basculante per disabili</strong> e assicurati un ausilio professionale, confortevole e immediatamente disponibile.</p>',
      ].join(''),
    },
    en: {
      title: 'Multifunctional tilt-in-space care chair for hire',
      slug: 'noleggio-seggiolone-polifunzionale-basculante',
      shortDescription: 'Multifunctional care chair. Rental and hire in Rome and its province and Florence and its province. Delivery starting from €40. Collection from the warehouse is free of charge. See also the electric version. Deposit required: €300 — a deposit of €300 is required to hire this item.',
      metaTitle: 'Multifunctional care chair hire | Rome and Florence',
      metaDescription: 'Hire a multifunctional tilt-in-space care chair in Rome and Florence. Quick hire, book online, available immediately.',
      description: [
        '<h2>multifunctional tilt-in-space care chair for the disabled: comfort and safety</h2>',
        '<p>The <strong>rental of multifunctional tilt-in-space care chair for the disabled</strong> it is the ideal solution to guarantee comfort, safety and correct postural alignment throughout the day. This aid is designed for people with motor or postural difficulties who require a stable, adjustable and comfortable seat, both at home and in care environments.</p>',
        '<p>Practical and reliable, the multifunctional care chair for hire helps to improve the patient\'s quality of life and makes the work of caregivers easier.</p>',
        '<h2>Tilting system and reclining backrest</h2>',
        '<p>The <strong>multifunctional tilt-in-space care chair for the disabled</strong> it features a reclining backrest and an easy tilt-in-space system that allows the entire seat to be tilted into a lie-down position. This function helps to reduce pressure points, promoting relaxation and patient well-being even during prolonged use.</p>',
        '<p>The tilting system allows correct and continuous positioning, adapting to the specific needs of the assisted person at all times of the day.</p>',
        '<h2>Full adjustments and anti-decubitus cushions</h2>',
        '<p>The multifunctional care chair is <strong>fully adjustable</strong>, detachable and equipped with <strong>anti-decubitus cushions</strong>, designed to offer maximum comfort and prevent postural problems. Every element is designed to guarantee stability, support and adaptability to the patient\'s various needs.</p>',
        '<p>Thanks to its solid and modular structure, the <strong>rental of multifunctional tilt-in-space care chair for the disabled</strong> is a professional and safe solution.</p>',
        '<h2>Not just a seat: a multifunctional postural solution</h2>',
        '<p>This aid is not only a seating system, but a truly multifunctional solution. The care chair also performs the function of <strong>assisted care chair</strong> and of <strong>ergonomic postural chair</strong>, adapting to multiple contexts of use and clinical needs.</p>',
        '<p><strong>Attention:</strong> the multifunctional care chair <strong>It\'s not foldable</strong>.</p>',
        '<h2>multifunctional care chair hire in Rome and Florence</h2>',
        '<p>We offer <strong>rental and hire of multifunctional tilt-in-space care chair for the disabled in Rome and province and Florence and province</strong>, with the option of home delivery or free warehouse collection.</p>',
        '<p>Book online now the <strong>rental of multifunctional tilt-in-space care chair for the disabled</strong> and ensure a professional, comfortable and immediately available aid.</p>',
      ].join(''),
    },
  },

  specs: {
    'age-group': 'adult',
    foldable: false,
    'reclining-backrest': true,
    'tilt-in-space': true,
    'adjustment-drive': 'manual',
    dismountable: true,
    'pressure-relief-cushions': true,
  },

  media: {
    thumbnail: 'tilting-care-chair-1.jpg',
    gallery: [
      'tilting-care-chair-2.jpg',
    ],
  },

  addons: [homeDelivery(40)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
