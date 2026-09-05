/**
 * Vendita Magnetoterapia THERAPIST® 150 Plus
 *
 * /prodotto/magnetoterapia-therapist-150-plus-vendita/
 * WooCommerce product 14723, 650,00 €.
 *
 * ⚠️ Its Yoast description is the HIRE listing's, word for word — "da soli 2,90€
 * al giorno. Trasporto gratuito. Nessun Deposito" — on a page that sells the
 * device outright. Carried as the site has it; noted in docs/catalog/README.md.
 */

import { generalTerms } from '../shared/terms.ts';
import { magnetotherapySale } from './category.ts';

export const therapist150PlusSale = magnetotherapySale.fixed({
  code: 'therapist-150-plus-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 650,

  translations: {
    it: {
      title: 'Vendita Magnetoterapia THERAPIST® 150 Plus',
      slug: 'magnetoterapia-therapist-150-plus-vendita',
      shortDescription: 'MAGNETOTERAPIA THERAPIST® 150 Plus Dispositivo professionale compatto e portatile per uso domiciliare e ambulatoriale. - 100% flusso magnetico diretto verso la zona da trattare - Ideale per dolori, infiammazioni, fratture e artrosi - Utilizzabile anche sopra vestiti o gessi - Batteria a lunga durata e app di controllo dedicata Spedizione gratuita in 24/48 ore! Acquista ora il tuo THERAPIST® 150 Plus!',
      metaTitle: 'Vendita Magnetoterapia THERAPIST 150 PLUS',
      metaDescription: 'Vendita Magnetoterapia Therapist 150 plus da soli 2,90€ al giorno. Trasporto gratuito. Nessun Deposito. disponibilità immediata. Prenota online ora!',
      description: [
        '<p><strong>THERAPIST® 150 Plus</strong> è una <strong>magnetoterapia professionale compatta e portatile</strong>, ideale sia per uso domiciliare che ambulatoriale. Grazie al <strong>solenoide brevettato integrato</strong>, è in grado di indirizzare il <strong>100% del flusso magnetico</strong> verso la zona da trattare, offrendo un’azione mirata ed efficace per <strong>dolori acuti e cronici, fratture, infiammazioni, artrosi e osteoporosi</strong>.</p>',
        '<p>La tecnologia dei <strong>Campi Elettromagnetici Pulsati (CEMP)</strong> stimola la rigenerazione cellulare, accelera la guarigione ossea e riduce l’infiammazione. È particolarmente indicata in caso di <strong>traumi muscolari, tendiniti, periartriti, lombalgie e sindrome del tunnel carpale</strong>.</p>',
        '<p>Silenzioso, privo di vibrazioni e <strong>completamente senza fili</strong>, il dispositivo può essere utilizzato <strong>anche sopra vestiti o gessi</strong>, garantendo massima praticità e comfort durante la terapia.</p>',
        '<p>Grazie alla <strong>batteria a lunga durata</strong> e alle <strong>dimensioni tascabili (9 x 13,5 cm)</strong>, THERAPIST® 150 Plus è perfetto per essere portato ovunque. L’<strong>app dedicata</strong> consente di monitorare in tempo reale la durata del trattamento, il programma in uso e lo stato della batteria, suggerendo inoltre la frequenza magnetoterapeutica più adatta al tipo di dolore.</p>',
        '<h3>Caratteristiche principali</h3>',
        '<ul><li>Magnetoterapia professionale compatta e portatile</li><li>Solenoide brevettato integrato con flusso magnetico diretto al 100%</li><li>Nessun filo, utilizzo anche sopra vestiti o gessi</li><li>Batteria a lunga durata e dimensioni tascabili (9 x 13,5 cm)</li><li>App dedicata per il controllo in tempo reale</li><li>Segnalatore acustico di fine trattamento</li><li>Ideale per dolori acuti e cronici, fratture, artrosi e osteoporosi</li><li>Accessori inclusi: fascia elastica, manuale d’uso</li></ul>',
        '<h3>Perché scegliere il servizio Mia Medical Italia</h3>',
        '<p>Affidarsi a <strong>Mia Medical Italia</strong> significa scegliere <strong>qualità, professionalità e sicurezza</strong>.<br />I nostri punti di forza:</p>',
        '<ul><li>Consulenza gratuita nella scelta del dispositivo più adatto</li><li>Assistenza telefonica continua prima e dopo l’acquisto</li><li>Consegna rapida in tutta Italia (24/48 ore)</li><li>Dispositivi <strong>certificati CE</strong> e <strong>sanificati</strong></li><li>Prezzi <strong>chiari e trasparenti</strong></li><li>Staff esperto e disponibile</li></ul>',
        '<h3>La tua salute, nelle tue mani</h3>',
        '<p>Visita il nostro sito per scoprire la <strong>vasta gamma di dispositivi </strong><a href="/catalogo-noleggio/"><strong>elettromedicali</strong>, magnetoterapia, elettroterapia, pressoterapia, crioterapia e tanto altro.</a></p>',
        '<p>Con <strong>Mia Medical Italia</strong>, la cura non è mai stata così <strong>semplice e sicura</strong>.<br /><strong>Prenota ora il tuo dispositivo</strong> e inizia la tua terapia in sole <strong>24/48 ore!</strong></p>',
        '<p><strong>Contattaci subito al +39 392 65 09 237</strong> per acquistare oggi stesso il tuo dispositivo di <strong>magnetoterapia domiciliare THERAPIST® 150 Plus</strong>.</p>',
      ].join(''),
    },
    en: {
      title: 'THERAPIST® 150 Plus magnetotherapy, for sale',
      slug: 'magnetoterapia-therapist-150-plus-vendita',
      shortDescription: 'THERAPIST® 150 Plus MAGNETIC THERAPY Compact and portable professional device for home and outpatient use. - 100% magnetic flux directed towards the area to be treated - Ideal for pain, inflammation, fractures and arthrosis - Can also be used over clothes or plasters - Long battery life and dedicated control app Free shipping within 24/48 hours! Purchase your THERAPIST® 150 Plus now!',
      metaTitle: 'THERAPIST 150 PLUS magnetotherapy for sale',
      metaDescription: 'Therapist 150 Plus magnetotherapy: a compact, portable professional device for use at home or in a clinic.',
      description: [
        '<p><strong>THERAPIST® 150 Plus</strong> is a <strong>compact and portable professional magnetotherapy</strong>, ideal for both home and outpatient use. Thanks to the <strong>patented integrated solenoid</strong>, is able to direct the <strong>100% of magnetic flux</strong> towards the area to be treated, offering targeted and effective action for <strong>acute and chronic pain, fractures, inflammation, arthrosis and osteoporosis</strong>.</p>',
        '<p>The technology of <strong>Pulsed Electromagnetic Fields (PEMF)</strong> stimulates cell regeneration, accelerates bone healing and reduces inflammation. It is particularly recommended in cases of <strong>muscle traumas, tendinitis, periarthritis, lumbago and carpal tunnel syndrome</strong>.</p>',
        '<p>Silent, vibration-free and <strong>completely wireless</strong>, the device can be used <strong>even over clothes or casts</strong>, ensuring maximum practicality and comfort during therapy.</p>',
        '<p>Thanks to the <strong>long battery life</strong> and the <strong>pocket size (9 x 13.5 cm)</strong>, THERAPIST® 150 Plus is perfect for taking anywhere. The’<strong>dedicated app</strong> allows you to monitor the duration of treatment, the programme in use and the battery status in real time, while also suggesting the most suitable magnetotherapy frequency for the type of pain.</p>',
        '<h3>Main features</h3>',
        '<ul><li>Compact and portable professional magnetotherapy</li><li>Patented integrated solenoid with direct magnetic flux to 100%</li><li>No threads, use even over clothes or casts</li><li>Long battery life and pocket size (9 x 13.5 cm)</li><li>Dedicated app for real-time control</li><li>End-of-treatment buzzer</li><li>Ideal for acute and chronic pain, fractures, arthrosis and osteoporosis</li><li>Accessories included: elastic band, user manual</li></ul>',
        '<h3>Why choose the Mia Medical Italia service</h3>',
        '<p>Rely on <strong>Mia Medical Italia</strong> means to choose <strong>quality, professionalism and safety</strong>.<br />Our strengths:</p>',
        '<ul><li>Free advice on choosing the most suitable device</li><li>Continuous telephone support before and after purchase</li><li>Fast delivery throughout Italy (24/48 hours)</li><li>Devices <strong>EC certificates</strong> e <strong>sanitised</strong></li><li>Prices <strong>clear and transparent</strong></li><li>Experienced and helpful staff</li></ul>',
        '<h3>Your health, in your hands</h3>',
        '<p>Visit our website to discover the <strong>wide range of devices </strong><a href="/en/rental-catalog/"><strong>electromedical</strong>, magnetotherapy, electrotherapy, pressure therapy, cryotherapy and more.</a></p>',
        '<p>With <strong>Mia Medical Italia</strong>, care has never been so <strong>simple and safe</strong>.<br /><strong>Book your device now</strong> and start your therapy in sunshine <strong>24/48 hours!</strong></p>',
        '<p><strong>Contact us now on +39 392 65 09 237</strong> to purchase your <strong>THERAPIST® 150 Plus home magnetotherapy</strong>.</p>',
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
  terms: [generalTerms],
});
