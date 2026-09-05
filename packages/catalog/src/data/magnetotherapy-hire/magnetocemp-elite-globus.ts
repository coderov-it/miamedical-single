/**
 * Noleggio Magnetocemp Elite Globus
 *
 * /prodotto/noleggio-magnetocemp-elite-globus/  ·  WooCommerce product 14198.
 *
 * `brand` is Globus, named in the product's own title.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { magnetotherapyHire } from './category.ts';

export const magnetocempEliteGlobus = magnetotherapyHire.rental({
  code: 'magnetocemp-elite-globus',
  status: 'active',
  brand: 'Globus',

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
      title: 'Noleggio Magnetocemp Elite Globus',
      slug: 'noleggio-magnetocemp-elite-globus',
      shortDescription: 'Noleggio Magnetoterapia magnetocemp Elite Globus Consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Consegna gratis se acquisti un noleggio per un minimo di 45 giorni. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio Magnetocemp Elite Globus',
      metaDescription: 'Noleggio Magnetocemp Elite Glubus a partire da 2,90 Euro al giorno. Consegna a domicilio. Apparecchi sicuri, affidabili e facili da usare.',
      description: [
        '<p>Il <strong>dispositivo professionale per magnetoterapia</strong> è un apparecchio CEMP a bassa frequenza e alta intensità, ideale per trattamenti mirati contro infiammazioni articolari, artrosi, edemi ossei e patologie del sistema muscolo-scheletrico. Grazie alla tecnologia dei <strong>Campi Elettromagnetici Pulsati</strong>, stimola la rigenerazione tissutale e favorisce una guarigione naturale, sicura e non invasiva.</p>',
        '<p>Progettato per un uso ambulatoriale e domiciliare, questo dispositivo è semplice da utilizzare ma altamente performante: permette trattamenti efficaci direttamente a casa, seguendo il piano terapeutico prescritto dal medico o fisioterapista.</p>',
        '<h3>Noleggio Magnetoterapia Professionale: caratteristiche del dispositivo</h3>',
        '<ul><li>Magnetoterapia CEMP a bassa frequenza</li><li>Alta intensità per trattamenti in profondità</li><li>Programmi preimpostati per artrosi, tendiniti, edemi, fratture</li><li>Timer regolabile per la durata della terapia</li><li>Display retroilluminato e comandi intuitivi</li><li>Alimentazione da rete elettrica</li><li>Accessori inclusi: fascia terapeutica, solenoidi, manuale</li><li>Facile da usare, anche senza esperienza medica</li></ul>',
        '<p>Il noleggio di questo dispositivo rappresenta una soluzione pratica ed economica per affrontare cicli terapeutici da 30 a 60 giorni, con la comodità del trattamento a casa.</p>',
        '<p>Contattaci oggi al <strong>+39 392 65 09 237</strong> per ricevere informazioni, prenotare il noleggio e ricevere il dispositivo in sole 24/48 ore, con <strong>consegna rapida in tutta Italia!</strong></p>',
        '<h3>Perché scegliere il noleggio</h3>',
        '<p>Il noleggio è la scelta ideale per chi ha bisogno di un trattamento temporaneo, senza l’impegno di un acquisto. Una formula flessibile che consente di seguire le terapie prescritte senza rinunciare alla qualità e alla comodità.</p>',
        '<p><strong>Vantaggi del noleggio:</strong></p>',
        '<ul><li>Nessun costo di acquisto</li><li>Consegna a domicilio in 24/48 ore</li><li>Possibilità di proroga o ritiro anticipato</li><li>Supporto tecnico e consulenza gratuita</li><li>Dispositivo sanificato e certificato</li></ul>',
        '<h3>Perché affidarti a Mia Medical Italia</h3>',
        '<p>Con <strong>Mia Medical Italia</strong> hai la garanzia di un servizio affidabile e professionale, con assistenza personalizzata e dispositivi elettromedicali di ultima generazione.</p>',
        '<p>I nostri punti di forza:</p>',
        '<ul><li>Consulenza gratuita prima e durante il noleggio</li><li>Dispositivi CE e sanificati ad ogni utilizzo</li><li>Consegna e ritiro a domicilio in tutta Italia</li><li>Staff esperto e disponibile</li><li>Prezzi trasparenti e competitivi</li></ul>',
        '<p>Visita il <strong>nostro sito</strong> per scoprire la vasta gamma di dispositivi elettromedicali, <strong><a href="/catalogo-noleggio/">magnetoterapia, elettroterapia, presso terapia, crioterapia e tanto altro.</a></strong></p>',
        '<p>Con Mia Medical Italia, la cura non è mai stata così semplice e sicura. Prenota il tuo dispositivo ora e inizia la tua terapia in sole 24/48 ore! Che aspetti, <strong><a href="https://wa.me/393926509237">contattaci</a></strong> ora al +<strong>39 392 65 09 237.</strong> Chiamaci per noleggiare oggi stesso il tuo dispositivo per la magneto terapia domiciliare.</p>',
      ].join(''),
    },
    en: {
      title: 'Globus Magnetocemp Elite, for hire',
      slug: 'noleggio-magnetocemp-elite-globus',
      shortDescription: 'Hire Magnetotherapy Magnetocemp Elite Globus Home delivery throughout Italy from 15€ + 15€ for collection. Free delivery if you purchase a rental for a minimum of 45 days. No deposit required!',
      metaTitle: 'Globus Magnetocemp Elite hire',
      metaDescription: 'Globus Magnetocemp Elite hire from €2.90 a day, delivered to your door. Safe, reliable machines that are easy to use.',
      description: [
        '<p>The <strong>professional magnetotherapy device</strong> is a low-frequency, high-intensity PEMF device, ideal for targeted treatments against joint inflammation, arthrosis, bone oedema and musculoskeletal system disorders. Thanks to the <strong>Pulsed Electromagnetic Fields</strong>It stimulates tissue regeneration and promotes natural, safe and non-invasive healing.</p>',
        '<p>Designed for outpatient and home use, this device is simple to use but highly efficient: it allows effective treatments directly at home, following the therapeutic plan prescribed by the doctor or physiotherapist.</p>',
        '<h3>Professional Magnetotherapy Hire: device features</h3>',
        '<ul><li>Low-frequency PEMF magnetotherapy</li><li>High intensity for in-depth treatments</li><li>Preset programmes for arthrosis, tendonitis, oedema, fractures</li><li>Adjustable timer for therapy duration</li><li>Backlit display and intuitive controls</li><li>Mains power supply</li><li>Accessories included: therapy band, solenoids, manual</li><li>Easy to use, even without medical experience</li></ul>',
        '<p>Renting this device provides a practical and cost-effective solution for treatment cycles of 30 to 60 days, with the convenience of treatment at home.</p>',
        '<p>Contact us today at <strong>+39 392 65 09 237</strong> to receive information, book the rental and receive the device in just 24/48 hours, with <strong>fast delivery throughout Italy!</strong></p>',
        '<h3>Why hire</h3>',
        '<p>Rental is the ideal choice for those who need temporary treatment without the commitment of a purchase. A flexible formula that allows you to follow prescribed therapies without sacrificing quality and comfort.</p>',
        '<p><strong>Rental advantages:</strong></p>',
        '<ul><li>No purchase costs</li><li>Home delivery in 24/48 hours</li><li>Possibility of extension or early withdrawal</li><li>Free technical support and advice</li><li>Sanitised and certified device</li></ul>',
        '<h3>Why trust Mia Medical Italia</h3>',
        '<p>With <strong>Mia Medical Italia</strong> you are guaranteed a reliable and professional service, with personalised assistance and state-of-the-art electromedical devices.</p>',
        '<p>Our strengths:</p>',
        '<ul><li>Free advice before and during rental</li><li>CE devices and sanitised for each use</li><li>Home delivery and collection throughout Italy</li><li>Experienced and helpful staff</li><li>Transparent and competitive prices</li></ul>',
        '<p>Visit the <strong>our site</strong> to discover the wide range of electromedical devices, <strong><a href="/en/rental-catalog/">magnetotherapy, electrotherapy, pressure therapy, cryotherapy and more.</a></strong></p>',
        '<p>With Mia Medical Italia, treatment has never been easier and safer. Book your device now and start your treatment in just 24/48 hours! What are you waiting for, <strong><a href="https://wa.me/393926509237">contact us</a></strong> now at +<strong>39 392 65 09 237.</strong> Call us to rent your home magneto therapy device today.</p>',
      ].join(''),
    },
  },

  specs: {
    'included-accessories': { it: 'Fascia terapeutica, solenoidi, manuale', en: 'Therapeutic band, solenoids, manual' },
  },

  media: {
    thumbnail: 'magnetocemp-elite-globus-1.png',
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
