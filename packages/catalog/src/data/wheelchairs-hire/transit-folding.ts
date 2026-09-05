/**
 * Noleggio e Affitto carrozzina da transito pieghevole
 *
 * /prodotto/noleggio-carrozzina-pieghevole-da-transito/
 * WooCommerce product 9052. Hired in several seat sizes, which is why the seat
 * width and the weight are both spans: "La più piccola è di 40 cm fino ad
 * arrivare ad un massimo di 50cm" and "La più leggera pesa circa 14 kg, mentre la
 * più grande può pesare circa 18 kg".
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery, legRaiser } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const transitFolding = wheelchairsHire.rental({
  code: 'transit-folding',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(3, 25),
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 100),
  ],

  translations: {
    it: {
      title: 'Noleggio e Affitto carrozzina da transito pieghevole',
      slug: 'noleggio-carrozzina-pieghevole-da-transito',
      shortDescription: 'Carrozzina personalizzabile Carrozzina con seduta personalizzabile e telaio pieghevole per massima praticità. Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Consegna e ritiro a domicilio a Roma e Firenze da 30€. Il ritiro in magazzino è gratuito. Prenota online ora!',
      metaTitle: 'Noleggio sedia a rotelle pieghevole da transito in Toscana e Lazio',
      metaDescription: 'Noleggio sedia a rotelle pieghevole da transito a Roma e Firenze. Prenota online o al +393926509237. Consegna a domicilio. Disponibilità immediata.',
      description: [
        '<p>Il <strong>noleggio della sedia a rotelle pieghevole da transito</strong><strong>a Firenze e provincia e a Roma e provincia </strong>è indispensabile per le persone disabili, anziani, con ridotta capacità di deambulazione o per chi deve fare la riabilitazione.</p>',
        '<p>La carrozzina viene fornita con le <strong>pedane</strong> per i piedi ed i <strong>braccioli</strong>. Entrambi rimovibili in qualsiasi momento e con estrema facilità. Al momento della consegna un nostro tecnico vi farà vedere come chiudere e riaprire la sedia a rotelle e di conseguenza come montare e smontare braccioli e pedante. Inoltre la sedia a rotelle è dotata di due <strong>freni per poter bloccare le ruote.</strong></p>',
        '<p>Qualora dovesse avere un gesso o l&#8217;esigenza di tenere la <strong>gamba sollevata</strong> basta informarci.</p>',
        '<p>Noleggiamo carrozzina da transito in diverse sedute e misure di seduta. La più piccola è di 40 cm fino ad arrivare ad un massimo di 50cm.</p>',
        '<p>Il peso della sedia a rotelle può variare in base alla misura che si sceglie. La più leggera pesa circa 14 kg, mentre la più grande può pesare circa&nbsp; 18 kg.</p>',
        '<p>Ogni tipo di carrozzina da noi in noleggio è <strong>sanificata in ogni sua parte</strong>. Pulizia e sanificazione sono alla base del nostro lavoro!</p>',
        '<p>Il paziente passa molto tempo seduto sulla carrozzina? Per evitare che si vadano a formare delle piaghe da decubito puoi acquistare <a href="/prodotto/cuscino-antidecubito-in-fibra-cava-siliconata/">il cuscino antidecubito</a> ad un<strong> prezzo riservato</strong> esclusivamente a chi noleggia la sedia a rotelle.</p>',
        '<p>La carrozzina pieghevole da transito a noleggio è una carrozzina <strong>pieghevole</strong> e <strong>leggera</strong>, ma molto <strong>robusta</strong> che può portare un paziente con un peso fino a 130kg. Oltretutto la carrozzina è molto <strong>pratica</strong> da chiudere e riporre nel <strong>bagagliaio</strong> dell’auto.</p>',
        '<p>Le&nbsp;carrozzine di transito M.I.A. Medical Italia&nbsp; sono di ottima qualità e l&#8217;affitto e il noleggio della sedia a rotelle è sicuro, funzionale e garantito!</p>',
        '<p>Noleggiamo la sedia a rotelle pieghevole da transito sia nel <strong>Lazio</strong> che in <strong>Toscana</strong>.</p>',
        '<p><strong>Prenota online</strong> subito il noleggio della sedia a rotelle pieghevole da transito! Se preferisci puoi contattarci telefonicamente / via WhatsApp al <strong>+39 3926509237</strong> o tramite email: <strong>amministrazione@miamedicalitalia.it</strong></p>',
        '<p>Scopri la nostra pagine <a href="http://facebook.com/MIAMedicalitalia/">Facebook&nbsp;</a></p>',
      ].join(''),
    },
    en: {
      title: 'Folding transit wheelchair for hire',
      slug: 'noleggio-carrozzina-pieghevole-da-transito',
      shortDescription: 'Customisable wheelchair Wheelchair with customisable seat and folding frame for maximum convenience. Hire for 1 day: 15€ with pick-up on site only. Home delivery and pick-up in Rome and Florence from 30€. Collection from the warehouse is free of charge. Book online now!',
      metaTitle: 'Folding transit wheelchair hire | Rome and Florence',
      metaDescription: 'Hire a light, sturdy folding transit wheelchair carrying up to 130 kg, in seat sizes from 40 to 50 cm.',
      description: [
        '<p>The <strong>rental of the folding transit wheelchair</strong><strong>in Florence and its province and in Rome and its province </strong>is indispensable for people with disabilities, elderly people, people with reduced mobility or people who need rehabilitation.</p>',
        '<p>The wheelchair comes with the <strong>podiums</strong> for feet and <strong>armrests</strong>. Both can be easily removed at any time. Upon delivery, one of our technicians will show you how to close and re-open the wheelchair and how to fit and remove armrests and footrests. In addition, the wheelchair is equipped with two <strong>brakes in order to lock the wheels.</strong></p>',
        '<p>Should you have a cast or need to keep the <strong>raised leg</strong> just inform us.</p>',
        '<p>We rent transit wheelchairs in different seats and seat sizes. The smallest is 40 cm up to a maximum of 50 cm.</p>',
        '<p>The weight of the wheelchair may vary depending on the size you choose. The lightest weighs approximately 14 kg, while the largest can weigh approximately 18 kg.</p>',
        '<p>Every type of wheelchair we hire is <strong>sanitised in every part</strong>. Cleanliness and sanitisation are the basis of our work!</p>',
        '<p>Does the patient spend a lot of time sitting in the wheelchair? To prevent pressure sores from forming, you can buy <a href="/en/product/cuscino-antidecubito-in-fibra-cava-siliconata/">the anti-decubitus pillow</a> to a<strong> price reserved</strong> exclusively to wheelchair users.</p>',
        '<p>The folding transit wheelchair for hire is a wheelchair <strong>foldable</strong> e <strong>light</strong>but very <strong>robust</strong> which can carry a patient weighing up to 130kg. In addition, the wheelchair is very <strong>practice</strong> to be closed and stored in the <strong>boot</strong> of the car.</p>',
        '<p>M.I.A. Medical Italia transit wheelchairs are of excellent quality, and wheelchair hire and rental is safe, functional and guaranteed!</p>',
        '<p>We rent the folding transit wheelchair both in the <strong>Lazio</strong> that in <strong>Tuscany</strong>.</p>',
        '<p><strong>Book online</strong> transit folding wheelchair rental now! If you prefer, you can contact us by phone/via WhatsApp at <strong>+39 3926509237</strong> or by email: <strong>amministrazione@miamedicalitalia.it</strong></p>',
        '<p>Discover our pages <a href="http://facebook.com/MIAMedicalitalia/">Facebook&nbsp;</a></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'transit',
    'age-group': 'adult',
    'max-load': 130,
    weight: { min: 14, max: 18 },
    'seat-width': { min: 40, max: 50 },
    foldable: true,
    'removable-armrests': true,
    'removable-footrests': true,
    brakes: 'parking',
  },

  media: {
    thumbnail: { file: 'transit-folding-1.jpg', alt: { it: 'Carrozzina da transito o da autospinta' } },
    gallery: [
      'transit-folding-2.jpg',
    ],
  },

  addons: [homeDelivery(30), legRaiser],

  questions: [...hireIntake],
  terms: [generalTerms],
});
