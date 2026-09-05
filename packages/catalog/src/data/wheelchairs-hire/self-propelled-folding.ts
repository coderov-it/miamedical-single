/**
 * Affitto carrozzina pieghevole ad autospinta
 *
 * /prodotto/affitto-carrozzina-pieghevole-ad-autospinta-spedizioni-in-tutta-italia/
 * WooCommerce product 9079. The self-propelled counterpart of `transit-folding`,
 * with the same seat sizes, the same weights and the same seven prices; the large
 * rear wheels are what the page says sets them apart.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery, legRaiser } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const selfPropelledFolding = wheelchairsHire.rental({
  code: 'self-propelled-folding',
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
      title: 'Affitto carrozzina pieghevole ad autospinta',
      slug: 'affitto-carrozzina-pieghevole-ad-autospinta-spedizioni-in-tutta-italia',
      shortDescription: 'Sedia a rotelle ad autospinta Comoda e leggera, facile da caricare in macchina. Carrozzina con seduta e telaio pieghevole per massima praticità. Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Consegna e ritiro a domicilio a Roma e Firenze da 30€.',
      metaTitle: 'Affitto carrozzina pieghevole ad autospinta. Spedizioni in tutta Italia',
      metaDescription: 'Affitto carrozzina pieghevole ad autospinta. Molto leggera è facile da caricare in macchina. Spedizioni in tutta Italia, ritiro GRATUITO in magazzino.',
      description: [
        '<p>L&#8217;affitto della carrozzina pieghevole ad autospinta&nbsp;è <strong>indispensabile</strong> per le persone disabili, anziani, con ridotta capacità di deambulazione o per chi deve fare la riabilitazione.</p>',
        '<p>La carrozzina viene fornita con le <strong>pedane</strong> per i piedi e i <strong>braccioli</strong>. Entrambi removibili in qualsiasi momento e con estrema facilità. Al momento della consegna un <strong>nostro tecnico</strong> vi farà vedere come chiudere e riaprire la carrozzina pieghevole ad autospinta e di conseguenza come montare e smontare braccioli e pedane. <br />La sedia a rotelle è inoltre dotata di due <strong>freni</strong> per poter bloccare le ruote.</p>',
        '<p>Qualora dovesse avere un <strong>gesso</strong> o l&#8217;esigenza di tenere la gamba <strong>sollevata</strong> basta informarci. Il noleggio dell&#8217;alzata è <strong>GRATUITO</strong>!</p>',
        '<p>Questa carrozzina ad autospinta è molto <strong>legger</strong>a e <strong>pieghevole,</strong> ma al tempo stesso molto robusta. Può portare un paziente che pesa massimo 130kg, in alternativa ti possiamo fornire una sedia a rotelle specifica per pazienti che <em><strong><a href="/prodotto/noleggio-carrozzina-per-pazienti-obesi/">necessitano di una portata maggiore.&nbsp;</a></strong></em></p>',
        '<p>Il servizio di <strong>affitto carrozzina pieghevole ad autospinta</strong> è la soluzione ideale per chi necessita di un ausilio temporaneo per la mobilità, sia durante un periodo di riabilitazione sia per esigenze legate all&#8217;età o a una ridotta capacità di deambulazione. Grazie alla struttura leggera e richiudibile, la carrozzina è facile da trasportare e utilizzare in qualsiasi contesto.</p>',
        '<p>Il paziente passa <strong>molto tempo sulla carrozzina?</strong> Per evitare che si vadano a formare delle piaghe puoi acquistare il<a href="/prodotto/cuscino-antidecubito-in-fibra-cava-siliconata/"><em><strong> cuscino antidecubito ad un prezzo a te riservato</strong></em></a>!</p>',
        '<h3>&nbsp;DIMENSIONI carrozzina pieghevole ad autospinta:</h3>',
        '<p>Affittiamo la sedia a rotelle pieghevole ad autospinta in <strong>diverse sedute</strong>. La più piccola è di 40 cm, fino ad arrivare ad un massimo di 50cm.</p>',
        '<p><strong>Il peso</strong> della carrozzina può variare in base alla grandezza della seduta. La più leggera pesa 14 kg, mentre la più grande pesa circa 18kg.</p>',
        '<p>Le ruote grandi sono fondamentali per potersi spostare autonomamente<strong>.</strong> Si differenziano dalla <a href="/prodotto/noleggio-carrozzina-pieghevole-da-transito/"><em>sedia a rotelle da transit</em>o</a> per diametro e posizione sul telaio.</p>',
        '<p>Tutti gli ausili da noi in affitto sono sanificati in ogni loro parte.<strong> Pulizia e sanificazione</strong> sono alla base del nostro lavoro.</p>',
        '<p>Le carrozzina di M.I.A Medical Italia sono di ottima qualità e l&#8217;affitto e il noleggio della sedia è<strong> sicuro, funzionale e garantito!&nbsp;</strong></p>',
        '<p>Scegli il nostro servizio di <strong>affitto carrozzina pieghevole ad autospinta</strong> per avere un ausilio sicuro, sanificato e pronto all&#8217;uso. Consegniamo in Toscana, Lazio e tramite<strong> spedizione in tutta Italia</strong></p>',
        '<p><strong>Prenota online</strong> subito il noleggio della carrozzina pieghevole ad autospinta. Se preferisci puoi contattarci telefonicamente / via WhatsApp al <strong>+393926509237 </strong>o tramite email: <strong>amministrazione@miamedicalitalia.it</strong></p>',
        '<p><a href="https://www.facebook.com/MIAMedicalitalia/"><em>Clicca qui e copri la nostra pagina FACEBOOK</em></a></p>',
      ].join(''),
    },
    en: {
      title: 'Folding self-propelled wheelchair for hire',
      slug: 'affitto-carrozzina-pieghevole-ad-autospinta-spedizioni-in-tutta-italia',
      shortDescription: 'Self-propelled wheelchair Comfortable and light, easy to load in the car. Wheelchair with folding seat and frame for maximum convenience. Hire for 1 day: 15€ with pick-up on site only. Home delivery and pick-up in Rome and Florence from 30€.',
      metaTitle: 'Folding self-propelled wheelchair hire',
      metaDescription: 'Hire a folding self-propelled wheelchair carrying up to 130 kg. Large rear wheels for getting about unaided. Delivery across Italy.',
      description: [
        '<p>The rental of the self-propelled folding wheelchair is <strong>indispensable</strong> for disabled people, elderly people, people with reduced mobility or people who need rehabilitation.</p>',
        '<p>The wheelchair comes with the <strong>podiums</strong> for feet and <strong>armrests</strong>. Both can be easily removed at any time. Upon delivery a <strong>our technician</strong> It will show you how to fold and unfold the self-propelled wheelchair and, consequently, how to attach and detach the armrests and footrests. <br />The wheelchair also has two <strong>brakes</strong> in order to lock the wheels.</p>',
        '<p>Should it have a <strong>chalk</strong> or the need to hold the leg <strong>raised</strong> just inform us. The rental of the riser is <strong>FREE</strong>!</p>',
        '<p>This self-propelled wheelchair is very <strong>light</strong>and e <strong>folding,</strong> but at the same time very robust. It can carry a patient weighing a maximum of 130kg, alternatively we can provide you with a wheelchair specifically for patients who <em><strong><a href="/en/product/noleggio-carrozzina-per-pazienti-obesi/">need a higher flow rate.&nbsp;</a></strong></em></p>',
        '<p>The service of <strong>rental of a self-propelled folding wheelchair</strong> It is the ideal solution for those who need temporary mobility assistance, whether during a period of rehabilitation or for needs related to age or reduced walking ability. Thanks to its lightweight and foldable structure, the wheelchair is easy to transport and use in any setting.</p>',
        '<p>The patient passes <strong>much time in the wheelchair?</strong> To prevent sores from forming, you can purchase the<a href="/en/product/cuscino-antidecubito-in-fibra-cava-siliconata/"><em><strong> anti-decubitus pillow at a price reserved for you</strong></em></a>!</p>',
        '<h3>&nbsp;DIMENSIONS self-propelled folding wheelchair:</h3>',
        '<p>We rent the self-propelled folding wheelchair in <strong>several sessions</strong>. The smallest is 40 cm, up to a maximum of 50 cm.</p>',
        '<p><strong>The weight</strong> of the wheelchair may vary depending on the size of the seat. The lightest weighs 14 kg, while the largest weighs around 18 kg.</p>',
        '<p>Large wheels are essential for independent movement<strong>.</strong> They differ from the <a href="/en/product/noleggio-carrozzina-pieghevole-da-transito/"><em>transit wheelchair</em>o</a> by diameter and position on the frame.</p>',
        '<p>All the aids we rent are sanitised in every part.<strong> Cleaning and sanitising</strong> are the basis of our work.</p>',
        '<p>M.I.A Medical Italia\'s wheelchairs are of the highest quality and chair hire is<strong> safe, functional and guaranteed!&nbsp;</strong></p>',
        '<p>Choose our <strong>rental of a self-propelled folding wheelchair</strong> for safe, sanitised and ready-to-use assistance. We deliver in Tuscany, Lazio and via<strong> delivery throughout Italy</strong></p>',
        '<p><strong>Book online</strong> rental of the self-propelled folding wheelchair now. If you prefer, you can contact us by phone/via WhatsApp at <strong>+393926509237 </strong>or by email: <strong>amministrazione@miamedicalitalia.it</strong></p>',
        '<p><a href="https://www.facebook.com/MIAMedicalitalia/"><em>Click here and cover our FACEBOOK page</em></a></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'self-propelled',
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
    thumbnail: { file: 'self-propelled-folding-1.jpg', alt: { it: 'Affitto carrozzina pieghevole ad autospinta' } },
    gallery: [
      'self-propelled-folding-2.jpg',
      'self-propelled-folding-3.jpg',
    ],
  },

  addons: [homeDelivery(30), legRaiser],

  questions: [...hireIntake],
  terms: [generalTerms],
});
