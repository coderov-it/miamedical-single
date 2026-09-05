/**
 * Vendita sollevatore elettrico SOFT da bagno
 *
 * /prodotto/vendita-sollevatore-elettrico-soft/
 * WooCommerce product 14126, 869,00 € — the same bath hoist the hire category
 * lists, and its page repeats the same four measurements, so they are recorded
 * here too.
 */

import { generalTerms } from '../shared/terms.ts';
import { patientLiftsSale } from './category.ts';

export const softBathHoistSale = patientLiftsSale.fixed({
  code: 'soft-bath-hoist-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 869,

  translations: {
    it: {
      title: 'Vendita sollevatore elettrico SOFT da bagno',
      slug: 'vendita-sollevatore-elettrico-soft',
      shortDescription: 'Non perdere l’Offerta speciale! Fino ad esaurimento scorte.',
      metaTitle: 'Vendita sollevatore elettrico SOFT da bagno - Mia Medical Italia',
      metaDescription: 'Sollevatore elettrico SOFT in vendita. Disponibilità immediata. Consegna rapida in 24/48h. Il miglior rapporto qualità prezzo sul mercato! Chiama ora.',
      description: [
        '<h4>Sollevatore elettrico SOFT per bagno e trasferimenti – pieghevole, compatto e facile da usare</h4>',
        '<p>Il <strong>sollevatore elettrico SOFT</strong> è un dispositivo medicale pensato per facilitare il sollevamento e il trasferimento di persone con ridotta mobilità, in totale comfort e sicurezza. Grazie alla sua <strong>morbida imbracatura</strong> e al <strong>sistema pieghevole a ingombro ridotto</strong>, è perfetto per l’utilizzo in ambienti domestici e professionali, anche con spazi limitati.</p>',
        '<p>Indicato per il trasferimento <strong>dal letto alla carrozzina, dal bagno alla poltrona</strong>, o per <strong>accompagnare una persona in auto</strong>, il SOFT è un ausilio essenziale per semplificare il lavoro di caregiver e familiari.</p>',
        '<h4>Caratteristiche tecniche del sollevatore SOFT</h4>',
        '<ul><li><strong>Sistema di sollevamento elettrico con comando manuale</strong></li><li><strong>Imbracatura morbida, confortevole e lavabile</strong></li><li><strong>Struttura pieghevole</strong> – solo <strong>27 cm di profondità</strong> da chiuso</li><li><strong>Altezza regolabile</strong> da 40 a 73 cm</li><li><strong>Larghezza da aperto</strong>: 63 cm – <strong>passa facilmente in porte da 53 cm</strong></li><li><strong>Lunghezza</strong>: 73 cm</li><li><strong>Peso del dispositivo</strong>: 28 kg</li><li><strong>Portata massima</strong>: 150 kg</li><li><strong>Ruote piroettanti</strong> per una manovrabilità facilitata</li><li><strong>Ingombro ridotto</strong> – ideale anche in ambienti piccoli</li></ul>',
        '<h4>A chi è rivolto il sollevatore elettrico SOFT</h4>',
        '<p>Il sollevatore SOFT è pensato per:</p>',
        '<ul><li>Famiglie che assistono persone con difficoltà motorie in casa</li><li>Strutture sanitarie, case di cura o RSA</li><li>Operatori domiciliari e caregiver professionali</li><li>Studi di fisioterapia e ambienti riabilitativi</li><li>Chi ha bisogno di un ausilio per accompagnare in auto un assistito</li></ul>',
        '<h4>Vendita e noleggio sollevatore elettrico SOFT: praticità, sicurezza e autonomia ogni giorno<br /></h4>',
        '<p>Avere a disposizione un sollevatore compatto e pieghevole come il <strong>SOFT</strong> migliora concretamente la vita quotidiana, sia per chi riceve assistenza sia per chi la presta. Grazie alla sua struttura leggera, maneggevole e alla <strong>morbida imbracatura</strong>, ogni trasferimento avviene in modo più semplice, sicuro e meno faticoso. Il sollevatore SOFT è una scelta strategica per chi ha bisogno di un <strong>ausilio versatile</strong>, facile da riporre e <strong>subito pronto all’uso</strong> in qualsiasi momento.</p>',
        '<p>Scopri sul nostro <strong><a href="/catalogo-noleggio/">sito tutti i modelli e gli ausili disponibili: strumenti pensati per accompagnare ogni giorno le persone verso una nuova autonomia.</a></strong></p>',
        '<p>Ogni giorno ci impegniamo per fornire ai nostri clienti tutti gli strumenti necessari per l’assistenza a domicilio, in modo che possano ricevere le cure necessarie circondati dall’affetto dei propri cari. <strong>Scegli i servizi di vendita e noleggio M.I.A. Medical Italia. </strong>I nostri ausili vengono attentamente selezionati dai migliori fornitori in modo da garantire un <strong>servizio di altissima qualità, con assistenza costante da parte dei nostri professionisti, consegna a domicilio rapida, in 24/48h.</strong></p>',
        '<h4>Contatti utili</h4>',
        '<p>Che aspetti! Chiamaci subito al +<strong>39 392 65 09 237</strong> per richiedere il tuo sollevatore oggi stesso! Inoltre, basterà mandarci un messaggio su <strong><a href="https://wa.me/393926509237">whatsapp</a></strong> per effettuare la <strong>prenotazione</strong> o per richiedere una <strong>consulenza gratuita</strong>. I nostri <strong>tecnici specializzati sono sempre pronti per eventuali chiarimenti o per guidarti, passo per passo, nella scelta del dispositivo che meglio si adatta alle tue necessità.</strong></p>',
      ].join(''),
    },
    en: {
      title: 'SOFT electric bath hoist for sale',
      slug: 'vendita-sollevatore-elettrico-soft',
      shortDescription: 'Do not miss the special offer! While stocks last.',
      metaTitle: 'SOFT electric bath hoist for sale - Mia Medical Italia',
      metaDescription: 'SOFT electric hoist for sale. Available immediately, delivered in 24–48 hours. The best quality for the money on the market.',
      description: [
        '<h4>SOFT electric hoist for baths and transfers - foldable, compact and easy to use</h4>',
        '<p>The <strong>SOFT electric hoist</strong> is a medical device designed to facilitate the lifting and transfer of persons with reduced mobility in total comfort and safety. Thanks to its <strong>soft harness</strong> and the <strong>space-saving folding system</strong>, It is perfect for use in home and professional environments, even with limited space.</p>',
        '<p>Suitable for transfer <strong>from bed to wheelchair, from bath to armchair</strong>or for <strong>accompanying a person in a car</strong>, SOFT is an essential aid to simplify the work of caregivers and family members.</p>',
        '<h4>Technical characteristics of the SOFT lift</h4>',
        '<ul><li><strong>Electric lifting system with manual control</strong></li><li><strong>Soft, comfortable and washable harness</strong></li><li><strong>Folding structure</strong> - only <strong>27 cm deep</strong> when closed</li><li><strong>Adjustable height</strong> 40 to 73 cm</li><li><strong>Width when open</strong>: 63 cm - <strong>passes easily through 53 cm doors</strong></li><li><strong>Length</strong>73 cm</li><li><strong>Device weight</strong>28 kg</li><li><strong>Maximum flow rate</strong>150 kg</li><li><strong>Swivel castors</strong> for easy manoeuvrability</li><li><strong>Small footprint</strong> - ideal even in small rooms</li></ul>',
        '<h4>Who the SOFT electric lift is for</h4>',
        '<p>The SOFT lift is designed for:</p>',
        '<ul><li>Families caring for people with mobility difficulties at home</li><li>Healthcare facilities, nursing homes or RSAs</li><li>Home care workers and professional caregivers</li><li>Physiotherapy practices and rehabilitation environments</li><li>Who needs an aid to accompany an assisted person in the car</li></ul>',
        '<h4>Sale and rental of SOFT electric hoist: practicality, safety and autonomy every day<br /></h4>',
        '<p>Having a compact, foldable lift like the <strong>SOFT</strong> concretely improves daily life, both for the care recipient and the caregiver. Thanks to its lightweight, manoeuvrable design and the <strong>soft harness</strong>, every transfer is easier, safer and less tiring. The SOFT lift is a strategic choice for those who need a <strong>versatile aid</strong>easy to store and <strong>immediately ready for use</strong> at any time.</p>',
        '<p>Find out about our <strong><a href="/en/rental-catalog/">site all available models and aids: tools designed to accompany people every day towards new autonomy.</a></strong></p>',
        '<p>Every day we strive to provide our customers with all the tools they need for home care, so that they can receive the care they need surrounded by the affection of their loved ones. <strong>Choose M.I.A. Medical Italia sales and rental services. </strong>Our aids are carefully selected from the best suppliers in order to guarantee a <strong>top quality service, with constant assistance from our professionals, fast home delivery in 24/48 hours.</strong></p>',
        '<h4>Useful contacts</h4>',
        '<p>What are you waiting for! Call us now at +<strong>39 392 65 09 237</strong> to request your lift today! In addition, simply send us a message on <strong><a href="https://wa.me/393926509237">whatsapp</a></strong> to carry out the <strong>booking</strong> or to request a <strong>free consultation</strong>. Our <strong>specialised technicians are always ready for clarification or to guide you, step by step, in choosing the device that best suits your needs.</strong></p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 150,
    weight: { min: 28, max: 28 },
    'total-width': { min: 63, max: 63 },
    'total-length': { min: 73, max: 73 },
    'has-seat': true,
    foldable: true,
  },

  media: {
    thumbnail: { file: 'soft-bath-hoist-1.jpg', alt: { it: 'Noleggio sollevatore elettrico da bagno per anziani e disabili' } },
    gallery: [
      'soft-bath-hoist-2.jpg',
      { file: 'soft-bath-hoist-3.jpg', alt: { it: 'sollevatore up soft mia medical' } },
      'soft-bath-hoist-4.jpeg',
    ],
  },
  terms: [generalTerms],
});
