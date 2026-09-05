/**
 * Noleggio carrozzina Elettrica Superwheel
 *
 * /prodotto/carrozzina-elettrica-superwheel-a-noleggio/
 * WooCommerce product 14542. The page's "Caratteristiche tecniche e dettagli
 * pratici" list is the source for every value below.
 *
 * Note the two different load figures the page prints: the sales bullets say
 * "portata fino a 150 kg" and the technical list says "Capacità di carico: 135
 * kg". The technical figure is the one recorded, since that is the list the shop
 * publishes as specification — the 150 kg appears in the marketing copy, which
 * is carried verbatim in the description.
 *
 * ⚠️ 400 € deposit. Delivery is 30 € out and 30 € back.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { electricWheelchairsAndScootersHire } from './category.ts';

export const superwheelElectric = electricWheelchairsAndScootersHire.rental({
  code: 'superwheel-electric',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(3, 110),
    days(7, 160),
    days(15, 250),
    days(30, 390),
    days(45, 540),
  ],

  translations: {
    it: {
      title: 'Noleggio carrozzina Elettrica Superwheel',
      slug: 'carrozzina-elettrica-superwheel-a-noleggio',
      shortDescription: 'Libertà di movimento. Noleggia la tua carrozzina elettrica Superwheel e riscopri la comodità di muoverti senza fatica! Completamente elettrica: il joystick gestisce guida, schienale e pedane. Il ritiro in magazzino è gratuito. Siamo a Roma e Firenze. Consegna gratuita per i noleggi da 30 giorni; altrimenti 30€ + 30€ per il ritiro. Deposito richiesto: 400€.',
      metaTitle: 'Noleggio carrozzina Elettrica Superwheel',
      metaDescription: 'Noleggio carrozzina elettrica superwheel da esterno e interno per anziani e disabili. Fino a 25 km di autonomia, consegna a Roma e Firenze. Prenota subito.',
      description: [
        '<p><strong>Noleggio Carrozzina Elettrica Superwheel da esterno ed interno per anziani e disabili: scopri l’Italia con autonomia e comfort!</strong><br />Eleganza, sicurezza e praticità per vivere Roma e Firenze senza limiti.</p>',
        '<p>Se desideri muoverti liberamente e senza fatica tra le meraviglie di <strong>Roma</strong> o l’eleganza rinascimentale di <strong>Firenze</strong>, la carrozzina elettrica <strong>Superwheel</strong> da interno ed esterno è il compagno di viaggio perfetto. Con il suo design all’avanguardia, completamente smontabile e pieghevole, garantisce autonomia, comfort e sicurezza totale.</p>',
        '<h3>Perché scegliere il noleggio della Carrozzina Elettrica Superwheel?</h3>',
        '<ul><li><strong>Massimo comfort:</strong> seduta ergonomica da 43 cm, schienale reclinabile e pedane elevabili con prolungamento per appoggio testa, braccioli regolabili.</li><li><strong>Alta autonomia:</strong> percorri fino a 25 km con batterie al litio potenziate – ideale per un’intera giornata di visite.</li><li><strong>Joystick:</strong> Con un solo joystick controlli tutto: direzione, velocità, schienale e pedane regolabili.</li><li><strong>Sicurezza garantita:</strong> joystick elettrico intuitivo, ruote pneumatiche 4&#215;4 per tutti i terreni, freni affidabili e stabilità su qualsiasi superficie.</li><li><strong>Trasporto semplice:</strong> completamente pieghevole e smontabile, perfetta per essere trasportata in macchina; cestello posteriore rimovibile.</li><li><strong>Design versatile:</strong> compatta con ingombro totale di 63 cm aperta, portata fino a 150 kg, adatta a tutte le età.</li></ul>',
        '<h3>Caratteristiche tecniche e dettagli pratici</h3>',
        '<ul><li>Velocità massima: 8 km/h</li><li>Autonomia: 13 km (standard) – 25 km (batterie potenziate)</li><li>Capacità di carico: 135 kg</li><li>Seduta: 43 cm</li><li>Schienale: reclinabile con prolungamento per testa</li><li>Motore: 2 x 250W</li><li>Batterie: Litio, peso 1,3 kg</li><li>Ruote: pneumatiche 4&#215;4 con camera d’aria</li><li>Comandi: joystick elettrico per l’utente</li></ul>',
        '<p><strong>Il tuo viaggio senza limiti con Mia Medical Italia e la Carrozzina Elettrica Superwheel per anziani e disabili a noleggio!</strong></p>',
        '<p>Che tu voglia esplorare il <strong>Colosseo</strong> o passeggiare sul <strong>Ponte Vecchio</strong>, la <strong>Superwheel</strong> ti offre la libertà di goderti ogni istante con serenità. È ideale per:</p>',
        '<ul><li>Viaggiatori senior o persone con mobilità ridotta</li><li>Chi cerca un’esperienza confortevole anche su lunghe distanze</li><li>Donne in gravidanza o chi desidera muoversi in sicurezza e comodità</li></ul>',
        '<p><strong>Come funziona il noleggio con Mia Medical</strong></p>',
        '<p>La <strong>Carrozzina Elettrica Superwheel</strong> da interno ed esterno per anziani e disabili è disponibile per consegna e ritiro a <strong>Roma e Firenze</strong>. Prenotala online o chiamaci al numero <strong>+39 392 65 09 237</strong>: al resto ci pensiamo noi! Prenota ora la tua carrozzina e scopri l’Italia in piena libertà.</p>',
        '<p><strong>Nota bene:</strong> consulta sempre le nostre condizioni di noleggio.</p>',
        '<p>Muoviti senza preoccupazioni e goditi le meraviglie delle città italiane.. un passo… o una ruota alla volta.</p>',
        '<p><strong>Recapiti utili</strong></p>',
        '<p>Contattaci per tariffe e disponibilità giornaliere. Scopri tutti gli altri modelli di carrozzine elettriche e scooter elettrici per la mobilità che <strong>Mia Medical Italia</strong> ha da offrire. Sul nostro <a href="/blog/">blog</a> trovi guide alla scelta consapevole e consigli per il turismo accessibile. Iscriviti alla nostra newsletter per non perderne nemmeno uno.</p>',
        '<p><strong><em>Non sei ancora convinto?</em></strong> Chiamaci ora al +39 392 65 09 237 o mandaci un messaggio su WhatsApp: il nostro team di specialisti è sempre disponibile a rispondere a qualsiasi domanda. Ti guideremo a scegliere l’opzione di noleggio più adatta alle tue esigenze, gratis e senza impegno.</p>',
        '<h2>Link Utili</h2>',
        '<p>Scopri il <a href="https://www.turismoroma.it/it">turismo accessibile a Roma</a> e pianifica i tuoi spostamenti senza barriere nella capitale, oppure consulta le informazioni sul <a href="https://www.feelflorence.it/it">turismo accessibile a Firenze </a>per vivere la città in totale autonomia e sicurezza.</p>',
      ].join(''),
    },
    en: {
      title: 'Superwheel electric wheelchair for hire',
      slug: 'carrozzina-elettrica-superwheel-a-noleggio',
      shortDescription: 'Freedom of movement Rent your Superwheel electric wheelchair and rediscover the comfort of effortless movement! Fully electric. The electric joystick controls the entire wheelchair: steering, backrest and footrests in total simplicity. Pick-up at the warehouse is free. We are in Rome and Florence. Free delivery in Rome and Florence for 30-day rentals! Home delivery: 30€ + 30€ for collection. Deposit required: 400€ For the rental of this article, a deposit of 400€.',
      metaTitle: 'Superwheel electric wheelchair hire',
      metaDescription: 'Hire the Superwheel indoor-outdoor electric wheelchair: up to 25 km on a charge, joystick control of drive, backrest and footrests. Rome and Florence.',
      description: [
        '<p><strong>Electric Wheelchair Hire Superwheel for Outdoor and Indoor Use for the Elderly and Disabled: Discover Italy with Autonomy and Comfort!</strong><br />Elegance, safety and practicality to experience Rome and Florence without limits.</p>',
        '<p>If you wish to move freely and effortlessly among the wonders of <strong>Rome</strong> or the Renaissance elegance of <strong>Florence</strong>, the electric wheelchair <strong>Superwheel</strong> From indoor and outdoor use, it\'s the perfect travel companion. With its cutting-edge, fully dismantlable and foldable design, it guarantees independence, comfort, and total safety.</p>',
        '<h3>Why choose the Superwheel Electric Wheelchair rental?</h3>',
        '<ul><li><strong>Maximum comfort:</strong> 43 cm ergonomic seat, reclining backrest and elevating footrests with extension for head support, adjustable armrests.</li><li><strong>High autonomy:</strong> travel up to 25 km with upgraded lithium batteries - ideal for a full day\'s visit.</li><li><strong>Joystick:</strong> With one joystick you control everything: direction, speed, backrest and adjustable footpegs.</li><li><strong>Guaranteed security:</strong> intuitive electric joystick, 4×4 pneumatic wheels for all terrain, reliable brakes and stability on any surface.</li><li><strong>Simple transport:</strong> fully foldable and removable, perfect for transport in the car; removable rear basket.</li><li><strong>Versatile design:</strong> compact with a total footprint of 63 cm open, load capacity up to 150 kg, suitable for all ages.</li></ul>',
        '<h3>Technical features and practical details</h3>',
        '<ul><li>Maximum speed: 8 km/h</li><li>Autonomy: 13 km (standard) - 25 km (upgraded batteries)</li><li>Load capacity: 135 kg</li><li>Seat: 43 cm</li><li>Backrest: reclining with head extension</li><li>Motor: 2 x 250W</li><li>Batteries: Lithium, weight 1.3 kg</li><li>Wheels: 4×4 pneumatic with inner tube</li><li>Controls: electric joystick for the user</li></ul>',
        '<p><strong>Your journey without limits with Mia Medical Italia and the Superwheel Electric Wheelchair for the elderly and disabled for hire!</strong></p>',
        '<p>Whether you want to explore the <strong>Colosseum</strong> or walk on the <strong>Old Bridge</strong>, the <strong>Superwheel</strong> offers you the freedom to enjoy every moment with serenity. It is ideal for:</p>',
        '<ul><li>Senior travellers or persons with reduced mobility</li><li>Those seeking a comfortable experience even over long distances</li><li>Pregnant women or those who wish to move around safely and comfortably</li></ul>',
        '<p><strong>How rental works with Mia Medical</strong></p>',
        '<p>La <strong>Superwheel Electric Wheelchair</strong> from internal and external for the elderly and disabled is available for delivery and collection at <strong>Rome and Florence</strong>. Book it online or call us at <strong>+39 392 65 09 237</strong>we\'ll take care of the rest! Book your wheelchair now and discover Italy in complete freedom.</p>',
        '<p><strong>Please note:</strong> always consult our rental conditions.</p>',
        '<p>Move carefree and enjoy the wonders of Italian cities... one step... or one wheel at a time.</p>',
        '<p><strong>Useful addresses</strong></p>',
        '<p>Contact us for daily rates and availability. Discover all the other models of electric wheelchairs and electric mobility scooters that <strong>Mia Medical Italia</strong> has to offer. On our <a href="/en/blog/">blog</a> find guides to conscious choice and tips for accessible tourism. Subscribe to our newsletter so you don\'t miss a single one.</p>',
        '<p><strong><em>Still not convinced?</em></strong> Call us now on +39 392 65 09 237 or send us a message on WhatsApp: our team of specialists is always available to answer any questions. We will guide you in choosing the most suitable rental option for your needs, free of charge and without obligation.</p>',
        '<h2>Useful Links</h2>',
        '<p>Discover the <a href="https://www.turismoroma.it/it">accessible tourism in Rome</a> and plan your barrier-free travels in the capital, or consult information on the <a href="https://www.feelflorence.it/it">accessible tourism in Florence </a>to experience the city in total autonomy and safety.</p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'indoor-outdoor': 'both',
    'max-load': 135,
    'max-speed': 8,
    'battery-range': { min: 13, max: 25 },
    motor: { it: '2 x 250 W', en: '2 × 250 W' },
    battery: { it: 'Litio, peso 1,3 kg', en: 'Lithium, 1.3 kg' },
    controls: { it: 'Joystick elettrico per l’utente', en: 'Electric joystick, operated by the user' },
    'seat-width': { min: 43, max: 43 },
    'total-width': { min: 63, max: 63 },
    'wheel-type': 'pneumatic',
    'rear-wheels': { it: 'Pneumatiche 4×4 con camera d’aria', en: 'Pneumatic 4×4, inner tube' },
    'reclining-backrest': true,
    headrest: true,
    'elevating-legrests': true,
    foldable: true,
    dismountable: true,
  },

  media: {
    thumbnail: { file: 'superwheel-electric-1.png', alt: { it: 'Vendita carrozzina elettrica Superwheel' } },
    gallery: [
      'superwheel-electric-2.png',
      'superwheel-electric-3.png',
      'superwheel-electric-4.png',
      'superwheel-electric-5.png',
      'superwheel-electric-6.png',
    ],
  },

  addons: [homeDeliveryOnly(30), homeCollection(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
