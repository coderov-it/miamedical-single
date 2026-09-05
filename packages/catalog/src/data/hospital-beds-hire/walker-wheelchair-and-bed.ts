/**
 * Deambulatore + Carrozzina + Letto 1 piazza
 *
 * /prodotto/noleggio-deambulatore-carrozzina-e-letto/
 * WooCommerce product 9486 — the largest combined package, put together for
 * recovery after a hip fracture. The site files it under this category alone.
 *
 * `specs` carries only the one figure the page commits to: the single bed is
 * 90 cm. Which walker and which wheelchair go out is decided per patient, so
 * nothing else is recorded.
 *
 * For hygiene the page requires the mattress protector to be bought — that is why
 * it appears as an add-on rather than as an option.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { hospitalBedsHire } from './category.ts';

export const walkerWheelchairAndBed = hospitalBedsHire.rental({
  code: 'walker-wheelchair-and-bed',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 176),
    days(30, 231),
    days(60, 378),
    days(90, 490),
  ],

  translations: {
    it: {
      title: 'Deambulatore + Carrozzina + Letto 1 piazza',
      slug: 'noleggio-deambulatore-carrozzina-e-letto',
      shortDescription: 'Noleggio Combinato Prenotazione facile, costi chiari, ausili di ultima generazione. Nessun deposito! Consegna a domicilio incluso di montaggio a partire da 65€. Il costo sarà maggiorato in caso di consegna al piano senza ascensore. Per motivi igienici, è obbligatorio acquistare la copertura del materasso a 80€.',
      metaTitle: 'Deambulatore + Carrozzina + Letto 1 piazza - Mia Medical Italia',
      metaDescription: 'Noleggio deambulatore carrozzina e letto con materasso antidecubito. Combo perfetto per la riabilitazione post frattura del femore. Prenota online!',
      description: [
        '<h4><strong>Noleggio Combinato Deambulatore , Carrozzina e Letto Ortopedico 1 piazza</strong></h4>',
        '<p><strong>La soluzione completa per assistenza, degenza e riabilitazione a domicilio</strong></p>',
        '<p>In presenza di una ridotta autonomia motoria , temporanea o prolungata, è fondamentale poter contare su&nbsp;<strong>ausili medicali adeguati, sicuri e compatibili tra loro</strong>. Il servizio di&nbsp;<strong>noleggio combinato Mia Medical Italia</strong>&nbsp;nasce per rispondere a un’esigenza concreta: offrire&nbsp;<strong>un pacchetto completo di dispositivi medicali professionali</strong>, già configurati per lavorare insieme, riducendo tempi, costi e difficoltà organizzative.</p>',
        '<p>Questa formula è studiata per permettere al paziente di&nbsp;<strong>restare nel proprio ambiente domestico</strong>, garantendo al tempo stesso&nbsp;<strong>standard assistenziali elevati</strong>, paragonabili a quelli di una struttura sanitaria.</p>',
        '<h3><strong>A chi è indicato il noleggio combinato di Deambulatore + Carrozzina + Letto Ortopedico 1 piazza</strong></h3>',
        '<p>Il pacchetto è particolarmente indicato in tutti quei casi in cui il paziente presenta:</p>',
        '<ul><li>limitazione parziale o totale della mobilità</li><li>difficoltà nel passaggio letto–sedia</li><li>ridotta forza muscolare</li><li>necessità di assistenza durante la degenza</li><li>percorso riabilitativo graduale</li></ul>',
        '<p><strong>Principali scenari di utilizzo</strong></p>',
        '<ul><li><strong>Post-intervento ortopedico</strong>&nbsp;come frattura del femore, protesi anca, ginocchio, interventi spinali</li><li><strong>Dimissione protetta dall’ospedale</strong></li><li><strong>Convalescenza post-traumatica</strong></li><li><strong>Pazienti anziani con perdita temporanea di autonomia</strong></li><li><strong>Riabilitazione domiciliare seguita da fisioterapista</strong></li><li><strong>Assistenza continuativa a pazienti allettati</strong></li></ul>',
        '<p>Il pacchetto consente di&nbsp;<strong>gestire tutte le fasi della giornata</strong>: riposo, mobilizzazione, spostamenti e recupero funzionale.</p>',
        '<h3><strong>In cosa consiste il noleggio combinato di Deambulatore + Carrozzina + Letto Ortopedico 1 piazza</strong></h3>',
        '<p>Il noleggio include una dotazione completa di ausili medicali professionali, selezionati in base a criteri clinici, ergonomici e di sicurezza.</p>',
        '<p><strong><a href="/prodotto/noleggio-letto-ospedaliero-elettrico-incluso-di-materasso-antidecubito/">Letto ortopedico elettrico 1 piazza : 90 cm</a></strong></p>',
        '<p>Dispositivo medicale progettato per la degenza domiciliare.</p>',
        '<p><strong>Caratteristiche tecniche principali:</strong></p>',
        '<ul><li>rete a doghe o piano articolato</li><li>movimentazione elettrica tramite telecomando</li><li>regolazione schiena e gambe</li><li>altezza studiata per facilitare il lavoro del caregiver</li><li><strong>sponde laterali di sicurezza</strong>&nbsp;anti-caduta</li><li><strong>triangolo alza-malato</strong>&nbsp;per favorire l’autonomia del paziente</li></ul>',
        '<p>Il letto elettrico consente:</p>',
        '<ul><li>corretta postura</li><li>prevenzione delle complicanze da immobilità</li><li>maggiore comfort durante il riposo</li><li>facilitazione delle manovre di igiene e assistenza</li></ul>',
        '<p><strong>Materasso antidecubito PolyPlot</strong></p>',
        '<p>Dispositivo fondamentale nei pazienti costretti a letto per periodi prolungati.</p>',
        '<p><strong>Funzione principale:</strong> riduzione della pressione nelle zone a rischio (sacro, talloni, schiena).</p>',
        '<p><strong>Caratteristiche:</strong></p>',
        '<ul><li>distribuzione uniforme del peso corporeo</li><li>copertura sanitaria impermeabile e traspirante</li><li>facile sanificazione</li></ul>',
        '<p>Indispensabile per la&nbsp;<strong>prevenzione delle piaghe da decubito</strong>&nbsp;e per migliorare il comfort quotidiano del paziente.</p>',
        '<p><strong><a href="/catalogo-noleggio/">Deambulatore</a></strong></p>',
        '<p>Ausilio destinato alla&nbsp;<strong>mobilizzazione assistita</strong>. Viene selezionato in base a:</p>',
        '<ul><li>peso del paziente</li><li>grado di equilibrio</li><li>livello di autonomia residua</li><li>ambiente domestico (spazi, corridoi, soglie)</li></ul>',
        '<p>Il deambulatore permette:</p>',
        '<ul><li>recupero graduale della deambulazione</li><li>riduzione del rischio di cadute</li><li>maggiore sicurezza durante gli spostamenti brevi</li><li>supporto alla fisioterapia domiciliare</li></ul>',
        '<p><strong><a href="/catalogo-noleggio/">Carrozzina</a></strong></p>',
        '<p>La carrozzina è fondamentale per gli spostamenti interni ed esterni. La scelta del modello avviene in base a:</p>',
        '<ul><li>utilizzo temporaneo o frequente</li><li>spinta autonoma o assistita</li><li>larghezza seduta</li></ul>',
        '<p><strong>Consente:</strong></p>',
        '<ul><li>trasferimenti senza affaticamento</li><li>mantenimento della socialità e della routine quotidiana</li></ul>',
        '<h4><strong>Perché scegliere il noleggio combinato di Deambulatore + Carrozzina + Letto Ortopedico 1 piazza</strong></h4>',
        '<p>Il noleggio combinato consente di:</p>',
        '<ul><li>evitare l’acquisto di dispositivi costosi</li><li>disporre di ausili professionali certificati</li><li>adattare la durata alle reali condizioni cliniche</li><li>ricevere supporto tecnico continuo</li><li>ridurre lo stress organizzativo per la famiglia</li></ul>',
        '<p>È la soluzione ideale quando&nbsp;<strong>la durata della degenza non è prevedibile</strong>.</p>',
        '<h4><strong>Durata del noleggio e forfait disponibili</strong></h4>',
        '<p><strong>Noleggio minimo: 7 giorni</strong></p>',
        '<figure><table><tbody><tr><td><strong>Durata</strong></td><td><strong>Prezzo al giorno</strong></td></tr><tr><td>90 giorni</td><td>5,00 €</td></tr><tr><td>60 giorni</td><td>6,00 €</td></tr><tr><td>30 giorni</td><td>7,30 €</td></tr><tr><td>15 giorni</td><td>12,00 €</td></tr></tbody></table></figure>',
        '<ul><li>Prezzi IVA inclusa</li><li>Nessun costo nascosto</li><li>Nessun deposito cauzionale</li><li>Promozioni valide esclusivamente per ordini online</li></ul>',
        '<p>È sempre possibile&nbsp;<strong>prorogare il noleggio</strong>&nbsp;in base all’andamento del recupero.</p>',
        '<h4><strong>Consegna, montaggio e ritiro</strong></h4>',
        '<ul><li><strong>Consegna a domicilio a Roma e Firenze</strong>&nbsp;a partire da&nbsp;<strong>65 €</strong></li><li><strong>Consegna e ritiro in magazzino: GRATUITI</strong></li><li>montaggio incluso e spiegazione del funzionamento</li></ul>',
        '<p>Al termine del periodo di noleggio ci occupiamo anche del&nbsp;<strong>ritiro degli ausili</strong>.</p>',
        '<h3><strong>Consulenza gratuita e supporto continuo</strong></h3>',
        '<p>Ogni situazione clinica è diversa, per questo il team Mia Medical Italia offre una&nbsp;<strong>consulenza personalizzata gratuita</strong>, per aiutarti a scegliere la soluzione che meglio si adatta alle tue esigenze. Chiamaci ora al&nbsp;<strong><a href="https://wa.me/393926509237">+39 392 6509237</a> per richiedere maggiori informazioni!</strong></p>',
        '<h4><strong>Perché scegliere Mia Medical Italia</strong></h4>',
        '<ul><li>esperienza consolidata nel settore medicale</li><li>ausili certificati e sanificati</li><li>assistenza reale e non automatizzata</li><li>nessun deposito cauzionale</li><li>consegna rapida</li><li>soluzioni personalizzate</li><li>supporto umano in un momento delicato</li></ul>',
        '<p>Con Mia Medical Italia non noleggi solo dispositivi<strong>&nbsp;ma costruiamo insieme un percorso di assistenza sicuro, funzionale e su misura.</strong></p>',
      ].join(''),
    },
    en: {
      title: 'Walking frame + wheelchair + single bed, combined hire',
      slug: 'noleggio-deambulatore-carrozzina-e-letto',
      shortDescription: 'Combined Hire Easy booking, clear costs, state-of-the-art aids. No deposit! Home delivery including installation from 65€. The cost will be increased in the case of delivery to a floor without a lift. For hygiene reasons, it compulsory to buy the mattress cover for €80.',
      metaTitle: 'Walking frame + wheelchair + single bed - Mia Medical Italia',
      metaDescription: 'Combined hire of a walking frame, a wheelchair and a bed with a pressure-relief mattress. The right set for recovery after a hip fracture.',
      description: [
        '<h4><strong>Combined Rental of a Walker, Wheelchair and 1-Square Orthopaedic Bed</strong></h4>',
        '<p><strong>The complete solution for home care, in-patient care and rehabilitation</strong></p>',
        '<p>In the event of reduced motor autonomy, whether temporary or prolonged, it is essential to be able to rely on&nbsp;<strong>appropriate, safe and compatible medical aids</strong>. The service of&nbsp;<strong>combined rental Mia Medical Italia</strong>&nbsp;it is created to meet a practical need: to offer&nbsp;<strong>a complete package of professional medical devices</strong>, already configured to work together, reducing time, costs and organisational difficulties.</p>',
        '<p>This formula is designed to allow the patient to&nbsp;<strong>staying in one\'s home environment</strong>, while guaranteeing&nbsp;<strong>high standards of care</strong>, comparable to those of a healthcare facility.</p>',
        '<h3><strong>Who is the combined rental of a walking frame, wheelchair and single orthopaedic bed suitable for?</strong></h3>',
        '<p>The package is particularly suitable in all those cases where the patient presents:</p>',
        '<ul><li>partial or total restriction of mobility</li><li>difficulty in transferring from bed to chair</li><li>reduced muscle strength</li><li>need for assistance during the hospital stay</li><li>gradual rehabilitation pathway</li></ul>',
        '<p><strong>Main usage scenarios</strong></p>',
        '<ul><li><strong>Orthopaedic post-surgery</strong>&nbsp;such as hip fracture, hip replacement, knee replacement, spinal surgery</li><li><strong>Supported hospital discharge</strong></li><li><strong>Post-traumatic convalescence</strong></li><li><strong>Elderly patients with temporary loss of autonomy</strong></li><li><strong>Home rehabilitation followed by physiotherapist</strong></li><li><strong>Continuing care of bedridden patients</strong></li></ul>',
        '<p>The package allows you to&nbsp;<strong>managing all phases of the day</strong>rest, mobilisation, movement and functional recovery.</p>',
        '<h3><strong>What does the combined rental of a walker + wheelchair + orthopaedic bed consist of?</strong></h3>',
        '<p>The rental includes a complete set of professional medical aids, selected according to clinical, ergonomic and safety criteria.</p>',
        '<p><strong><a href="/en/product/noleggio-letto-ospedaliero-elettrico-incluso-di-materasso-antidecubito/">Electric orthopaedic single bed : 90 cm</a></strong></p>',
        '<p>Medical device designed for home care.</p>',
        '<p><strong>Main technical characteristics:</strong></p>',
        '<ul><li>slatted or articulated bed base</li><li>electrical movement by remote control</li><li>back and leg adjustment</li><li>height designed to facilitate the work of the carer</li><li><strong>safety side rails</strong>&nbsp;anti-fall</li><li><strong>Sick triangle</strong>&nbsp;to promote patient autonomy</li></ul>',
        '<p>The electric bed allows:</p>',
        '<ul><li>correct posture</li><li>prevention of complications from immobility</li><li>greater comfort during sleep</li><li>facilitation of hygiene and care manoeuvres</li></ul>',
        '<p><strong>PolyPlot anti-decubitus mattress</strong></p>',
        '<p>Essential device in patients confined to bed for prolonged periods.</p>',
        '<p><strong>Main function:</strong> reduction of pressure in risk areas (sacrum, heels, back).</p>',
        '<p><strong>Features:</strong></p>',
        '<ul><li>even body weight distribution</li><li>waterproof and breathable sanitary cover</li><li>easy sanitisation</li></ul>',
        '<p>Indispensable for the&nbsp;<strong>prevention of pressure sores</strong>&nbsp;and to improve the daily comfort of the patient.</p>',
        '<p><strong><a href="/en/rental-catalog/">Walker</a></strong></p>',
        '<p>Ausilio destined for the&nbsp;<strong>assisted mobilisation</strong>. It is selected according to:</p>',
        '<ul><li>patient weight</li><li>degree of balance</li><li>level of remaining autonomy</li><li>domestic environment (spaces, corridors, thresholds)</li></ul>',
        '<p>The walker allows:</p>',
        '<ul><li>gradual recovery of walking</li><li>reducing the risk of falls</li><li>increased safety during short journeys</li><li>home physiotherapy support</li></ul>',
        '<p><strong><a href="/en/rental-catalog/">Wheelchair</a></strong></p>',
        '<p>The wheelchair is essential for indoor and outdoor mobility. The choice of model is based on:</p>',
        '<ul><li>temporary or frequent use</li><li>autonomous or assisted pushing</li><li>seat width</li></ul>',
        '<p><strong>It allows:</strong></p>',
        '<ul><li>fatigue-free transfers</li><li>maintenance of social interaction and daily routine</li></ul>',
        '<h4><strong>Why choose the combined hire of a walking frame, wheelchair and single orthopaedic bed</strong></h4>',
        '<p>Combined rental allows</p>',
        '<ul><li>avoid buying expensive devices</li><li>have certified professional aids</li><li>adapt the duration to the actual clinical conditions</li><li>receive continuous technical support</li><li>reduce organisational stress for the family</li></ul>',
        '<p>It is the ideal solution when&nbsp;<strong>the length of stay is not predictable</strong>.</p>',
        '<h4><strong>Rental duration and available lump sums</strong></h4>',
        '<p><strong>Minimum rental: 7 days</strong></p>',
        '<figure><table><tbody><tr><td><strong>Duration</strong></td><td><strong>Price per day</strong></td></tr><tr><td>90 days</td><td>5,00 €</td></tr><tr><td>60 days</td><td>6,00 €</td></tr><tr><td>30 days</td><td>7,30 €</td></tr><tr><td>15 days</td><td>12,00 €</td></tr></tbody></table></figure>',
        '<ul><li>Prices incl. VAT</li><li>No hidden costs</li><li>No security deposit</li><li>Promotions only valid for online orders</li></ul>',
        '<p>It is always possible&nbsp;<strong>extending the rental</strong>&nbsp;depending on how the recovery goes.</p>',
        '<h4><strong>Delivery, assembly and collection</strong></h4>',
        '<ul><li><strong>Home delivery in Rome and Florence</strong>&nbsp;as of&nbsp;<strong>65 €</strong></li><li><strong>Delivery and collection from warehouse: FREE</strong></li><li>assembly included and explanation of operation</li></ul>',
        '<p>At the end of the rental period we also take care of the&nbsp;<strong>withdrawal of aids</strong>.</p>',
        '<h3><strong>Free advice and ongoing support</strong></h3>',
        '<p>Every clinical situation is different, which is why the Mia Medical Italia team offers a&nbsp;<strong>free personalised consultancy</strong>, to help you choose the solution that best suits your needs. Call us now at&nbsp;<strong><a href="https://wa.me/393926509237">+39 392 6509237</a> to request more information!</strong></p>',
        '<h4><strong>Why choose Mia Medical Italia</strong></h4>',
        '<ul><li>established experience in the medical sector</li><li>certified and sanitised aids</li><li>real, non-automated assistance</li><li>no security deposit</li><li>rapid delivery</li><li>customised solutions</li><li>human support at a delicate time</li></ul>',
        '<p>With Mia Medical Italia you don\'t just rent devices<strong>&nbsp;but we build a safe, functional and tailor-made care path together.</strong></p>',
      ].join(''),
    },
  },

  specs: {
    'total-width': { min: 90, max: 90 },
    'includes-mattress': true,
  },

  media: {
    thumbnail: 'walker-wheelchair-and-bed-1.jpg',
    gallery: [
      'walker-wheelchair-and-bed-2.jpg',
      { file: 'walker-wheelchair-and-bed-3.jpg', alt: { it: 'Affitto carrozzina pieghevole ad autospinta' } },
      'walker-wheelchair-and-bed-4.jpg',
      'walker-wheelchair-and-bed-5.jpg',
    ],
  },

  addons: [homeDelivery(65)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
