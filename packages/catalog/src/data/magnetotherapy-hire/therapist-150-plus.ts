/**
 * Noleggio Magnetoterapia Therapist® 150 Plus
 *
 * /prodotto/magnetoterapia-therapist-150-plus/  ·  WooCommerce product 14712.
 *
 * The most expensive magnetotherapy hire in the category, and also sold outright
 * as `magnetotherapy-sale/therapist-150-plus`.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { magnetotherapyHire } from './category.ts';

export const therapist150Plus = magnetotherapyHire.rental({
  code: 'therapist-150-plus',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(20, 120),
    days(30, 150),
    days(45, 225),
    days(60, 290),
  ],

  translations: {
    it: {
      title: 'Noleggio Magnetoterapia Therapist® 150 Plus',
      slug: 'magnetoterapia-therapist-150-plus',
      shortDescription: 'Noleggio Magnetoterapia THERAPIST 150 Plus Consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Consegna gratis se acquisti un noleggio per un minimo di 45 giorni. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio Magnetoterapia THERAPIST 150 PLUS',
      metaDescription: 'Noleggio Magnetoterapia Therapist 150 plus da soli 2,90€ al giorno. Trasporto gratuito. Nessun Deposito. disponibilità immediata. Prenota online ora!',
      description: [
        '<p>Il dispositivo <strong>THERAPIST® 150 Plus</strong> è una magnetoterapia professionale compatta e portatile, progettata per un uso domiciliare e professionale. Grazie al solenoide brevettato integrato, consente di indirizzare il 100% del flusso magnetico verso la zona da trattare, garantendo terapie efficaci per dolori acuti e cronici, fratture, infiammazioni, artrosi e osteoporosi.</p>',
        '<p>La tecnologia dei Campi Elettromagnetici Pulsati (CEMP) stimola la rigenerazione cellulare, accelera la guarigione ossea e riduce l’infiammazione, risultando particolarmente utile in caso di traumi muscolari, tendiniti, periartriti, lombalgie e sindrome del tunnel carpale. THERAPIST® 150 Plus è silenzioso, non vibra ed è completamente privo di fili, per un utilizzo semplice anche sopra vestiti o gessi.</p>',
        '<p>Grazie alla batteria di lunga durata e alle dimensioni tascabili (9 cm x 13,5 cm), può essere portato ovunque, garantendo una terapia continua e comoda. L’app dedicata permette di monitorare in tempo reale la durata del trattamento, il programma in uso e lo stato della batteria, fornendo indicazioni precise su quale frequenza magnetoterapeutica sia più adatta al tipo di dolore.</p>',
        '<h3><strong>Noleggio Magnetoterapia THERAPIST® 150 Plus: caratteristiche principali dispositivo</strong></h3>',
        '<ul><li>Magnetoterapia professionale compatta e portatile</li><li>Solenoide brevettato integrato, flusso magnetico diretto al 100%</li><li>Nessun filo, utilizzo anche sopra vestiti o gessi</li><li>Batteria a lunga durata, dimensioni tascabili (9 x 13,5 cm)</li><li>App dedicata per controllo in tempo reale della terapia</li><li>Segnalatore acustico di fine trattamento</li><li>Ideale per dolori acuti e cronici, fratture, artrosi e osteoporosi</li><li>Accessori inclusi: fascia elastica, manuale d’uso</li></ul>',
        '<p>Il noleggio del dispositivo <strong>THERAPIST® 150 Plus</strong> è la soluzione perfetta per chi desidera un trattamento efficace e professionale direttamente a casa propria, senza affrontare il costo dell’acquisto.</p>',
        '<h3><strong>Perché scegliere il noleggio</strong></h3>',
        '<p>Optare per il noleggio del dispositivo <strong>THERAPIST® 150 Plus</strong> consente di accedere a una tecnologia professionale e brevettata senza impegno d’acquisto. Ideale per cicli terapeutici temporanei, permette di seguire le indicazioni mediche comodamente a domicilio.</p>',
        '<h3><strong>Vantaggi del noleggio:</strong></h3>',
        '<ul><li>Costo contenuto</li><li>Nessun vincolo di acquisto</li><li>Consegna rapida a domicilio</li><li>Supporto tecnico dedicato</li><li>Possibilità di estendere o sospendere il servizio secondo necessità</li></ul>',
        '<h3><strong>Perché scegliere Mia Medical Italia</strong></h3>',
        '<p>Affidarsi a Mia Medical Italia significa scegliere professionalità, esperienza e attenzione al cliente. I nostri punti di forza:</p>',
        '<ul><li>Consulenza gratuita nella scelta del dispositivo più adatto</li><li>Assistenza telefonica continua durante il noleggio</li><li>Consegna e ritiro a domicilio in tutta Italia</li><li>Dispositivi sanificati e certificati CE</li><li>Staff competente e disponibile</li><li>Prezzi chiari e trasparenti</li></ul>',
        '<p>Visita il nostro sito per scoprire l’intera gamma di dispositivi <a href="/catalogo-noleggio/">elettromedicali, magnetoterapia, elettroterapia, pressoterapia, crioterapia e molto altro.</a></p>',
        '<p>Con <strong>Mia Medical Italia</strong>, la cura è semplice e sicura. Prenota ora il tuo <strong>THERAPIST® 150 Plus</strong> e inizia la tua terapia in sole 24/48 ore! Contattaci subito al <strong>+39 392 65 09 237</strong> per noleggiare il tuo dispositivo di magnetoterapia domiciliare.</p>',
      ].join(''),
    },
    en: {
      title: 'Therapist® 150 Plus magnetotherapy, for hire',
      slug: 'magnetoterapia-therapist-150-plus',
      shortDescription: 'Hire Magnetotherapy THERAPIST 150 Plus Home delivery throughout Italy from 15€ + 15€ for collection. Free delivery if you purchase a rental for a minimum of 45 days. No deposit required!',
      metaTitle: 'THERAPIST 150 PLUS magnetotherapy hire',
      metaDescription: 'Therapist 150 Plus magnetotherapy hire from just €2.90 a day. Free transport, no deposit, available immediately.',
      description: [
        '<p>The device <strong>THERAPIST® 150 Plus</strong> is a compact and portable professional magnetotherapy device designed for home and professional use. Thanks to the integrated patented solenoid, it directs the 100% magnetic flux to the area to be treated, providing effective therapies for acute and chronic pain, fractures, inflammation, arthrosis and osteoporosis.</p>',
        '<p>Pulsed Electromagnetic Fields (PEMF) technology stimulates cell regeneration, accelerates bone healing and reduces inflammation, making it particularly useful in cases of muscle trauma, tendonitis, periarthritis, lower back pain and carpal tunnel syndrome. THERAPIST® 150 Plus is silent, does not vibrate and is completely wireless, making it easy to use even over clothes or casts.</p>',
        '<p>Thanks to its long-lasting battery and pocket size (9 cm x 13.5 cm), it can be taken anywhere, ensuring continuous and comfortable therapy. The dedicated app makes it possible to monitor the duration of treatment, the programme in use and the battery status in real time, providing precise indications as to which magnetotherapeutic frequency is most suitable for the type of pain.</p>',
        '<h3><strong>Hire Magnetotherapy THERAPIST® 150 Plus: main device features</strong></h3>',
        '<ul><li>Compact and portable professional magnetotherapy</li><li>Patented integrated solenoid, direct magnetic flux to 100%</li><li>No threads, use even over clothes or casts</li><li>Long-life battery, pocket size (9 x 13.5 cm)</li><li>Dedicated app for real-time therapy control</li><li>End-of-treatment buzzer</li><li>Ideal for acute and chronic pain, fractures, arthrosis and osteoporosis</li><li>Accessories included: elastic band, user manual</li></ul>',
        '<p>The rental of the device <strong>THERAPIST® 150 Plus</strong> is the perfect solution for those who want an effective and professional treatment directly at home, without the cost of purchasing it.</p>',
        '<h3><strong>Why hire</strong></h3>',
        '<p>Opting for device rental <strong>THERAPIST® 150 Plus</strong> provides access to professional, patented technology with no purchase obligation. Ideal for temporary therapeutic cycles, it allows you to follow medical instructions from the comfort of your own home.</p>',
        '<h3><strong>Rental advantages:</strong></h3>',
        '<ul><li>Low cost</li><li>No purchase obligation</li><li>Quick home delivery</li><li>Dedicated technical support</li><li>Possibility to extend or suspend the service as required</li></ul>',
        '<h3><strong>Why choose Mia Medical Italia</strong></h3>',
        '<p>Relying on Mia Medical Italia means choosing professionalism, experience and customer care. Our strengths:</p>',
        '<ul><li>Free advice on choosing the most suitable device</li><li>Continuous telephone support during rental</li><li>Home delivery and collection throughout Italy</li><li>Sanitised and CE-certified devices</li><li>Competent and helpful staff</li><li>Clear and transparent prices</li></ul>',
        '<p>Visit our website to discover the full range of devices <a href="/en/rental-catalog/">electrotherapy, magnetotherapy, electrotherapy, pressure therapy, cryotherapy and more.</a></p>',
        '<p>With <strong>Mia Medical Italia</strong>, treatment is simple and safe. Book your <strong>THERAPIST® 150 Plus</strong> and start your therapy in just 24/48 hours! Contact us now at <strong>+39 392 65 09 237</strong> to rent your home magnetotherapy device.</p>',
      ].join(''),
    },
  },

  specs: {
    'included-accessories': { it: 'Fascia elastica, manuale d’uso', en: 'Elastic band, instruction manual' },
  },

  media: {
    thumbnail: 'therapist-150-plus-1.png',
    gallery: [
      'therapist-150-plus-2.png',
      'therapist-150-plus-3.png',
    ],
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
