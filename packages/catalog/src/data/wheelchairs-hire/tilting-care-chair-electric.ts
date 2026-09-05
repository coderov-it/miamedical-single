/**
 * Noleggio seggiolone elettrico polifunzionale
 *
 * /prodotto/noleggio-seggiolone-polifunzionale-basculante-elettrico/
 * WooCommerce product 12408. The same chair as `tilting-care-chair` with the
 * recline and the tilt driven by a handset instead of by hand — which is the
 * whole of the difference, and the reason a week is 90 € here and 70 € there.
 *
 * ⚠️ Also a 300 € deposit, and also unrepresentable — see `tilting-care-chair`.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const tiltingCareChairElectric = wheelchairsHire.rental({
  code: 'tilting-care-chair-electric',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 90),
    days(15, 130),
    days(30, 240),
    days(45, 315),
  ],

  translations: {
    it: {
      title: 'Noleggio seggiolone elettrico polifunzionale',
      slug: 'noleggio-seggiolone-polifunzionale-basculante-elettrico',
      shortDescription: 'Seggiolone polifunzionale Affitto e noleggio del seggiolone polifunzionale a Roma e provincia e Firenze e provincia. Consegna a partire da 35€. Il ritiro in magazzino è gratuito. Guarda anche la versione manuale: seggiolone polifunzionale basculante Deposito richiesto: 300€ Per il noleggio di questo articolo è richiesto un deposito di 300€.',
      metaTitle: 'Noleggio Seggiolone Polifunzionale basculante per disabili',
      metaDescription: 'Noleggio seggiolone polifunzionale basculante a Roma e Firenze. Con schienale reclinabile, telecomando e consegna rapida. Prenota online.',
      description: [
        '<h3>Noleggio seggiolone polifunzionale basculante per disabili</h3>',
        '<p>Il <strong>noleggio seggiolone polifunzionale basculante per disabili</strong> è una soluzione pensata per garantire comfort, sicurezza e una corretta postura nella vita quotidiana di persone con ridotta mobilità.</p>',
        '<p>Grazie alla sua struttura avanzata, questo dispositivo permette un posizionamento ergonomico e personalizzato in base alle diverse esigenze dell’utilizzatore.</p>',
        '<h2>Caratteristiche del noleggio seggiolone polifunzionale</h2>',
        '<p>Il seggiolone polifunzionale disponibile a noleggio è dotato di:</p>',
        '<h3>Schienale reclinabile e sistema basculante</h3>',
        '<p>Lo schienale è completamente reclinabile e il sistema basculante è elettrico e controllabile tramite telecomando, permettendo una regolazione semplice e immediata.</p>',
        '<h3>Struttura regolabile e smontabile</h3>',
        '<p>Il dispositivo è completamente regolabile, adattabile alle diverse esigenze posturali e facilmente smontabile per il trasporto.</p>',
        '<h3>Cuscini antidecubito inclusi</h3>',
        '<p>Sono inclusi cuscini antidecubito che aiutano a prevenire piaghe da pressione e migliorano il comfort durante l’utilizzo prolungato.</p>',
        '<h2>Funzione e benefici del seggiolone polifunzionale</h2>',
        '<p>Questo <strong>noleggio seggiolone polifunzionale basculante per disabili</strong> non è una semplice seduta, ma un vero e proprio sistema posturale elettrico.</p>',
        '<p>Permette di:</p>',
        '<ul><li>mantenere una postura corretta durante tutta la giornata</li><li>ridurre il rischio di dolori e complicazioni posturali</li><li>facilitare la gestione quotidiana del paziente</li><li>garantire maggiore autonomia e comfort</li></ul>',
        '<p>Grazie al telecomando, la seduta può essere inclinata fino alla posizione completamente sdraiata in modo sicuro e controllato.</p>',
        '<h2>Importante: informazioni tecniche</h2>',
        '<p>Il seggiolone polifunzionale elettrico <strong>non è pieghevole</strong>.</p>',
        '<p>Questa caratteristica va considerata per il trasporto e la sistemazione del dispositivo.</p>',
        '<h2><strong>Noleggio seggiolone polifunzionale basculante a Roma e Firenze</strong></h2>',
        '<p>Offriamo il<strong> seggiolone polifunzionale basculante per disabili a Roma e provincia e Firenze e provincia</strong>, con disponibilità immediata.</p>',
        '<p>Il servizio include:</p>',
        '<ul><li>consegna rapida</li><li>assistenza dedicata</li><li>possibilità di prenotazione online</li><li>soluzioni personalizzate in base alle esigenze del paziente</li></ul>',
        '<h2>Prenotazione</h2>',
        '<p>Prenota subito il tuo <strong>noleggio seggiolone polifunzionale basculante per disabili</strong>: <strong><a href="/prodotto/scooter-elettrico-pieghevole-s19/?_gl=1*1r9me3a*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1MzA0MS4yLjEuMTc0NDQ1MzA1Mi4wLjAuMA..">Prenotalo online</a></strong> o chiamaci al numero <strong><a href="https://wa.me/393926509237">+39 392 65 09 237</a></strong>: al resto ci pensiamo noi! </p>',
      ].join(''),
    },
    en: {
      title: 'Multifunctional electric care chair for hire',
      slug: 'noleggio-seggiolone-polifunzionale-basculante-elettrico',
      shortDescription: 'Multifunctional care chair. Rental and hire in Rome and its province and Florence and its province. Delivery from €35. Collection from the warehouse is free of charge. See also the manual version. Deposit required: €300 — a deposit of €300 is required to hire this item.',
      metaTitle: 'Multifunctional electric care chair hire',
      metaDescription: 'Hire a multifunctional electric tilt-in-space care chair: handset-driven recline and tilt, pressure-relief cushions included.',
      description: [
        '<h3>Hire of multifunctional tilt-in-space care chair for the disabled</h3>',
        '<p>The <strong>rental of multifunctional tilt-in-space care chair for the disabled</strong> It is a solution designed to ensure comfort, safety, and correct posture in the daily lives of people with reduced mobility.</p>',
        '<p>Thanks to its advanced structure, this device allows for ergonomic and personalised positioning based on the user\'s different needs.</p>',
        '<h2>Features of the multifunctional care chair hire service</h2>',
        '<p>The multifunctional care chair available for hire is equipped with:</p>',
        '<h3>Reclining backrest and tilt mechanism</h3>',
        '<p>The backrest is fully reclining and the tilt system is electric and controllable via remote, allowing for simple and immediate adjustment.</p>',
        '<h3>Adjustable and detachable frame</h3>',
        '<p>The device is fully adjustable, adaptable to different postural needs, and easily dismantled for transport.</p>',
        '<h3>Anti-bedsore cushions included</h3>',
        '<p>Anti-decubitus cushions are included, which help prevent pressure sores and improve comfort during prolonged use.</p>',
        '<h2>Functions and benefits of the multifunctional care chair</h2>',
        '<p>This <strong>rental of multifunctional tilt-in-space care chair for the disabled</strong> It\'s not just a simple seat, but a veritable electric postural system.</p>',
        '<p>It allows you to:</p>',
        '<ul><li>maintain good posture throughout the day</li><li>to reduce the risk of pain and postural complications</li><li>to make the day-to-day management of the patient easier</li><li>to ensure greater independence and comfort</li></ul>',
        '<p>Thanks to the remote control, the seat can be reclined to the fully flat position safely and in a controlled manner.</p>',
        '<h2>Important: technical information</h2>',
        '<p>The multi-purpose electric care chair <strong>It\'s not foldable</strong>.</p>',
        '<p>This feature should be taken into account when transporting and storing the device.</p>',
        '<h2><strong>Rental of multi-purpose reclining care chair in Rome and Florence</strong></h2>',
        '<p>We offer the<strong> multifunctional tilt-in-space care chair for people with disabilities in Rome and the surrounding area, and Florence and the surrounding area</strong>, with immediate availability.</p>',
        '<p>The service includes:</p>',
        '<ul><li>rapid delivery</li><li>dedicated support</li><li>Online booking availability</li><li>tailored solutions to meet the patient’s needs</li></ul>',
        '<h2>Booking</h2>',
        '<p>Book yours now <strong>rental of multifunctional tilt-in-space care chair for the disabled</strong>: <strong><a href="/en/product/scooter-elettrico-pieghevole-s19/">Book it online</a></strong> or call us on <strong><a href="https://wa.me/393926509237">+39 392 65 09 237</a></strong>: We’ll take care of the rest! </p>',
      ].join(''),
    },
  },

  specs: {
    'age-group': 'adult',
    foldable: false,
    'reclining-backrest': true,
    'tilt-in-space': true,
    'adjustment-drive': 'electric',
    dismountable: true,
    'pressure-relief-cushions': true,
  },

  media: {
    thumbnail: { file: 'tilting-care-chair-electric-1.png', alt: { it: 'Noleggio seggiolone polifunzionale basculante' } },
    gallery: [
      'tilting-care-chair-electric-2.jpg',
      'tilting-care-chair-electric-3.jpeg',
      'tilting-care-chair-electric-4.jpg',
    ],
  },

  addons: [homeDelivery(35)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
