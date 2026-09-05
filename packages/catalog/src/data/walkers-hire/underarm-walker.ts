/**
 * Noleggio Deambulatore con sotto ascellare
 *
 * /prodotto/noleggio-deambulatore-con-sotto-ascellare-firenza-e-provincia-roma-e-provincia/
 * WooCommerce product 9073 — one of the two walkers with a real attribute table:
 *
 *   Width  53 cm   Length  72 cm   Transport width  17 cm
 *   Length of transport  74 cm     Maximum capacity  130 Kg
 *   Heights  Struttura 88 cm - Barra 94 cm
 *
 * `handle-height` keeps that last line as the shop wrote it: two heights on one
 * line are not the ends of a range.
 *
 * `dismountable` and NOT `foldable`: the page says "Struttura in acciaio
 * smontabile: per facilitare lo stoccaggio e il trasporto". It comes apart; it
 * does not fold, and the transport dimensions in the table are of the parts.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { walkersHire } from './category.ts';

export const underarmWalker = walkersHire.rental({
  code: 'underarm-walker',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 100),
  ],

  translations: {
    it: {
      title: 'Noleggio Deambulatore con sotto ascellare',
      slug: 'noleggio-deambulatore-con-sotto-ascellare-firenza-e-provincia-roma-e-provincia',
      shortDescription: 'Consegna a Roma e Firenze a partire da 30€. Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Noleggio deambulatore ascellare Roma ProvinciaFirenze Provincia',
      metaDescription: 'Noleggio del Deambulatore Ascellare o Antibracchiale a Roma e provincia e Firenze e provincia. Consegna a domicilio. Super offerte più noleggi meno paghi!',
      description: [
        '<p><strong>Noleggio del Deambulatore con sotto ascellare a Roma e Provincia e a Firenze e Provincia per la fisioterapia domiciliare.</strong></p>',
        '<p>Se cerchi un ausilio pensato per la deambulazione in ambienti interni, il nostro&nbsp;<strong>deambulatore con sotto ascellari&nbsp;</strong>è la soluzione ideale per te. Progettato per garantire stabilità e facilità d’uso, questo dispositivo si adatta perfettamente alle esigenze di chi desidera muoversi in sicurezza all’interno della propria abitazione.</p>',
        '<h4>Cosa è un Deambulatore con Sotto-ascellari regolabili?</h4>',
        '<p>Si tratta di un ausilio per la mobilità realizzato con:</p>',
        '<ul><li><strong>Struttura in acciaio smontabile:</strong>&nbsp;Per facilitare lo stoccaggio e il trasporto, senza rinunciare alla robustezza.</li><li><strong>4 ruote piroettanti, di cui 2 con freno</strong></li><li><strong>Regolazione in altezza degli ascellari:</strong>&nbsp;Grazie alle apposite maniglie, potrai impostare l’altezza ideale per un supporto confortevole e personalizzato.</li><li><strong>Accessorio opzionale – Sedile removibile:</strong>&nbsp;Per concederti una pausa quando ne hai più bisogno, senza rinunciare alla praticità.</li></ul>',
        '<h4>A chi è indicato il Noleggio del Deambulatore con Sotto-ascellari ?</h4>',
        '<p>Il nostro servizio di Noleggio di deambulatori su Roma e Firenze è perfetto per:</p>',
        '<ul><li><strong>Persone con difficoltà di mobilità</strong>&nbsp;che necessitano di un supporto stabile per gli spostamenti interni.</li><li>• <strong>Pazienti in riabilitazione</strong>&nbsp;o in fase post-operatoria che richiedono un ausilio temporaneo.</li><li>• <strong>Anziani o soggetti con problemi di equilibrio</strong>&nbsp;che desiderano muoversi in sicurezza all’interno della casa.</li></ul>',
        '<p>Il post-intervento è una fase importante finalizzata al recupero della mobilità e delle giuste funzionalità. Sei il caregiver di una persona anziana o di una persona non autosufficiente e hai bisogno di un aiuto, il nostro <strong>infermiere</strong> di fiducia <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> è specializzato nel campo dell’assistenza domiciliare, ed è pronto ad affiancarti per portare avanti le cure dal comfort della tua abitazione. <br /><a href="/?_gl=1%2A1hga37n%2A_up%2AMQ..%2A_ga%2AMTk4NTM1MjI4Mi4xNzQyMDMxMTI4%2A_ga_D9FZ9V3LL7%2AMTc0MjAzMTEyNy4xLjEuMTc0MjAzMTE3My4wLjAuMA..">Non dimenticare di visitare il nostro sito per scoprire tutti i dispositivi medicali a noleggio o in vendita pensati per ogni esigenza dei nostri clienti,</a> massima sicurezza e confort per <strong>riacquistare autonomia con Mia Medical!</strong></p>',
        '<h4>I Benefici del Deambulatore con Sotto-Ascellari Regolabili a Noleggio | Roma e Firenze </h4>',
        '<ul><li><strong>Maggiore stabilità e sicurezza</strong>&nbsp;durante la camminata.</li><li><strong>Riduzione della fatica</strong>&nbsp;grazie al supporto dei sotto-ascellari.</li><li><strong>Minor carico su mani, polsi e spalle</strong>, ideale per chi ha difficoltà a impugnare un normale deambulatore.</li><li><strong>Facilità di movimento</strong>, anche per spostamenti prolungati.</li><li><strong>Adatto per interni ed esterni</strong>, grazie alle ruote manovrabili.</li></ul>',
        '<h4><strong>Perché Noleggiare un Deambulatore invece di Acquistarlo?</strong></h4>',
        '<p>Il&nbsp;<strong>noleggio di un deambulatore con sotto-ascellari</strong> è una scelta intelligente se hai bisogno di un ausilio solo per un periodo limitato, ad esempio durante un recupero post-operatorio o una riabilitazione. I principali vantaggi sono:</p>',
        '<ul><li><strong>Risparmio economico</strong>&nbsp;rispetto all’acquisto.</li><li><strong>Massima flessibilità</strong>: puoi usarlo solo per il tempo necessario.</li><li><strong>Nessuna manutenzione</strong>: il dispositivo viene fornito igienizzato e pronto all’uso.</li><li><strong>Possibilità di sostituzione o upgrade</strong>&nbsp;se cambiano le tue esigenze.</li><li>Assistenza da parte dei nostri tecnici specializzati, pronti ad aiutarvi per ogni evenienza! </li></ul>',
        '<p><strong><a href="/catalogo-noleggio/">Scopri tutte le opzioni di noleggio disponibili per la vasta gamma di Deambulatori Mia Medical</a></strong> e <strong><a href="https://wa.me/393926509237">contattaci ora</a></strong> per prenotare il tuo! Puoi anche leggere il nostro <a href="/come-si-scegli-il-deambulatore-giusto/">articolo-guida</a> alla scelta del Deambulatore che si adatta meglio alle tue necessità!</p>',
        '<h4>Perché Scegliere Mia Medical?</h4>',
        '<p>Con il nostro <strong>servizio di noleggio</strong>, potrai beneficiare di una <strong>consulenza personalizzata</strong> e di un prodotto di <strong>alta qualità</strong>, ideale per rispondere alle tue specifiche esigenze di <strong>mobilità interna</strong>. <strong><a href="/?_gl=1%2A1hga37n%2A_up%2AMQ..%2A_ga%2AMTk4NTM1MjI4Mi4xNzQyMDMxMTI4%2A_ga_D9FZ9V3LL7%2AMTc0MjAzMTEyNy4xLjEuMTc0MjAzMTE3My4wLjAuMA..">Affidati a noi per muoverti in tutta sicurezza e comfort, senza complicazioni.</a></strong></p>',
        '<p><strong>Contattaci ora</strong>&nbsp;per maggiori informazioni o per prenotare il tuo deambulatore per uso interno!</p>',
      ].join(''),
    },
    en: {
      title: 'Underarm walking frame for hire',
      slug: 'noleggio-deambulatore-con-sotto-ascellare-firenza-e-provincia-roma-e-provincia',
      shortDescription: 'Delivery in Rome and Florence from 30€. No deposit required. Delivery and collection from the warehouse are FREE!',
      metaTitle: 'Underarm walker hire | Rome and Florence and their provinces',
      metaDescription: 'Hire an underarm or forearm walking frame in Rome and Florence and their provinces. Delivered to the door.',
      description: [
        '<p><strong>Rental of walking frame with underarm in Rome and Province and in Florence and Province for home physiotherapy.</strong></p>',
        '<p>If you are looking for an aid designed for indoor walking, our&nbsp;<strong>walker with underarm&nbsp;</strong>is the ideal solution for you. Designed for stability and ease of use, this device is perfectly suited to the needs of those who want to move around their home safely.</p>',
        '<h4>What is a Walker with Adjustable Underjaw?</h4>',
        '<p>It is a mobility aid made with:</p>',
        '<ul><li><strong>Removable steel frame:</strong>&nbsp;For easy storage and transport, without sacrificing robustness.</li><li><strong>4 swivel castors, 2 with brake</strong></li><li><strong>Underarm height adjustment:</strong>&nbsp;Thanks to the special handles, you can set the ideal height for comfortable and customised support.</li><li><strong>Optional accessory - Removable seat:</strong>&nbsp;To give yourself a break when you need it most, without sacrificing practicality.</li></ul>',
        '<h4>To whom is the Rental of a Walker with Sub-axles indicated?</h4>',
        '<p>Our walker rental service in Rome and Florence is perfect for:</p>',
        '<ul><li><strong>People with mobility difficulties</strong>&nbsp;who need a stable support for internal movements.</li><li>- <strong>Rehabilitation patients</strong>&nbsp;or in the post-operative phase requiring temporary support.</li><li>- <strong>Elderly people or those with balance problems</strong>&nbsp;who wish to move safely within the house.</li></ul>',
        '<p>Post-surgery is an important phase aimed at recovering mobility and proper function. Are you the caregiver of an elderly or dependent person and need help, our <strong>nurse</strong> trustworthy <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> specialises in home care, and is ready to support you in carrying out care from the comfort of your own home. <br /><a href="/en/?_gl=1%2A1hga37n%2A_up%2AMQ..%2A_ga%2AMTk4NTM1MjI4Mi4xNzQyMDMxMTI4%2A_ga_D9FZ9V3LL7%2AMTc0MjAzMTEyNy4xLjEuMTc0MjAzMTE3My4wLjAuMA..">Don\'t forget to visit our website to discover all the medical devices for hire or sale designed for our customers\' every need,</a> maximum safety and comfort for <strong>regain autonomy with Mia Medical!</strong></p>',
        '<h4>The Benefits of a Walker with Adjustable Under-legs for Hire | Rome and Florence </h4>',
        '<ul><li><strong>Greater stability and security</strong>&nbsp;during the walk.</li><li><strong>Reducing fatigue</strong>&nbsp;thanks to the support of the sub-axillaries.</li><li><strong>Less load on hands, wrists and shoulders</strong>ideal for those who have difficulty holding a normal walker.</li><li><strong>Ease of movement</strong>even for longer journeys.</li><li><strong>Suitable for indoor and outdoor use</strong>thanks to manoeuvrable wheels.</li></ul>',
        '<h4><strong>Why rent a walker instead of buying one?</strong></h4>',
        '<p>The&nbsp;<strong>rental of a walker with sub-axillary</strong> is a smart choice if you only need an aid for a limited period, e.g. during post-operative recovery or rehabilitation. The main advantages are:</p>',
        '<ul><li><strong>Saving money</strong>&nbsp;compared to the purchase.</li><li><strong>Maximum flexibility</strong>you can only use it for as long as necessary.</li><li><strong>No maintenance</strong>The device is delivered sanitised and ready for use.</li><li><strong>Possibility of replacement or upgrade</strong>&nbsp;if your needs change.</li><li>Assistance from our specialised technicians, ready to help you in any eventuality! </li></ul>',
        '<p><strong><a href="/en/rental-catalog/">Discover all the rental options available for Mia Medical\'s wide range of walkers</a></strong> e <strong><a href="https://wa.me/393926509237">contact us now</a></strong> to book yours! You can also read our <a href="/en/come-si-scegli-il-deambulatore-giusto/">article-guide</a> to choosing the walker that best suits your needs!</p>',
        '<h4>Why Choose Mia Medical?</h4>',
        '<p>With our <strong>rental service</strong>you will benefit from a <strong>personalised consultancy</strong> and a product of <strong>high quality</strong>ideal to meet your specific needs for <strong>internal mobility</strong>. <strong><a href="/en/?_gl=1%2A1hga37n%2A_up%2AMQ..%2A_ga%2AMTk4NTM1MjI4Mi4xNzQyMDMxMTI4%2A_ga_D9FZ9V3LL7%2AMTc0MjAzMTEyNy4xLjEuMTc0MjAzMTE3My4wLjAuMA..">Trust us to get you around safely and comfortably, without complications.</a></strong></p>',
        '<p><strong>Contact us now</strong>&nbsp;for more information or to book your walker for indoor use!</p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 130,
    'total-width': { min: 53, max: 53 },
    'total-length': { min: 72, max: 72 },
    'folded-width': 17,
    'folded-length': 74,
    'handle-height': { it: 'Struttura 88 cm, barra 94 cm', en: 'Frame 88 cm, bar 94 cm' },
    dismountable: true,
  },

  media: {
    thumbnail: 'underarm-walker-1.jpg',
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
