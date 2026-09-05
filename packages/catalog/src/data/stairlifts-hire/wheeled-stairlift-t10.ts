/**
 * Noleggio Montascale a Ruote T10 a Roma e Firenze
 *
 * /prodotto/noleggio-montascale-a-ruote-roma-e-firenze/
 * WooCommerce product 12152 — the wheeled machine, and the only one of the three
 * that states a limit: "Peso max. utente: 120 kg". Its page is also the only one
 * to claim spiral staircases.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { stairliftsHire } from './category.ts';

export const wheeledStairliftT10 = stairliftsHire.rental({
  code: 'wheeled-stairlift-t10',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 105),
    days(15, 150),
    days(30, 240),
    days(45, 340),
    days(60, 420),
    days(90, 600),
  ],

  translations: {
    it: {
      title: 'Noleggio Montascale a Ruote T10 a Roma e Firenze',
      slug: 'noleggio-montascale-a-ruote-roma-e-firenze',
      shortDescription: 'Per la salita e discesa di tutti i tipi di scale, anche a chiocciola. Consegna a domicilio soltanto a Roma e Firenze a partire da 45€. Consegna gratis se acquisti un noleggio per un minimo di 45 giorni. Il ritiro e la riconsegna degli ausili in magazzino sono Gratuiti. Deposito richiesto: 300€ Per il noleggio di questo articolo è richiesto un deposito di 300€.',
      metaTitle: 'Noleggio montascale a ruote T10 mobile a Roma e Firenze',
      metaDescription: 'Noleggio Montascale a ruote T10. Consegna rapida. Migliore Prezzo Garantito. Fidati dei nostri esperti. Scopri i nostri prezzi imbattibili, con i forfait.',
      description: [
        '<p><strong>Noleggio Montascale Elettrico a Ruote T10 con consegna a domicilio a Roma e Firenze per sicurezza e libertà in ogni ambiente</strong></p>',
        '<p><strong>Ti sei mai trovato davanti a una scala e ti sei chiesto come superarla in sicurezza con una persona anziana o con mobilità ridotta?</strong><br />Il&nbsp;<strong>montascale a ruote T10</strong>&nbsp;è la risposta semplice, pratica ed efficace per superare ogni tipo di barriera architettonica, anche in ambienti con scale strette o gradini irregolari. <strong>Compatto, leggero e smontabile</strong>, è perfetto per l’uso in casa, in condominio o in viaggio. Con&nbsp;<strong>M.I.A. Medical Italia</strong>, puoi averlo a domicilio, pronto all’uso, in meno di 48 ore.</p>',
        '<h3><strong>Cos’è il montascale a ruote elettrico T10</strong> disponibile a noleggio a Roma e Firenze</h3>',
        '<p>Il&nbsp;<strong>T10</strong>&nbsp;è un&nbsp;<strong>montascale elettrico mobile</strong>, con&nbsp;<strong>seduta integrata imbottita</strong>&nbsp;e sistema di trasporto automatico su ruote motrici.</p>',
        '<p>Grazie al suo motore silenzioso e ai&nbsp;<strong>freni automatici</strong>, consente a un accompagnatore di trasportare facilmente l’assistito su e giù per le scale in totale sicurezza, anche in spazi complessi come:</p>',
        '<ul><li>scale&nbsp;<strong>strette fino a 55 cm</strong>;</li><li><strong>gradini a ventaglio</strong>&nbsp;o a chiocciola;</li><li><strong>pianerottoli piccoli</strong>&nbsp;(min. 70 cm).</li></ul>',
        '<p><strong>Non serve la carrozzina</strong>: l’assistito può accomodarsi direttamente sulla seduta del dispositivo.</p>',
        '<h3><strong>A chi è consigliato l’utilizzo del T10</strong></h3>',
        '<p>Il noleggio del montascale a ruote T10 è indicato per:</p>',
        '<ul><li><strong>Anziani</strong>&nbsp;con difficoltà motorie che vivono in edifici senza ascensore;</li><li>Persone che devono affrontare&nbsp;<strong>scale ripide o ambienti stretti</strong>;</li><li>Pazienti in fase di&nbsp;<strong>riabilitazione post-operatoria o post-traumatica</strong>;</li><li>Chi ha bisogno di una&nbsp;<strong>soluzione temporanea</strong>, per vacanze, visite, eventi;</li><li>Famiglie o caregiver che desiderano&nbsp;<strong>muoversi in sicurezza</strong>, senza installazioni fisse.</li></ul>',
        '<h4>Come si usa il montascale a ruote T10</h4>',
        '<p>Il T10 è&nbsp;<strong>gestito da un accompagnatore</strong>, che lo guida tramite un&nbsp;<strong>pannello comandi semplice e intuitivo</strong>.</p>',
        '<p>Per l’assistito, basta sedersi comodamente e appoggiare i piedi sulla pedana regolabile. I&nbsp;<strong>braccioli ribaltabili</strong>&nbsp;facilitano la salita e la discesa dal dispositivo. Il movimento è fluido e automatico: basta&nbsp;<strong>tenere premuto il selettore di marcia</strong>&nbsp;per superare ogni gradino in modo sicuro e senza scossoni.</p>',
        '<p><strong>Si smonta facilmente in 6 parti</strong>&nbsp;e può essere trasportato nel bagagliaio di un’auto.</p>',
        '<h4>Caratteristiche principali del montascale T10</h4>',
        '<ul><li><strong>Adatto a scale strette, chiocciola e gradini a ventaglio</strong></li><li><strong>Seduta integrata imbottita</strong>&nbsp;con poggiapiedi regolabile e braccioli ribaltabili</li><li><strong>Motore elettrico 24V</strong>&nbsp;silenzioso e affidabile</li><li><strong>Velocità</strong>: 12 gradini/minuto</li><li><strong>Autonomia</strong>: fino a&nbsp;<strong>200 gradini con una sola carica</strong></li><li><strong>Peso max. utente</strong>: 120 kg</li><li><strong>Smontabile in 6 parti</strong>, trasportabile anche in auto</li></ul>',
        '<p>Clicca <strong><a href="https://data2.manualslib.com/pdf7/222/22125/2212422-vimec/t10.pdf?e7f768d4f244eec38685ba315b9b3aa5">qui</a></strong> per la scheda tecnica completa.</p>',
        '<h3>Perché scegliere il noleggio del montascale a ruote T10</h3>',
        '<ul><li><strong>Eviti costi d’acquisto elevati</strong>&nbsp;per un uso temporaneo;</li><li><strong>Ricevi il montascale a domicilio</strong>, pronto all’uso e completo di dimostrazione;</li><li><strong>Scegli la durata del noleggio</strong>&nbsp;in base alle tue esigenze: da pochi giorni a diversi mesi;</li><li><strong>Manutenzione e assistenza tecnica</strong>&nbsp;incluse;</li><li><strong>Sanificazione professionale</strong>&nbsp;a ogni utilizzo;</li><li><strong>Prezzi trasparenti e competitivi</strong>, senza costi nascosti.</li></ul>',
        '<h2>Perchè scegliere il servizio di noleggio MIA Medical Italia</h2>',
        '<p>Offriamo un servizio di <strong>noleggio rapido su Roma e Firenze (anche 24/48h in base alla disponibilità)</strong> con <strong>personale qualificato</strong> per la <strong>consegna</strong> e <strong>istruzioni all’uso</strong>. Tutti i nostri <strong>ausili</strong> sono <strong>sicuri</strong> e <strong>certificati</strong>, inoltre arrivano nelle vostre case <strong>sanificati</strong> e pronti all’utilizzo! Forniamo anche <strong>assistenza</strong><strong>continua per tutta la durata del noleggio. <a href="https://wa.me/393926509237">Contattaci</a></strong> per un <strong>preventivo gratuito telefonico</strong> o una <strong>consulenza gratuita senza impegno</strong> per scoprirne di più sui nostri <strong><a href="/catalogo-noleggio/">montascale</a></strong> e scopri quale meglio si adatta alle tue esigenze!</p>',
        '<p>Inoltre, visita il nostro <strong><a href="/">sito</a></strong> per scoprire la vasta gamma di <strong>ausili medicali ed elettromedicali </strong>che abbiamo a disposizione sia a <strong>noleggio</strong> che in <strong>vendita</strong>, tra <a href="/catalogo-noleggio/">carrozzine</a>, <a href="/catalogo-noleggio/">scooter elettrici</a>, <a href="/catalogo-noleggio/">sollevatori</a>, <a href="/catalogo-noleggio/">verticalizzatori</a>, <a href="/catalogo-noleggio/">letti ortopedici</a>, <a href="/catalogo-noleggio/">carrozzine elettriche</a>, <a href="/catalogo-noleggio/">materassi anti decubito</a>, <a href="/catalogo-noleggio/">magneto terapia</a>, <a href="/catalogo-noleggio/">presso terapia</a> e <strong>molto altro. Che aspetti!</strong></p>',
        '<p><strong>Chiama il +39 392 65 09 237</strong></p>',
        '<p><strong><a href="https://wa.me/393926509237">Scrivici su WhatsApp</a></strong></p>',
        '<p>Oppure invia una mail a&nbsp;<strong>info@miamedicalitalia.it</strong></p>',
        '<p><strong>Ritrova la libertà e la sicurezza sulle scale. Scegli il T10, scegli M.I.A. Medical.</strong></p>',
      ].join(''),
    },
    en: {
      title: 'T10 wheeled stair climber, for hire, in Rome and Florence',
      slug: 'noleggio-montascale-a-ruote-roma-e-firenze',
      shortDescription: 'For ascending and descending all types of stairs, including spiral stairs. Home delivery only in Rome and Florence from €45. Free delivery if you purchase a rental for a minimum of 45 days. The collection and return of aids to the warehouse are Free. Deposit required: 300€ For the rental of this article, a deposit of 300€.',
      metaTitle: 'Mobile T10 wheeled stair climber hire in Rome and Florence',
      metaDescription: 'T10 wheeled stair climber hire. Quick delivery, best price guaranteed — trust our specialists.',
      description: [
        '<p><strong>T10 Electric Wheeled Stairlift Hire with home delivery in Rome and Florence for safety and freedom in any environment</strong></p>',
        '<p><strong>Have you ever stood in front of a ladder and wondered how to climb it safely with an elderly person or a person with reduced mobility?</strong><br />The&nbsp;<strong>T10 wheeled stairlift</strong>&nbsp;is the simple, practical and effective answer to overcome all kinds of architectural barriers, even in environments with narrow stairs or uneven steps. <strong>Compact, lightweight and demountable</strong>, It is perfect for use at home, in apartment buildings or on the road. With&nbsp;<strong>M.I.A. Medical Italy</strong>, you can have it at home, ready to use, in less than 48 hours.</p>',
        '<h3><strong>What is the T10 electric wheelchair lift?</strong> available for hire in Rome and Florence</h3>',
        '<p>The&nbsp;<strong>T10</strong>&nbsp;is a&nbsp;<strong>mobile electric stairlift</strong>with&nbsp;<strong>integrated upholstered seat</strong>&nbsp;and automatic transport system on driving wheels.</p>',
        '<p>Thanks to its silent motor and&nbsp;<strong>automatic brakes</strong>, It allows an attendant to easily transport the attendant up and down stairs in complete safety, even in complex spaces such as:</p>',
        '<ul><li>stairs&nbsp;<strong>narrow up to 55 cm</strong>;</li><li><strong>fan-shaped steps</strong>&nbsp;or spiral;</li><li><strong>small landings</strong>&nbsp;(min. 70 cm).</li></ul>',
        '<p><strong>No wheelchair needed</strong>The patient can sit directly on the seat of the device.</p>',
        '<h3><strong>To whom is the use of T10 recommended?</strong></h3>',
        '<p>Rental of the T10 wheeled stairlift is suitable for:</p>',
        '<ul><li><strong>Seniors</strong>&nbsp;with mobility difficulties who live in buildings without lifts;</li><li>People facing&nbsp;<strong>steep stairs or narrow rooms</strong>;</li><li>Patients undergoing&nbsp;<strong>post-operative or post-traumatic rehabilitation</strong>;</li><li>Who needs a&nbsp;<strong>temporary solution</strong>for holidays, visits, events;</li><li>Families or caregivers who wish&nbsp;<strong>moving safely</strong>without fixed installations.</li></ul>',
        '<h4>How to use the T10 wheelchair lift</h4>',
        '<p>The T10 is&nbsp;<strong>managed by an accompanying person</strong>guiding him through a&nbsp;<strong>simple and intuitive control panel</strong>.</p>',
        '<p>For the attendant, simply sit comfortably and rest your feet on the adjustable footplate. I&nbsp;<strong>folding armrests</strong>&nbsp;facilitate getting on and off the device. The movement is smooth and automatic: just&nbsp;<strong>hold down the gear selector</strong>&nbsp;to overcome each step safely and without jolting.</p>',
        '<p><strong>Easily disassembled into 6 parts</strong>&nbsp;and can be transported in the boot of a car.</p>',
        '<h4>Main features of the T10 stairlift</h4>',
        '<ul><li><strong>Suitable for narrow, spiral and fan-shaped stairs</strong></li><li><strong>Integrated upholstered seat</strong>&nbsp;with adjustable footrest and fold-down armrests</li><li><strong>24V electric motor</strong>&nbsp;silent and reliable</li><li><strong>Speed</strong>12 steps/minute</li><li><strong>Autonomy</strong>up to&nbsp;<strong>200 steps on a single charge</strong></li><li><strong>Max. user weight</strong>120 kg</li><li><strong>Can be disassembled into 6 parts</strong>, transportable even in a car</li></ul>',
        '<p>Click <strong><a href="https://data2.manualslib.com/pdf7/222/22125/2212422-vimec/t10.pdf?e7f768d4f244eec38685ba315b9b3aa5">here</a></strong> for the complete data sheet.</p>',
        '<h3>Why rent the T10 wheeled stairlift</h3>',
        '<ul><li><strong>Avoid high purchase costs</strong>&nbsp;for temporary use;</li><li><strong>Receive the stair lift at home</strong>, ready to use and complete with demonstration;</li><li><strong>Choose rental duration</strong>&nbsp;depending on your needs: from a few days to several months;</li><li><strong>Maintenance and technical assistance</strong>&nbsp;including;</li><li><strong>Professional sanitisation</strong>&nbsp;each use;</li><li><strong>Transparent and competitive prices</strong>with no hidden costs.</li></ul>',
        '<h2>Why choose the MIA Medical Italia rental service</h2>',
        '<p>We offer a service of <strong>quick rental in Rome and Florence (also 24/48h depending on availability)</strong> with <strong>qualified personnel</strong> for the <strong>delivery</strong> e <strong>instructions for use</strong>. All our <strong>aids</strong> are <strong>safe</strong> e <strong>certificates</strong>also arrive in your homes <strong>sanitised</strong> and ready to use! We also provide <strong>assistance</strong><strong>continues throughout the duration of the rental. <a href="https://wa.me/393926509237">Contact us</a></strong> for a <strong>free telephone quote</strong> or one <strong>free consultation without obligation</strong> to find out more about our <strong><a href="/en/rental-catalog/">stairlift</a></strong> and find out which one best suits your needs!</p>',
        '<p>Also, visit our <strong><a href="/en/">.</a></strong> to discover the wide range of <strong>medical and electromedical aids </strong>that we have available both at <strong>rental</strong> that in <strong>for sale</strong>, between <a href="/en/rental-catalog/">wheelchairs</a>, <a href="/en/rental-catalog/">electric scooters</a>, <a href="/en/rental-catalog/">lifters</a>, <a href="/en/rental-catalog/">verticalisers</a>, <a href="/en/rental-catalog/">orthopaedic beds</a>, <a href="/en/rental-catalog/">electric wheelchairs</a>, <a href="/en/rental-catalog/">anti-decubitus mattresses</a>, <a href="/en/rental-catalog/">magneto therapy</a>, <a href="/en/rental-catalog/">at therapy</a> e <strong>much more. What are you waiting for!</strong></p>',
        '<p><strong>Call +39 392 65 09 237</strong></p>',
        '<p><strong><a href="https://wa.me/393926509237">Write to us on WhatsApp</a></strong></p>',
        '<p>Or send an e-mail to&nbsp;<strong>info@miamedicalitalia.it</strong></p>',
        '<p><strong>Regain freedom and safety on the stairs. Choose T10, choose M.I.A. Medical.</strong></p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 120,
  },

  media: {
    thumbnail: 'wheeled-stairlift-t10-1.jpg',
    gallery: [
      'wheeled-stairlift-t10-2.jpg',
      'wheeled-stairlift-t10-3.jpg',
    ],
  },

  addons: [homeDelivery(45)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
