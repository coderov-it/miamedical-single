/**
 * Noleggio Verticalizzatore Elettrico
 *
 * /prodotto/noleggio-verticalizzatore-a-domicilio/
 * WooCommerce product 8853, and the most detailed attribute table in the whole
 * catalogue:
 *
 *   Length  Interna max: 87 cm - Esterna max: 100 cm
 *   Ingombro sulla sagittale max verticalizzazione  29 cm
 *   Lunghezza del braccio  81 cm    Ingombro massimo delle gambe  110 cm
 *   Heights  Braccio da 100 a 180 cm    Wheel  10,5 cm
 *   Maximum capacity  180 Kg
 *
 * ⚠️ Two load limits: this table says 180 kg, the prose says 200 kg. 180 kg is
 * recorded — see the note on the category.
 *
 * ⚠️ The 90-day variation is labelled "90 giorni 360 €" and charges 390 €.
 *
 * This product asks NO intake question on the live site, so it carries none.
 * Delivery is 45 € out and 45 € back, free from 60 days.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { standingFramesHire } from './category.ts';

export const electricStandingHoist = standingFramesHire.rental({
  code: 'electric-standing-hoist',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 110),
    days(30, 180),
    days(60, 280),
    days(90, 390),
  ],

  translations: {
    it: {
      title: 'Noleggio Verticalizzatore Elettrico',
      slug: 'noleggio-verticalizzatore-a-domicilio',
      shortDescription: 'Noleggio verticalizzatore con imbracatura. Ideal per il bagno. Consegna a Roma e Firenze a partire da 45€ + 45€ per il ritiro Consegna gratuita per i noleggi da 60 giorni ! Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Noleggio Verticalizzatore elettrico per anziani e disabili',
      metaDescription: 'Noleggio Verticalizzatore elettrico per anziani e disabili. Da 3,70€ al giorno. Migliore Prezzo Garantito. Esperti al tuo servizio. Prezzi imbattibili.',
      description: [
        '<h3>Noleggio Verticalizzatore elettrico per anziani e disabili</h3>',
        '<p>Mia Medical Italia offre un servizio di <strong>noleggio di verticalizzatore elettrico</strong><strong>per anziani e persone con disabilità</strong> , un dispositivo medicale progettato per aiutare le persone con ridotta mobilità a passare dalla posizione seduta a quella eretta in modo sicuro, assistito e senza sforzo. È particolarmente utile nella fase di <strong>riabilitazione</strong> o per l<strong>’assistenza quotidiana domiciliare ed ospedaliera.</strong></p>',
        '<h3>A chi può essere utile un verticalizzatore elettrico </h3>',
        '<p>Questo ausilio è indicato per: </p>',
        '<ul><li>Persone con <strong>disabilità motorie temporanee o permanenti</strong></li><li>Pazienti in fase di <strong>riabilitazione post-operatoria o neurologica</strong></li><li><strong>Anziani</strong> con ridotta forza muscolare</li><li><strong>Caregiver e operatori sanitari</strong> che necessitano di strumenti sicuri per il sollevamento e la movimentazione del paziente</li><li>Ideal per l&#8217;uso in bagno, con la partecipazione del paziente. </li></ul>',
        '<h4><a href="https://www.morettispa.com/prodotto/verticalizzatore-muevo-up-portata-max-200kg-con-leva/">Specifiche Tecniche: noleggio verticalizzatore elettrico per anziani e persone con disabilità </a></h4>',
        '<ul><li><strong>struttura robusta</strong> in acciaio verniciato </li><li>Portata massima di carico: <strong>200 kg</strong></li><li><strong>Sistema di sollevamento</strong> con braccio regolabile e supporto ergonomico </li><li><strong>Basi regolabili </strong>per una maggiore stabilità durante il trasferimento</li><li><strong>Poggia ginocchia regolabile</strong> in altezza e larghezza</li><li><strong>Maniglie</strong> confortevoli per l’operatore sanitario</li><li><strong>Ganci</strong> progettati appositamente per alloggiare <strong>l’imbracatura</strong> in tutta sicurezza</li><li><strong>Autonomia: oltre 100 sollevamenti</strong> con batteria completamente carica</li><li><strong>Quattro ruote piroettanti di cui due con freno</strong>, per un trasporto sicuro in ogni ambiente</li><li><strong>Supporti imbottiti e regolabili</strong> per garantire comfort e sicurezza durante l’utilizzo </li></ul>',
        '<p>Clicca <a href="https://file.morettispa.com/download-file/ri841/?wpdmdl=2017&amp;refresh=681604f63e5b21746273526">qui</a> per consultare la scheda tecnica completa e il manuale d’uso.</p>',
        '<h3>Perché scegliere il servizio di noleggio </h3>',
        '<p>Il <strong>noleggio di un verticalizzatore</strong> elettrico è la soluzione ideale per chi: </p>',
        '<ul><li>Ha bisogno di un dispositivo solo per un periodo di tempo limitato</li><li>Vuole testare se l’ausilio si addice alle proprie esigenze senza un investimento iniziale elevato</li><li>Cerca una soluzione immediata e flessibile per la riabilitazione a domicilio </li></ul>',
        '<p>Inoltre, se sei il caregiver di una persona anziana o con mobilità ridotta e hai bisogno di una mano nell’assistenza quotidiana, il nostro infermiere di fiducia <a href="http://Www.arnaldiandrea.com">Andrea Arnaldi</a> è specializzato nell’assistenza domiciliare, e permetterà ai tuoi cari di continuare le proprie cure dal confort della propria abitazione. </p>',
        '<h3>Perché scegliere Mia Medical Italia </h3>',
        '<p>Affidarsi a Mia Medical significa scegliere:</p>',
        '<ul><li><strong>Professionalità e rapidità</strong>&nbsp;nella consegna a domicilio</li><li><strong>Igienizzazione e sanificazione</strong>&nbsp;garantita di ogni dispositivo</li><li><strong>Assistenza tecnica dedicata</strong>&nbsp;per tutta la durata del noleggio</li><li><strong>Possibilità di noleggio a breve, medio e lungo termine</strong></li><li>Prezzi trasparenti e competitivi</li><li><strong>Ampia gamma di ausili</strong> per la mobilità e la riabilitazione</li><li>Dispositivi di <strong>altissima qualità</strong> dai <a href="https://www.morettispa.com/categoria-prodotto/mopedia/sollevamalati-e-verticalizzatori/verticalizzatore/">migliori fornitori sul mercato</a></li></ul>',
        '<h3>Informazioni Utili </h3>',
        '<p>Scegli il massimo del comfort, della sicurezza e della praticità per la mobilità assistita.&nbsp;<strong><a href="https://wa.me/393926509237">Contattaci ora</a></strong>&nbsp;per ricevere un preventivo personalizzato o per richiedere la disponibilità immediata del&nbsp;<strong>verticalizzatore elettrico</strong>! Il nostro team di esperti è sempre pronto a chiarire ogni tuo dubbio, chiamaci al numero +<strong>39 392 65 09 237 </strong>per una consulenza gratuita!</p>',
        '<ul><li><a href="https://wa.me/393926509237">Whatsapp</a></li><li><a href="https://www.instagram.com/miamedical_italia/">Instagram</a></li><li><a href="https://www.facebook.com/MIAMedicalitalia/">Facebook</a></li><li><a href="/">Sito web</a></li></ul>',
      ].join(''),
    },
    en: {
      title: 'Electric standing hoist for hire',
      slug: 'noleggio-verticalizzatore-a-domicilio',
      shortDescription: 'Rental of verticaliser with sling. Ideal for the bathroom. Delivery in Rome and Florence starting from €45 + €45 for collection Free delivery for 60-day rentals! No deposit required. Delivery and collection from the warehouse are FREE!',
      metaTitle: 'Electric standing hoist hire for older and disabled users',
      metaDescription: 'Electric standing hoist hire for older and disabled users, from €3.70 a day. Best price guaranteed, experts on hand.',
      description: [
        '<h3>Hire of an electric hoist for the elderly and disabled</h3>',
        '<p>Mia Medical Italia offers a service of <strong>rental of electric verticaliser</strong><strong>for elderly people and people with disabilities</strong> a medical device designed to help people with reduced mobility move from a sitting to a standing position in a safe, assisted and effortless manner. It is particularly useful during <strong>rehabilitation</strong> or for the<strong>daily home and hospital care.</strong></p>',
        '<h3>Who could benefit from an electric verticaliser </h3>',
        '<p>This aid is indicated for: </p>',
        '<ul><li>People with <strong>temporary or permanent motor disabilities</strong></li><li>Patients undergoing <strong>post-operative or neurological rehabilitation</strong></li><li><strong>Seniors</strong> with reduced muscle strength</li><li><strong>Caregivers and carers</strong> in need of safe patient lifting and handling equipment</li><li>Ideal for bathroom use, with patient participation. </li></ul>',
        '<h4><a href="https://www.morettispa.com/prodotto/verticalizzatore-muevo-up-portata-max-200kg-con-leva/">Technical Specifications: hire of electric stand-aid for elderly people and individuals with disabilities </a></h4>',
        '<ul><li><strong>robust structure</strong> in painted steel </li><li>Maximum load capacity: <strong>200 kg</strong></li><li><strong>Lifting system</strong> with adjustable arm and ergonomic support </li><li><strong>Adjustable bases </strong>for greater stability during transfer</li><li><strong>Adjustable knee rest</strong> in height and width</li><li><strong>Handles</strong> comfortable for the health worker</li><li><strong>Hooks</strong> specially designed to accommodate <strong>the harness</strong> safely</li><li><strong>Autonomy: over 100 lifts</strong> with fully charged battery</li><li><strong>Four swivel castors, two with brakes</strong>for safe transport in any environment</li><li><strong>Padded and adjustable supports</strong> to ensure comfort and safety during use </li></ul>',
        '<p>Click <a href="https://file.morettispa.com/download-file/ri841/?wpdmdl=2017&amp;refresh=681604f63e5b21746273526">here</a> to consult the complete technical data sheet and user manual.</p>',
        '<h3>Why choose the rental service </h3>',
        '<p>The <strong>rental of a verticaliser</strong> electric is the ideal solution for those who </p>',
        '<ul><li>It only needs a device for a limited period of time</li><li>He wants to test whether the aid suits his needs without a high initial investment</li><li>Looking for an immediate and flexible solution for home rehabilitation </li></ul>',
        '<p>In addition, if you are the caregiver of an elderly person or a person with reduced mobility and you need a hand with day-to-day care, our trusted nurse <a href="http://Www.arnaldiandrea.com">Andrea Arnaldi</a> specialises in home care, and will enable your loved ones to continue their care from the comfort of their own home. </p>',
        '<h3>Why choose Mia Medical Italia </h3>',
        '<p>Relying on Mia Medical means making a choice:</p>',
        '<ul><li><strong>Professionalism and speed</strong>&nbsp;in home delivery</li><li><strong>Hygienisation and sanitisation</strong>&nbsp;guaranteed of each device</li><li><strong>Dedicated technical assistance</strong>&nbsp;for the duration of the rental</li><li><strong>Possibility of short-, medium- and long-term rental</strong></li><li>Transparent and competitive prices</li><li><strong>Wide range of aids</strong> for mobility and rehabilitation</li><li>Devices of <strong>highest quality</strong> from <a href="https://www.morettispa.com/categoria-prodotto/mopedia/sollevamalati-e-verticalizzatori/verticalizzatore/">best suppliers on the market</a></li></ul>',
        '<h3>Useful Information </h3>',
        '<p>Choose the ultimate in comfort, safety and convenience for assisted mobility.&nbsp;<strong><a href="https://wa.me/393926509237">Contact us now</a></strong>&nbsp;to receive a customised quote or to request immediate availability of the&nbsp;<strong>electric verticaliser</strong>! Our team of experts is always ready to clarify all your doubts, call us at +<strong>39 392 65 09 237 </strong>for a free consultation!</p>',
        '<ul><li><a href="https://wa.me/393926509237">Whatsapp</a></li><li><a href="https://www.instagram.com/miamedical_italia/">Instagram</a></li><li><a href="https://www.facebook.com/MIAMedicalitalia/">Facebook</a></li><li><a href="/en/">Website</a></li></ul>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 180,
    'total-length': { min: 87, max: 100 },
    'total-width': { min: 110, max: 110 },
    'adjustable-height': { min: 100, max: 180 },
    'arm-length': 81,
    'wheel-diameter': 10.5,
    'includes-sling': true,
  },

  media: {
    thumbnail: { file: 'electric-standing-hoist-1.jpg', alt: { it: 'Noleggio Verticalizzatore elettrico' } },
    gallery: [
      'electric-standing-hoist-2.jpg',
    ],
  },

  addons: [homeDeliveryOnly(45), homeCollection(45)],
  terms: [generalTerms],
});
