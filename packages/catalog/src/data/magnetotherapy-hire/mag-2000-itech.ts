/**
 * Magnetoterapia CEMP MAG 2000 ITECH
 *
 * /prodotto/magnetoterapia-cemp-mag-2000/  ·  WooCommerce product 9611.
 *
 * `brand` is ITECH, which the product's own name states. Delivery 15 € out and
 * 15 € back anywhere in Italy, free from 45 days. No deposit.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { magnetotherapyHire } from './category.ts';

export const mag2000Itech = magnetotherapyHire.rental({
  code: 'mag-2000-itech',
  status: 'active',
  brand: 'ITECH',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(20, 100),
    days(30, 125),
    days(45, 160),
    days(60, 210),
  ],

  translations: {
    it: {
      title: 'Magnetoterapia CEMP MAG 2000 ITECH',
      slug: 'magnetoterapia-cemp-mag-2000',
      shortDescription: 'Noleggio magnetoterapia CEMP Consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Consegna gratis se acquisti un noleggio per un minimo di 45 giorni. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio Magnetoterapia CEMP MAG 2000 ITECH',
      metaDescription: 'Noleggio Magnetoterapia Cemp Professionale da soli 3,50€ al giorno. Nessun Deposito. disponibilità immediata. Prenota online ora !',
      description: [
        '<h4><a href="https://www.my-personaltrainer.it/salute/magnetoterapia.html">Trattamento Efficace per dolori articolari, infiammazioni e fratture</a></h4>',
        '<p><strong>Noleggio Magnetorerapia CEMP MAG 2000 ITECH: descrizione del macchinario</strong></p>',
        '<p>Il <strong>CEMP MAG 2000 I-TECH</strong> è un dispositivo professionale per <strong>magnetoterapia</strong> a <strong>bassa frequenza </strong>(<strong>CEMP – Campi Elettromagnetici Pulsati</strong>), progettato per l’utilizzo domiciliare. Dotato di programmi preimpostati per le principali patologie osteoarticolari e muscolari, consente trattamenti mirati, sicuri e personalizzabili.</p>',
        '<p>Grazie ai due canali indipendenti, è possibile trattare contemporaneamente aree diverse del corpo. L’<strong>interfaccia</strong><strong>semplice</strong> e intuitiva lo rende ideale anche per chi non ha esperienza con dispositivi medici.</p>',
        '<h4>Caratteristiche Principali:</h4>',
        '<ul><li>20 programmi preimpostati + 14 personalizzabili</li><li>Frequenze fino a 100 Hz</li><li>Intensità regolabile fino a 200 Gauss per canale</li><li>Timer da 5 a 90 minuti</li><li>Alimentazione da rete elettrica</li><li>Accessori inclusi: fascia elastica terapeutica, trasformatore, manuale d’uso</li></ul>',
        '<h4><p><strong>Perché scegliere il noleggio del MAG 2000 I-TECH</strong></h4>',
        '<p>Optare per il <strong>noleggio del MAG 2000</strong> consente di accedere a un <strong>dispositivo professionale ad alta efficacia</strong> senza affrontare il costo dell’acquisto. Ideale per <strong>cicli terapeutici temporanei</strong>, consente di seguire le <strong>indicazioni mediche nel comfort di casa propria</strong>. <br /><strong>Vantaggi del noleggio:</strong></p>',
        '<ul><li>Costo contenuto</li><li>Nessun vincolo di acquisto</li><li>Consegna rapida a domicilio</li><li>Supporto tecnico dedicato</li><li>Possibilità di estendere o sospendere il servizio in base alle necessità <p></li></ul>',
        '<h4><strong>Perché scegliere il servizio Mia Medical Italia</strong></h4>',
        '<p>Scegliere <strong>Mia Medical Italia</strong> significa affidarsi a un’azienda specializzata nel noleggio di ausili e dispositivi elettromedicali, con esperienza, professionalità e attenzione al cliente. I nostri punti di forza:</p>',
        '<ul><li>Consulenza gratuita nella scelta del dispositivo più adatto</li><li>Assistenza telefonica continua durante il noleggio</li><li>Consegna e ritiro a domicilio in tutta Italia</li><li>Dispositivi sanificati e certificati </li><li>Staff competente e disponibile</li><li>Prezzi chiari e trasparenti</li></ul>',
        '<p>Con Mia Medical Italia, la cura non è mai stata così semplice e sicura. Prenota il tuo dispositivo ora e inizia la tua terapia in sole 24/48 ore! <strong><a href="https://wa.me/393926509237">Contattaci ora al +39 392 65 09 237</a></strong>!</p>',
      ].join(''),
    },
    en: {
      title: 'ITECH MAG 2000 PEMF magnetotherapy, for hire',
      slug: 'magnetoterapia-cemp-mag-2000',
      shortDescription: 'PEMF magnetotherapy hire Home delivery throughout Italy from 15€ + 15€ for collection. Free delivery if you purchase a rental for a minimum of 45 days. No deposit required!',
      metaTitle: 'ITECH MAG 2000 PEMF magnetotherapy hire',
      metaDescription: 'Professional CEMP magnetotherapy hire from just €3.50 a day. No deposit, available immediately. Book online now.',
      description: [
        '<h4><a href="https://www.my-personaltrainer.it/salute/magnetoterapia.html">Effective treatment for joint pain, inflammation and fractures</a></h4>',
        '<p><strong>Rental Magnetorotherapy CEMP MAG 2000 ITECH: machine description</strong></p>',
        '<p>The <strong>CEMP MAG 2000 I-TECH</strong> is a professional device for <strong>magnetotherapy</strong> a <strong>low frequency </strong>(<strong>PEMF - Pulsed Electromagnetic Fields</strong>), designed for home use. Equipped with preset programmes for the main osteoarticular and muscular pathologies, it allows targeted, safe and customisable treatments.</p>',
        '<p>Thanks to the two independent channels, different areas of the body can be treated simultaneously. L\'<strong>interface</strong><strong>simple</strong> and intuitive makes it ideal even for those without experience with medical devices.</p>',
        '<h4>Main features:</h4>',
        '<ul><li>20 pre-set + 14 customisable programmes</li><li>Frequencies up to 100 Hz</li><li>Adjustable intensity up to 200 Gauss per channel</li><li>Timer from 5 to 90 minutes</li><li>Mains power supply</li><li>Accessories included: therapeutic elastic band, transformer, user manual</li></ul>',
        '<h4><p><strong>Why hire MAG 2000 I-TECH</strong></h4>',
        '<p>Opting for the <strong>MAG 2000 rental</strong> provides access to a <strong>highly effective professional device</strong> without incurring the cost of purchase. Ideal for <strong>temporary therapeutic cycles</strong>allows you to follow the <strong>medical indications in the comfort of your own home</strong>. <br /><strong>Rental advantages:</strong></p>',
        '<ul><li>Low cost</li><li>No purchase obligation</li><li>Quick home delivery</li><li>Dedicated technical support</li><li>Possibility of extending or suspending the service as required <p></li></ul>',
        '<h4><strong>Why choose the Mia Medical Italia service</strong></h4>',
        '<p>Choose <strong>Mia Medical Italia</strong> means relying on a company that specialises in the rental of medical aids and devices, with experience, professionalism and customer focus. Our strengths:</p>',
        '<ul><li>Free advice on choosing the most suitable device</li><li>Continuous telephone support during rental</li><li>Home delivery and collection throughout Italy</li><li>Sanitised and certified devices </li><li>Competent and helpful staff</li><li>Clear and transparent prices</li></ul>',
        '<p>With Mia Medical Italia, treatment has never been easier and safer. Book your device now and start your treatment in just 24/48 hours! <strong><a href="https://wa.me/393926509237">Contact us now on +39 392 65 09 237</a></strong>!</p>',
      ].join(''),
    },
  },

  specs: {
    'included-accessories': { it: 'Fascia elastica terapeutica, trasformatore, manuale d’uso', en: 'Therapeutic elastic band, transformer, instruction manual' },
  },

  media: {
    thumbnail: 'mag-2000-itech-1.jpg',
    gallery: [
      { file: 'mag-2000-itech-2.jpg', alt: { it: 'APPLICAZIONI MAGNETOTERAPIA' } },
      'mag-2000-itech-3.jpg',
      'mag-2000-itech-4.jpg',
    ],
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
