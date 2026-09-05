/**
 * Magnetoterapia Magnum 2500
 *
 * /prodotto/magnetoterapia-cemp-magnum-2500/  ·  WooCommerce product 11660.
 *
 * Also sold outright, as `magnetotherapy-sale/magnum-2500`. Same accessory list
 * on both pages.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { magnetotherapyHire } from './category.ts';

export const magnum2500 = magnetotherapyHire.rental({
  code: 'magnum-2500',
  status: 'active',

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
      title: 'Magnetoterapia Magnum 2500',
      slug: 'magnetoterapia-cemp-magnum-2500',
      shortDescription: 'Noleggio Magnetoterapia CEMP MAGNUM 2500 Consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Consegna gratis se acquisti un noleggio per un minimo di 45 giorni. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio Magnetoterapia CEMP MAGNUM 2500',
      metaDescription: 'Noleggio Magnetoterapia Cemp Magnum 2500 da soli 2,00€ al giorno. Trasporto gratuito. Nessun Deposito. disponibilità immediata. Prenota online ora!',
      description: [
        '<p>Il <strong><a href="https://www.globuscorporation.com/it/prodotti-domiciliari/magnum-2500/">dispositivo MAGNUM 2500 </a></strong> è una magnetoterapia <strong>CEMP a bassa frequenza e alta intensità</strong>, progettata per un <strong>uso professionale</strong>, adatta anche al <strong>trattamento domiciliare</strong>. Grazie alla potenza fino a 250 Gauss per canale e alla presenza di due canali indipendenti, permette terapie efficaci su una o più aree del corpo contemporaneamente.</p>',
        '<p>La tecnologia dei <strong>Campi Elettromagnetici Pulsati (CEMP) </strong>stimola la <strong>rigenerazione cellulare, favorisce la guarigione ossea e riduce l’infiammazione</strong>, risultando particolarmente utile nel trattamento di <strong>fratture, artrosi, lombalgie, tendiniti e osteoporosi.</strong></p>',
        '<p>Il <strong>MAGNUM 2500 </strong>è dotato di 30 programmi preimpostati per le patologie più comuni e 20 programmi personalizzabili, che consentono una gestione terapeutica flessibile e mirata in base alle esigenze del paziente.</p>',
        '<h4>Noleggio Magnetoterapia MAGNUM 2500: caratteristiche principali dispositivo </h4>',
        '<ul><li>Magnetoterapia a bassa frequenza (CEMP)</li><li>Intensità regolabile fino a 250 Gauss per canale</li><li>2 canali indipendenti per trattamenti multipli</li><li>30 programmi preimpostati + 20 programmabili</li><li>Timer da 5 a 90 minuti</li><li>Ampio display retroilluminato</li><li>Alimentazione da rete elettrica</li><li>Accessori inclusi: solenoidi, fascia terapeutica, manuale d’uso</li></ul>',
        '<p>Il noleggio del dispositivo per magnetoterapia <strong>MAGNUM 2500</strong> è la scelta ideale per chi cerca un <strong>trattamento efficace contro dolori articolari, patologie ossee e infiammatorie, direttamente a casa propria</strong>.<br />Contattaci oggi stesso al +<strong>39 392 65 09 237</strong> e noleggia la tua magnetoterapia, consegna rapida!</p>',
        '<h4>Perchè scegliere il noleggio </h4>',
        '<p>Optare per il noleggio del dispositivo per magneto terapia <strong>MAGNUM 2500</strong> consente di accedere a un dispositivo professionale ad alta efficacia senza affrontare il costo dell’acquisto. Ideale per cicli terapeutici temporanei, consente di seguire le indicazioni mediche nel comfort di casa propria.</p>',
        '<p><strong>Vantaggi del noleggio:</strong></p>',
        '<ul><li>Costo contenuto</li><li>Nessun vincolo di acquisto</li><li>Consegna rapida a domicilio</li><li>Supporto tecnico dedicato</li><li>Possibilità di estendere o sospendere il servizio in base alle necessità</li></ul>',
        '<h4><p><strong>Perché scegliere il servizio Mia Medical Italia</strong></h4>',
        '<p>Scegliere Mia Medical Italia significa affidarsi a un’azienda specializzata nel noleggio di ausili e dispositivi elettromedicali, con esperienza, professionalità e attenzione al cliente. I nostri punti di forza:</p>',
        '<ul><li>Consulenza gratuita nella scelta del dispositivo più adatto</li><li>Assistenza telefonica continua durante il noleggio</li><li>Consegna e ritiro a domicilio in tutta Italia</li><li>Dispositivi sanificati e certificati CE</li><li>Staff competente e disponibile</li><li>Prezzi chiari e trasparenti</li></ul>',
        '<p>Visita il <strong>nostro sito</strong> per scoprire la vasta gamma di dispositivi elettromedicali, <strong><a href="/catalogo-noleggio/">magnetoterapia, elettroterapia, presso terapia, crioterapia e tanto altro.</a></strong></p>',
        '<p>Con Mia Medical Italia, la cura non è mai stata così semplice e sicura. Prenota il tuo dispositivo ora e inizia la tua terapia in sole 24/48 ore! Che aspetti, <strong><a href="https://wa.me/393926509237">contattaci</a></strong> ora al +<strong>39 392 65 09 237.</strong> Chiamaci per noleggiare oggi stesso il tuo dispositivo per la magneto terapia domiciliare. </p>',
      ].join(''),
    },
    en: {
      title: 'Magnum 2500 magnetotherapy, for hire',
      slug: 'magnetoterapia-cemp-magnum-2500',
      shortDescription: 'Hire Magnetotherapy CEMP MAGNUM 2500 Home delivery throughout Italy from 15€ + 15€ for collection. Free delivery if you purchase a rental for a minimum of 45 days. No deposit required!',
      metaTitle: 'CEMP Magnum 2500 magnetotherapy hire',
      metaDescription: 'CEMP Magnum 2500 magnetotherapy hire from just €2.00 a day. Free transport, no deposit, available immediately.',
      description: [
        '<p>The <strong><a href="https://www.globuscorporation.com/it/prodotti-domiciliari/magnum-2500/">MAGNUM 2500 device </a></strong> is magnetotherapy <strong>Low frequency and high intensity PEMF</strong>designed for a <strong>professional use</strong>, also suitable for <strong>home treatment</strong>. With power up to 250 Gauss per channel and two independent channels, it allows effective therapies on one or more areas of the body simultaneously.</p>',
        '<p>The technology of <strong>Pulsed Electromagnetic Fields (PEMF) </strong>stimulates <strong>cell regeneration, promotes bone healing and reduces inflammation</strong>particularly useful in the treatment of <strong>fractures, arthrosis, lumbago, tendinitis and osteoporosis.</strong></p>',
        '<p>The <strong>MAGNUM 2500 </strong>is equipped with 30 pre-set programmes for the most common diseases and 20 customisable programmes, allowing flexible and targeted therapy management according to the patient\'s needs.</p>',
        '<h4>Magnetotherapy MAGNUM 2500 rental: main features device </h4>',
        '<ul><li>Low-frequency magnetotherapy (PEMF)</li><li>Adjustable intensity up to 250 Gauss per channel</li><li>2 independent channels for multiple treatments</li><li>30 preset + 20 programmable programmes</li><li>Timer from 5 to 90 minutes</li><li>Large backlit display</li><li>Mains power supply</li><li>Accessories included: solenoids, therapy band, user manual</li></ul>',
        '<p>Renting the magnetotherapy device <strong>MAGNUM 2500</strong> is the ideal choice for those looking for a <strong>effective treatment of joint pain, bone and inflammatory diseases, directly at home</strong>.<br />Contact us today at +<strong>39 392 65 09 237</strong> and rent your magnetotherapy, fast delivery!</p>',
        '<h4>Why rent </h4>',
        '<p>Opting for Magneto-Therapy Device Rental <strong>MAGNUM 2500</strong> provides access to a highly effective professional device without the cost of purchase. Ideal for temporary therapeutic cycles, it allows you to follow medical instructions in the comfort of your own home.</p>',
        '<p><strong>Rental advantages:</strong></p>',
        '<ul><li>Low cost</li><li>No purchase obligation</li><li>Quick home delivery</li><li>Dedicated technical support</li><li>Possibility of extending or suspending the service as required</li></ul>',
        '<h4><p><strong>Why choose the Mia Medical Italia service</strong></h4>',
        '<p>Choosing Mia Medical Italia means relying on a company specialised in the rental of aids and electro-medical devices, with experience, professionalism and customer care. Our strengths:</p>',
        '<ul><li>Free advice on choosing the most suitable device</li><li>Continuous telephone support during rental</li><li>Home delivery and collection throughout Italy</li><li>Sanitised and CE-certified devices</li><li>Competent and helpful staff</li><li>Clear and transparent prices</li></ul>',
        '<p>Visit the <strong>our site</strong> to discover the wide range of electromedical devices, <strong><a href="/en/rental-catalog/">magnetotherapy, electrotherapy, pressure therapy, cryotherapy and more.</a></strong></p>',
        '<p>With Mia Medical Italia, treatment has never been easier and safer. Book your device now and start your treatment in just 24/48 hours! What are you waiting for, <strong><a href="https://wa.me/393926509237">contact us</a></strong> now at +<strong>39 392 65 09 237.</strong> Call us to rent your home magneto therapy device today. </p>',
      ].join(''),
    },
  },

  specs: {
    'included-accessories': { it: 'Solenoidi, fascia terapeutica, manuale d’uso', en: 'Solenoids, therapeutic band, instruction manual' },
  },

  media: {
    thumbnail: 'magnum-2500-1.jpg',
    gallery: [
      'magnum-2500-2.jpg',
      'magnum-2500-3.jpeg',
    ],
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
