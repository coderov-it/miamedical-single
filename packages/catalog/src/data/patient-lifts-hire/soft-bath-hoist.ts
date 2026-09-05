/**
 * Noleggio sollevatore elettrico SOFT da bagno
 *
 * /prodotto/noleggio-sollevatore-elettrico-soft-pieghevole-da-bagno/
 * WooCommerce product 12347 — the folding bath hoist, and the one product in the
 * category that states its own size: "Larghezza da aperto: 63 cm – passa
 * facilmente in porte da 53 cm", 73 cm long, 28 kg.
 *
 * Delivery from 45 €, free from 45 days. No deposit.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { patientLiftsHire } from './category.ts';

export const softBathHoist = patientLiftsHire.rental({
  code: 'soft-bath-hoist',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 100),
    days(30, 160),
    days(45, 200),
    days(60, 240),
  ],

  translations: {
    it: {
      title: 'Noleggio sollevatore elettrico SOFT da bagno',
      slug: 'noleggio-sollevatore-elettrico-soft-pieghevole-da-bagno',
      shortDescription: 'Noleggio sollevatore elettrico con seduta ed imbracatura. Consegna a Roma e Firenze a partire da 45€. Consegna gratuita per i noleggi da 45 giorni ! Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Noleggio sollevatore elettrico da bagno | Lazio e Toscana',
      metaDescription: 'Servizio di noleggio sollevatore elettrico da bagno per anziani e persone con disabilità. Pieghevole, sicuro e compatto con consegna rapida',
      description: [
        '<h2>Noleggio sollevatore elettrico da bagno per anziani e disabili</h2>',
        '<p>Il servizio di <strong>noleggio e affitto sollevatore elettrico da bagno</strong> SOFT pieghevole è pensato per anziani e persone con disabilità che necessitano di un supporto sicuro per gli spostamenti quotidiani. Questo <strong>ausilio</strong> consente di accompagnare facilmente il paziente dal letto alla carrozzina, al bagno o all’auto, garantendo comfort, sicurezza e facilità d’uso anche in ambienti piccoli.</p>',
        '<h2>Caratteristiche tecniche del sollevatore SOFT per anziani</h2>',
        '<p>Il servizio di <strong>noleggio sollevatore elettrico da bagno</strong> SOFT è progettato per garantire massima sicurezza e praticità anche negli ambienti domestici più piccoli.</p>',
        '<ul><li><strong>Sistema di sollevamento elettrico con comando manuale</strong></li><li><strong>Imbracatura morbida, confortevole e lavabile</strong></li><li><strong>Struttura pieghevole</strong>&nbsp;– solo&nbsp;<strong>27 cm di profondità</strong>&nbsp;da chiuso</li><li><strong>Altezza regolabile</strong>&nbsp;da 40 a 73 cm</li><li><strong>Larghezza da aperto</strong>: 63 cm –&nbsp;<strong>passa facilmente in porte da 53 cm</strong></li><li><strong>Lunghezza</strong>: 73 cm</li><li><strong>Peso del dispositivo</strong>: 28 kg</li><li><strong>Portata massima</strong>: 150 kg</li><li><strong>Ruote piroettanti</strong>&nbsp;per una manovrabilità facilitata</li><li><strong>Ingombro ridotto</strong> – Il servizio di <strong>noleggio sollevatore elettrico da bagno</strong> SOFT è ideale per chi necessita di un supporto pratico e immediato in casa o in struttura sanitaria.</li></ul>',
        '<h2>A chi è rivolto il noleggio sollevatore elettrico da bagno SOFT</h2>',
        '<p>Il <strong>noleggio sollevatore elettrico da bagno per anziani e disabili</strong> è quindi ideale sia per uso domestico che professionale.</p>',
        '<p>Il sollevatore SOFT è pensato per:</p>',
        '<ul><li>Chi ha bisogno di un ausilio per accompagnare in auto un assistito</li><li>Famiglie che assistono persone con disabilità o difficoltà motorie in casa</li><li>Strutture sanitarie, case di cura o RSA</li><li>Operatori domiciliari e caregiver professionali</li><li>Studi di fisioterapia e ambienti riabilitativi: Il <strong>noleggio sollevatore elettrico da bagno per anziani e disabili</strong> rappresenta una soluzione flessibile per ogni tipo di assistenza.</li></ul>',
        '<h2>Attività quotidiane per cui il sollevatore elettrico da bagno per anziani o persone con disabilità è di aiuto </h2>',
        '<ul><li><em>Movimentare la&nbsp;persona&nbsp;dal letto, facendola alzare o adagiare su di esso</em></li><li><em>Accompagnare la persona&nbsp;in bagno</em></li><li><em>&nbsp;Far sedere o spostare la persona&nbsp;dalla&nbsp;poltrona, sedia, sedia comoda e carrozzina</em></li><li><em>Trasferire la persona all’interno dell’abitazione</em></li><li><em>Trasferire della persona in auto o all’interno dell’abitazione</em></li></ul>',
        '<p>Grazie al servizio di <strong>noleggio sollevatore elettrico da bagno</strong>, tutte queste operazioni diventano più semplici e sicure.</p>',
        '<h3>Scopri il nostro catologo</h3>',
        '<p>Scopri sul nostro sito tutti i modelli e gli ausili disponibili nel servizio di <strong>noleggio sollevatore elettrico da bagno</strong> e altri dispositivi per la mobilità<strong>: strumenti pensati per accompagnare ogni giorno le persone verso una nuova autonomia.</strong></p>',
        '<p>Ogni giorno ci impegniamo per fornire ai nostri clienti tutti gli strumenti necessari per l’assistenza a domicilio, in modo che possano ricevere le cure necessarie circondati dall’affetto dei propri cari. </p>',
        '<p>I nostri ausili vengono attentamente selezionati dai migliori fornitori in modo da garantire un <strong>servizio di altissima qualità, con assistenza costante da parte dei nostri professionisti, consegna a domicilio rapida, in 24/48h.</strong><br />Disponiamo di un’ampia gamma di ausili per la mobilità pensati per anziani e persone con disabilità. <br />Chiamaci al +39 392 65 09 237!</p>',
        '<h3>Perché scegliere il servizio di noleggio di M.I.A. Medical Italia come tuo alleato?</h3>',
        '<p>Scegliendo Mia Medical Italia per il tuo noleggio sollevatore elettrico da bagno:</p>',
        '<ul><li>Hai&nbsp;<strong>assistenza personalizzata</strong>&nbsp;e consegna del dispositivo direttamente in&nbsp;<strong>clinica, ospedale o appartamento</strong>.</li><li>Trovi dispositivi&nbsp;<strong>igienizzati, sicuri e controllati</strong>&nbsp;da personale qualificato.</li><li>Hai&nbsp;<strong>supporto locale immediato</strong>, sia a Roma che a Firenze.</li><li>Prenoti in modo facile, con tariffe trasparenti e opzioni flessibili anche per più giorni.</li><li><strong><a href="https://www.morettispa.com/prodotto/sollevatore-elettrico-muevo-home-portata-max-135-kg-copia/">Dispositivi di ultima generazione e migliore qualità sul mercato</a></strong></li></ul>',
        '<blockquote><p>Il nostro servizio di <strong>noleggio sollevatore elettrico da bagno</strong> è attivo con consegna rapida in 24/48h.</p></blockquote>',
        '<h4>Come Contattarci&nbsp;</h4>',
        '<p><strong><a href="https://wa.me/393926509237">Contattaci</a></strong> oggi per la disponibilità e preventivo. Inoltre, se ancora non ti abbiamo convinto, chiamaci subito al numero <strong><a href="https://wa.me/393926509237">+39 392 65 09 237.</a></strong></p>',
        '<p><a href="/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*hr9jjl*_up*MQ..*_ga*MTUxMzgwNzg3Ni4xNzQ0NDY0NDE1*_ga_D9FZ9V3LL7*MTc0NDQ2NDQxNC4xLjEuMTc0NDQ2NDc5MC4wLjAuMA..">Nota bene: consulta le nostre condizioni di noleggio</a>.</p>',
      ].join(''),
    },
    en: {
      title: 'SOFT folding electric bath hoist, for hire',
      slug: 'noleggio-sollevatore-elettrico-soft-pieghevole-da-bagno',
      shortDescription: 'Hire of electric hoist with seat and sling. Delivery in Rome and Florence from €45. Free delivery for 45-day rentals! No deposit required. Delivery and collection from the warehouse are FREE!',
      metaTitle: 'Electric bath hoist hire | Lazio and Tuscany',
      metaDescription: 'Electric bath hoist hire for older and disabled users. Folding, safe and compact, with delivery.',
      description: [
        '<h2>Electric bathroom hoist hire for the elderly and disabled</h2>',
        '<p>The service of <strong>electric bathroom hoist hire and rental</strong> The foldable SOFT is designed for the elderly and people with disabilities who need secure support for their daily movements. This <strong>help</strong> It makes it easy to transfer the patient from the bed to a wheelchair, the bathroom or a car, ensuring comfort, safety and ease of use even in confined spaces.</p>',
        '<h2>Technical features of the SOFT lift for elderly people</h2>',
        '<p>The service of <strong>electric bathroom hoist hire</strong> SOFT is designed to guarantee maximum safety and practicality even in the smallest domestic environments.</p>',
        '<ul><li><strong>Electric lifting system with manual control</strong></li><li><strong>Soft, comfortable and washable harness</strong></li><li><strong>Folding structure</strong>&nbsp;- only&nbsp;<strong>27 cm deep</strong>&nbsp;when closed</li><li><strong>Adjustable height</strong>&nbsp;40 to 73 cm</li><li><strong>Width when open</strong>: 63 cm -&nbsp;<strong>passes easily through 53 cm doors</strong></li><li><strong>Length</strong>73 cm</li><li><strong>Device weight</strong>28 kg</li><li><strong>Maximum flow rate</strong>150 kg</li><li><strong>Swivel castors</strong>&nbsp;for easy manoeuvrability</li><li><strong>Small footprint</strong> – The service of <strong>electric bathroom hoist hire</strong> SOFT is ideal for anyone who needs practical and immediate support at home or in a healthcare facility.</li></ul>',
        '<h2>Who is the SOFT electric bath lift rental for?</h2>',
        '<p>The <strong>electric bath lift hire for the elderly and disabled</strong> it is therefore ideal for both domestic and professional use.</p>',
        '<p>The SOFT lift is designed for:</p>',
        '<ul><li>Who needs an aid to accompany an assisted person in the car</li><li>Families caring for persons with disabilities or mobility difficulties at home</li><li>Healthcare facilities, nursing homes or RSAs</li><li>Home care workers and professional caregivers</li><li>Physiotherapy practices and rehabilitation centres: The <strong>electric bath lift hire for the elderly and disabled</strong> It offers a flexible solution for all types of support.</li></ul>',
        '<h2>Daily activities for which the electric bath lift for the elderly or people with disabilities is helpful </h2>',
        '<ul><li><em>Moving the person from the bed, making them stand up or lie on it</em></li><li><em>Accompanying the person to the bathroom</em></li><li><em>&nbsp;Sitting or moving the person from the chair, comfy chair and wheelchair</em></li><li><em>Moving the person inside the home</em></li><li><em>Transferring a person into a car or inside the home</em></li></ul>',
        '<p>Thanks to the service provided by <strong>electric bathroom hoist hire</strong>, all these operations become simpler and safer.</p>',
        '<h3>Browse our catalogue</h3>',
        '<p>Find out on our website about all the models and aids available as part of the <strong>electric bathroom hoist hire</strong> and other mobility devices<strong>: tools designed to support people every day on their journey towards a new sense of independence.</strong></p>',
        '<p>Every day we strive to provide our customers with all the tools they need for home care, so that they can receive the care they need surrounded by the affection of their loved ones. </p>',
        '<p>Our aids are carefully selected from the best suppliers in order to guarantee a <strong>top quality service, with constant assistance from our professionals, fast home delivery in 24/48 hours.</strong><br />We have a wide range of mobility aids designed for the elderly and people with disabilities. <br />Call us on +39 392 65 09 237!</p>',
        '<h3>Why choose M.I.A. Medical Italia\'s rental service as your partner?</h3>',
        '<p>By choosing Mia Medical Italia for your electric bathroom hoist hire:</p>',
        '<ul><li>Hai&nbsp;<strong>personalised assistance</strong>&nbsp;and delivery of the device directly to&nbsp;<strong>clinic, hospital or flat</strong>.</li><li>Find devices&nbsp;<strong>sanitised, safe and controlled</strong>&nbsp;by qualified personnel.</li><li>Hai&nbsp;<strong>immediate local support</strong>in both Rome and Florence.</li><li>Book easily, with transparent rates and flexible options even for several days.</li><li><strong><a href="https://www.morettispa.com/prodotto/sollevatore-elettrico-muevo-home-portata-max-135-kg-copia/">Latest generation devices and best quality on the market</a></strong></li></ul>',
        '<blockquote><p>Our service of <strong>electric bathroom hoist hire</strong> it is active with fast delivery in 24/48h.</p></blockquote>',
        '<h4>How to contact us&nbsp;</h4>',
        '<p><strong><a href="https://wa.me/393926509237">Contact us</a></strong> today for availability and quotation. Also, if we still haven\'t convinced you, call us now at <strong><a href="https://wa.me/393926509237">+39 392 65 09 237.</a></strong></p>',
        '<p><a href="/en/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*hr9jjl*_up*MQ..*_ga*MTUxMzgwNzg3Ni4xNzQ0NDY0NDE1*_ga_D9FZ9V3LL7*MTc0NDQ2NDQxNC4xLjEuMTc0NDQ2NDc5MC4wLjAuMA..">Please note: see our rental conditions</a>.</p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 150,
    weight: { min: 28, max: 28 },
    'total-width': { min: 63, max: 63 },
    'total-length': { min: 73, max: 73 },
    'has-seat': true,
    'includes-sling': true,
    foldable: true,
  },

  media: {
    thumbnail: { file: 'soft-bath-hoist-1.jpg', alt: { it: 'Noleggio sollevatore elettrico da bagno per anziani e disabili' } },
    gallery: [
      { file: 'soft-bath-hoist-2.jpg', alt: { it: 'sollevatore up soft mia medical' } },
      'soft-bath-hoist-3.jpeg',
      'soft-bath-hoist-4.jpg',
    ],
  },

  addons: [homeDelivery(45)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
