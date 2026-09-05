/**
 * Affitto carrozzina bariatrica per pazienti obesi
 *
 * /prodotto/affitto-carrozzina-bariatrica-per-pazienti-obesi-bariatrica/
 * WooCommerce product 9045. The page's own "Specifiche tecniche" list is the
 * source for every value below, including the two the shop states as one line —
 * "Ingombro massimo: Seduta 60 cm → 83 cm", which is the overall WIDTH of the
 * 60 cm seat, not a length.
 *
 * `propulsion` is unset for the same reason as the reclining chair: the page does
 * not say.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const bariatricWheelchair = wheelchairsHire.rental({
  code: 'bariatric-wheelchair',
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
      title: 'Affitto carrozzina bariatrica per pazienti obesi',
      slug: 'affitto-carrozzina-bariatrica-per-pazienti-obesi-bariatrica',
      shortDescription: 'Noleggio Sedia a rotelle pieghevole bariatrica Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Il ritiro in magazzino è GRATUITO! Prenota subito online! Consegna e ritiro a domicilio a Roma e Firenze da 30€.',
      metaTitle: 'Affitto carrozzina bariatrica per pazienti obesi',
      metaDescription: 'Affitto carrozzina bariatrica pieghevole per pazienti obesi / bariatrica. Portata massima 250 kg. Disponibilità immediata. Contattaci al +393926509237',
      description: [
        '<p>L&#8217;<strong>affitto carrozzina bariatrica pieghevole per pazienti obesi</strong> è la soluzione ideale per chi necessita di un ausilio robusto, sicuro e confortevole per un periodo temporaneo. La carrozzina bariatrica è progettata per garantire il massimo della stabilità e della sicurezza durante gli spostamenti, offrendo una portata elevata fino a <strong>200 kg</strong> senza rinunciare alla praticità di una struttura pieghevole, facilmente trasportabile e riponibile.</p>',
        '<p>Grazie alla sua struttura rinforzata con <strong>doppia crociera in acciaio verniciato</strong>, questa carrozzina è indicata per persone con ridotta capacità di deambulazione, pazienti in fase di recupero post-operatorio, soggetti bariatrici o persone che necessitano di un supporto affidabile per gli spostamenti quotidiani.</p>',
        '<h2><strong>Caratteristiche dell&#8217;affitto carrozzina bariatrica</strong></h2>',
        '<p>L&#8217;affitto carrozzina bariatrica pieghevole è stato progettato per offrire il massimo comfort anche in caso di utilizzo prolungato.</p>',
        '<p>Tra le principali caratteristiche troviamo:</p>',
        '<ul><li>Telaio rinforzato in acciaio verniciato con doppia crociera.</li><li>Portata massima fino a <strong>200 kg</strong>.</li><li>Seduta e schienale in nylon nero imbottito e lavabile.</li><li>Braccioli corti estraibili con imbottitura.</li><li>Pedane estraibili e regolabili in lunghezza.</li><li>Possibilità di installare pedane elevabili per mantenere gli arti inferiori sollevati.</li><li>Ruote posteriori piene da <strong>Ø 60 cm</strong> in poliuretano.</li><li>Ruote anteriori da <strong>Ø 20 cm</strong> con forcella regolabile.</li><li>Ruotini antiribaltamento per una maggiore sicurezza.</li><li>Tasca portadocumenti posteriore.</li><li>Struttura pieghevole per facilitarne il trasporto.</li></ul>',
        '<h2>Comfort e sicurezza </h2>',
        '<p>Quando si sceglie l&#8217;affitto di una carrozzina bariatrica pieghevole è fondamentale puntare sulla sicurezza.</p>',
        '<p>La carrozzina offre una struttura estremamente stabile grazie al telaio rinforzato, ai ruotini antiribaltamento e alle ruote piene che garantiscono un&#8217;elevata affidabilità anche durante gli spostamenti quotidiani.</p>',
        '<p>La seduta imbottita e lo schienale ergonomico assicurano invece un comfort elevato, mentre i braccioli estraibili e le pedane regolabili permettono di adattare facilmente la carrozzina alle esigenze del paziente.</p>',
        '<p>Per chi trascorre molte ore seduto, consigliamo inoltre l&#8217;utilizzo di un <strong>cuscino antidecubito</strong>, disponibile a noleggio o acquisto, per contribuire a ridurre il rischio di lesioni da pressione.</p>',
        '<h2>Carrozzina pieghevole facile da trasportare</h2>',
        '<p>Uno dei principali vantaggi dell&#8217;<strong>affitto carrozzina bariatrica pieghevole per pazienti obesi</strong> è la possibilità di richiudere completamente la struttura.</p>',
        '<p>Una volta piegata, la carrozzina occupa solamente <strong>32 cm di larghezza</strong>, risultando semplice da caricare nel bagagliaio dell&#8217;auto, da trasportare e da riporre quando non viene utilizzata.</p>',
        '<h2>Specifiche tecniche della carrozzina bariatrica</h2>',
        '<p>Tutte le specifiche tecniche da conoscere per l&#8217;affitto carrozzina bariatrica: </p>',
        '<ul><li>Portata massima: <strong>200 kg</strong></li><li>Peso carrozzina: <strong>26 kg</strong></li><li>Altezza schienale: <strong>41 cm</strong></li><li>Larghezza seduta: <ul><li>60 cm</li></ul>',
        '</li><li>Ingombro massimo: <ul><li>Seduta 60 cm → 83 cm</li></ul>',
        '</li><li>Ingombro da chiusa: <strong>32 cm</strong></li><li>Telaio in acciaio verniciato con doppia crociera</li><li>Seduta e schienale imbottiti e lavabili</li><li>Ruote posteriori piene Ø 60 cm</li><li>Ruote anteriori Ø 20 cm</li><li>Braccioli estraibili</li><li>Pedane regolabili ed estraibili</li><li>Ruotini antiribaltamento</li></ul>',
        '<h2>Noleggio sicuro e sanificato</h2>',
        '<p>Tutte le carrozzine disponibili presso M.I.A. Medical vengono accuratamente <strong>igienizzate e sanificate dopo ogni utilizzo</strong>, seguendo rigorosi protocolli di pulizia. La sicurezza e l&#8217;igiene rappresentano una priorità per offrire ai nostri clienti un ausilio sempre pronto all&#8217;uso e in perfette condizioni.</p>',
        '<p>Se stai cercando altri ausili, visita anche la nostra categoria <a href="/catalogo-noleggio/"><strong>Carrozzine a noleggio</strong>.</a></p>',
        '<h2>Prenota il tuo noleggio</h2>',
        '<p>Con il servizio di <strong>affitto carrozzina bariatrica pieghevole per pazienti obesi</strong> puoi ricevere rapidamente un ausilio professionale senza affrontare il costo dell&#8217;acquisto.</p>',
        '<p>Per maggiori informazioni o per prenotare il noleggio puoi contattarci telefonicamente, tramite WhatsApp oppure via e-mail. Il nostro staff sarà lieto di aiutarti nella scelta della soluzione più adatta alle tue esigenze.</p>',
        '<p>Clicca qui e scopri <a href="https://www.facebook.com/MIAMedicalitalia/">la nostra pagina Facebook</a></p>',
      ].join(''),
    },
    en: {
      title: 'Bariatric wheelchair for hire, for obese patients',
      slug: 'affitto-carrozzina-bariatrica-per-pazienti-obesi-bariatrica',
      shortDescription: 'Hire Bariatric folding wheelchair Hire for 1 day: 15€ with pick-up on site only. Pick-up at the warehouse is FREE! Book online now! Home delivery and pick-up in Rome and Florence from 30€.',
      metaTitle: 'Bariatric wheelchair hire up to 200 kg',
      metaDescription: 'Hire a folding bariatric wheelchair rated to 200 kg: reinforced double-cross-brace steel frame, 60 cm seat, 32 cm folded.',
      description: [
        '<p>L\'<strong>hire of foldable bariatric wheelchair for obese patients</strong> it is the ideal solution for anyone who needs a robust, safe and comfortable aid for a temporary period. The bariatric wheelchair is designed to guarantee maximum stability and safety when moving around, offering a high weight capacity of up to <strong>200 kg</strong> without sacrificing the practicality of a folding structure that is easy to transport and store.</p>',
        '<p>Thanks to its reinforced structure with <strong>double painted steel crossbar</strong>, this wheelchair is suitable for people with reduced mobility, post-operative recovery patients, bariatric individuals or those requiring reliable support for daily travel.</p>',
        '<h2><strong>Features of bariatric wheelchair rental</strong></h2>',
        '<p>The foldable bariatric wheelchair hire has been designed to offer maximum comfort even in the event of prolonged use.</p>',
        '<p>Among the main features we find:</p>',
        '<ul><li>Reinforced painted steel chassis with double crossbrace.</li><li>Maximum capacity up to <strong>200 kg</strong>.</li><li>Black padded and washable nylon seat and backrest.</li><li>Short removable armrests with padding.</li><li>Pull-out and length-adjustable footrests.</li><li>Option to install elevating footrests to keep the lower limbs raised.</li><li>Solid rear tyres from <strong>Ø 60 cm</strong> made of polyurethane.</li><li>Front wheels from <strong>Ø 20 cm</strong> with adjustable fork.</li><li>Anti-tip small wheels for enhanced safety.</li><li>Rear document pocket.</li><li>Foldable structure to make transport easier.</li></ul>',
        '<h2>Comfort and safety </h2>',
        '<p>When choosing to hire a foldable bariatric wheelchair, it is essential to focus on safety.</p>',
        '<p>The wheelchair offers an extremely stable structure thanks to its reinforced frame, anti-tip wheels and solid tyres, which ensure high reliability even during everyday journeys.</p>',
        '<p>The padded seat and ergonomic backrest ensure a high level of comfort, while the removable armrests and adjustable footrests make it easy to adapt the wheelchair to the patient\'s needs.</p>',
        '<p>For those who spend many hours sitting, we also recommend the use of a <strong>anti-decubitus pillow</strong>, available for rental or purchase, to help reduce the risk of pressure ulcers.</p>',
        '<h2>Easy-to-transport folding wheelchair</h2>',
        '<p>One of the main advantages of’<strong>hire of foldable bariatric wheelchair for obese patients</strong> it is the possibility of completely closing the structure.</p>',
        '<p>Once folded, the wheelchair takes up only <strong>32 cm wide</strong>, making it easy to load into the car boot, transport and store when not in use.</p>',
        '<h2>Technical specifications of the bariatric wheelchair</h2>',
        '<p>All the technical specifications to know for the bariatric wheelchair hire: </p>',
        '<ul><li>Maximum capacity: <strong>200 kg</strong></li><li>Wheelchair weight: <strong>26 kg</strong></li><li>Backrest height: <strong>41 cm</strong></li><li>Seat width: <ul><li>60 cm</li></ul>',
        '</li><li>Maximum overall dimensions: <ul><li>Seat height 60 cm → 83 cm</li></ul>',
        '</li><li>Dimensions when closed: <strong>32 cm</strong></li><li>Painted steel frame with double cross-brace</li><li>Upholstered and wipe-clean seat and backrest</li><li>Solid rear wheels Ø 60 cm</li><li>Front wheels Ø 20 cm</li><li>Removable armrests</li><li>Adjustable and removable footrests</li><li>Anti-tip wheels</li></ul>',
        '<h2>Safe and sanitised hire</h2>',
        '<p>All the wheelchairs available at M.I.A. Medical are thoroughly <strong>cleaned and disinfected after each use</strong>, following rigorous cleaning protocols. Safety and hygiene represent a priority to offer our customers an aid that is always ready for use and in perfect condition.</p>',
        '<p>If you are looking for other aids, please also visit our category <a href="/en/rental-catalog/"><strong>Wheelchairs for hire</strong>.</a></p>',
        '<h2>Book your hire</h2>',
        '<p>With the service of <strong>hire of foldable bariatric wheelchair for obese patients</strong> You can quickly receive professional assistance without facing the cost of purchase.</p>',
        '<p>For more information or to book your hire, you can contact us by phone, via WhatsApp or by email. Our staff will be happy to help you choose the most suitable solution for your needs.</p>',
        '<p>Click here to find out more <a href="https://www.facebook.com/MIAMedicalitalia/">our Facebook page</a></p>',
      ].join(''),
    },
  },

  specs: {
    'age-group': 'adult',
    'max-load': 200,
    weight: { min: 26, max: 26 },
    'seat-width': { min: 60, max: 60 },
    'backrest-height': { min: 41, max: 41 },
    'total-width': { min: 83, max: 83 },
    'folded-width': 32,
    'frame-material': 'reinforced-steel',
    upholstery: { it: 'Nylon nero imbottito e lavabile', en: 'Padded, washable black nylon' },
    'wheel-type': 'solid',
    'rear-wheels': { it: 'Piene Ø 60 cm in poliuretano', en: 'Solid polyurethane, Ø 60 cm' },
    'front-wheels': { it: 'Ø 20 cm con forcella regolabile in acciaio', en: 'Ø 20 cm on an adjustable steel fork' },
    foldable: true,
    'removable-armrests': true,
    'removable-footrests': true,
    'anti-tip-wheels': true,
  },

  media: {
    thumbnail: { file: 'bariatric-wheelchair-1.jpg', alt: { it: 'Carrozzina bariatrica pieghevole' } },
    gallery: [
      { file: 'bariatric-wheelchair-2.jpg', alt: { it: 'Alzata per gesso carrozzina SLIM autospinta' } },
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
