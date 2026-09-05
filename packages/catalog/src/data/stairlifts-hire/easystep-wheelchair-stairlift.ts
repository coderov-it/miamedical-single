/**
 * Noleggio Montascale per carrozzine Easystep
 *
 * /prodotto/noleggio-montascale-per-carrozzine-easystep/
 * WooCommerce product 15557 — the one stair climber with real figures:
 *
 *   Capacità di Carico Massima  160 kg
 *   Materiale  struttura in lega di alluminio ad alta resistenza
 *   Dimensioni  77 × 70 × 160 cm da aperto
 *   Seduta minima della carrozzina  44 cm
 *
 * The 44 cm is the smallest wheelchair seat it will take, which is why it is
 * recorded as `seat-width` — on this product the spec is a minimum requirement
 * rather than a measurement of the machine.
 *
 * Delivery 45 € out and 45 € back.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { stairliftsHire } from './category.ts';

export const easystepWheelchairStairlift = stairliftsHire.rental({
  code: 'easystep-wheelchair-stairlift',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 105),
    days(15, 150),
    days(30, 240),
    days(45, 315),
    days(60, 390),
    days(90, 540),
  ],

  translations: {
    it: {
      title: 'Noleggio Montascale per carrozzine Easystep',
      slug: 'noleggio-montascale-per-carrozzine-easystep',
      shortDescription: 'Noleggio montascale elettrico per carrozzine per salire e scendere le scale. Seduta minima della carrozzina: 44cm Adatto sia a carrozzine con ruote grandi che con ruote piccole Consegna a domicilio soltanto a Roma e Firenze a partire da 45€ +45€ per il ritiro Consegna gratis se acquisti un noleggio per un minimo di 45 giorni. Il ritiro e la riconsegna degli ausili in magazzino sono Gratuiti. Deposito richiesto: 300€ Per il noleggio di questo articolo è richiesto un deposito di 300€.',
      metaTitle: 'Noleggio Montascale EasyStep per Carrozzine',
      metaDescription: 'Supera le scale senza sforzo con il montascale EasyStep. Trasporta carrozzine e carichi fino a 200 kg in totale sicurezza. Consegna rapida a Roma e Firenze',
      description: [
        '<h2>Hai bisogno di superare le scale in totale sicurezza con la tua carrozzina?</h2>',
        '<p>Salire e scendere le scale in edifici senza ascensore non deve più essere un ostacolo. Il nostro <strong>Montascale Mobile Universale EasyStep</strong> a noleggio è la soluzione definitiva: un sistema motorizzato a cingoli progettato per trasportare <strong>carrozzine manuali</strong> (e carichi) in modo fluido, sicuro e senza alcuno sforzo fisico per l&#8217;accompagnatore.</p>',
        '<p>Con il servizio di <strong>noleggio M.I.A. Medical Italia</strong>, ricevi EasyStep direttamente a casa tua a <strong>Roma o Firenze</strong>, con <strong>consegna rapida</strong>, dimostrazione pratica all&#8217;uso e supporto tecnico sempre attivo.</p>',
        '<h3>Cos&#8217;è il Montascale EasyStep a noleggio?</h3>',
        '<p>EasyStep è un dispositivo motorizzato &#8220;universale&#8221; a cingoli. A differenza delle sedie fisse, questo modello è dotato di una <strong>piattaforma di carico</strong> e un sistema di aggancio regolabile che permette di caricare direttamente la maggior parte delle carrozzine manuali.</p>',
        '<p>L&#8217;operatore non deve sollevare pesi: i <strong>cingoli in gomma ad alta aderenza</strong> fanno tutto il lavoro, garantendo stabilità assoluta su scale dritte, anche con pendenze pronunciate.</p>',
        '<h3>A chi consigliamo il noleggio dell&#8217;EasyStep</h3>',
        '<p>Questo dispositivo è la scelta ideale per:</p>',
        '<ul><li><strong>Utenti in carrozzina</strong> che non vogliono effettuare continui trasferimenti da una seduta all&#8217;altra.</li><li><strong>Famiglie</strong> che necessitano di una soluzione temporanea per rendere accessibile la propria abitazione.</li><li><strong>Condomini e strutture pubbliche</strong> (scuole, hotel, musei) per abbattere le barriere architettoniche senza lavori edilizi.</li><li><strong>Trasporto merci e carichi pesanti</strong>: grazie alla sua robustezza, può essere usato anche per movimentare pacchi fino a 160 kg.</li></ul>',
        '<h3>Come funziona il montascale EasyStep</h3>',
        '<p>L&#8217;utilizzo è intuitivo e sicuro grazie al pannello di controllo integrato:</p>',
        '<ol start="1"><li><strong>Preparazione</strong>: Si apre il dispositivo e si regola il blocco dello schienale in base alla carrozzina.</li><li><strong>Caricamento</strong>: Si posiziona la carrozzina sulla piattaforma e si assicura tramite la <strong>cintura di sicurezza</strong> e i blocchi regolabili.</li><li><strong>Accensione</strong>: Si attiva il sistema tramite la chiave di sicurezza e l&#8217;interruttore rosso sul pannello.</li><li><strong>Manovra</strong>: L&#8217;accompagnatore utilizza il pulsante <strong>Giallo</strong> (Avanti/Salita) o <strong>Verde</strong> (Indietro/Discesa).</li><li><strong>Sicurezza</strong>: I freni elettromagnetici bloccano il dispositivo istantaneamente al rilascio dei comandi.</li></ol>',
        '<h3>Caratteristiche Tecniche</h3>',
        '<ul><li><strong>Capacità di Carico Massima</strong>: 160 kg (una delle più alte della categoria).</li><li><strong>Materiale</strong>: Struttura in lega di alluminio ad alta resistenza, leggera e antiruggine.</li><li><strong>Motore Potente</strong>: Sistema elettrico silenzioso alimentato da <strong>batteria al litio</strong> a lunga durata.</li><li><strong>Dimensioni</strong>: 77 × 70 × 160 cm da aperto; estremamente compatto da chiuso 122 x 51 x16,5 cm.</li><li><strong>Autonomia</strong>: Ideale per coprire numerosi piani con una sola ricarica.</li><li><strong>Sicurezza</strong>: Cingoli dentati per il massimo grip e ruote universali con freno per gli spostamenti in piano.</li></ul>',
        '<h3>Perché scegliere il noleggio con MIA Medical Italia</h3>',
        '<ul><li><strong>Pronta Consegna</strong>: Disponibile in 24/48h su Roma e Firenze.</li><li><strong>Formazione Inclusa</strong>: Un nostro tecnico ti mostrerà come agganciare la carrozzina e manovrare il dispositivo in totale serenità.</li><li><strong>Igiene Garantita</strong>: Ogni dispositivo viene sanificato accuratamente prima di ogni noleggio.</li><li><strong>Flessibilità</strong>: Noleggia solo per il tempo che ti serve (giorni, settimane o mesi).</li><li><strong>Zero Pensieri</strong>: Manutenzione e assistenza tecnica continua incluse nel prezzo.</li></ul>',
        '<blockquote><p><strong>Nota di Sicurezza</strong>: Per evacuazioni o utilizzi con persone di peso superiore ai 100 kg, consigliamo sempre la presenza di due operatori per una gestione ottimale.</p></blockquote>',
        '<h3>Contattaci oggi stesso</h3>',
        '<p>Affronta le barriere architettoniche con la tecnologia <strong>EasyStep</strong>. Richiedi un preventivo gratuito e personalizzato.</p>',
        '<ul><li><strong>Telefono</strong>: <a href="https://www.google.com/search?q=tel:%2B393926509237&amp;authuser=1">+39 392 65 09 237</a></li><li><strong>WhatsApp</strong>: Clicca qui per scriverci subito</li><li><strong>Email</strong>: <a href="mailto:info@miamedicalitalia.it">info@miamedicalitalia.it</a></li></ul>',
        '<p><strong>Vuoi vedere come si adatta alla tua carrozzina?</strong> Contattaci per una consulenza gratuita senza impegno!</p>',
      ].join(''),
    },
    en: {
      title: 'Easystep wheelchair stair climber, for hire',
      slug: 'noleggio-montascale-per-carrozzine-easystep',
      shortDescription: 'Hire of electric wheelchair lifts for ascending and descending stairs. Minimum wheelchair seat: 44cm Suitable for both wheelchairs with large and small wheels Home delivery only in Rome and Florence starting from €45 +€45 for collection Free delivery if you purchase a rental for a minimum of 45 days. The collection and return of aids to the warehouse are Free. Deposit required: 300€ For the rental of this article, a deposit of 300€.',
      metaTitle: 'EasyStep wheelchair stair climber hire',
      metaDescription: 'Get up the stairs without the strain, with the EasyStep stair climber. Carries wheelchairs and loads to 200 kg safely.',
      description: [
        '<h2>Do you need to climb stairs safely with your wheelchair?</h2>',
        '<p>Walking up and down stairs in buildings without a lift no longer has to be an obstacle. Our <strong>EasyStep Universal Mobile Stairlift</strong> rental is the ultimate solution: a motorized tracked system designed to transport <strong>manual wheelchairs</strong> and loads) smoothly, safely and without any physical effort for the attendant.</p>',
        '<p>With the service of <strong>M.I.A. Medical Italia rental</strong>, receive EasyStep directly to your home at <strong>Rome or Florence</strong>with <strong>rapid delivery</strong>, practical demonstration of use and technical support always active.</p>',
        '<h3>What is the rental EasyStep stairlift?</h3>',
        '<p>EasyStep is a “universal” tracked motorised device. Unlike fixed chairs, this model is equipped with a <strong>loading platform</strong> and an adjustable docking system that allows the direct loading of most manual wheelchairs.</p>',
        '<p>The operator must not lift weights: i <strong>high-grip rubber tracks</strong> they do all the work, guaranteeing absolute stability on straight stairs, even with steep gradients.</p>',
        '<h3>Who do we recommend EasyStep hire to?</h3>',
        '<p>This device is the ideal choice for:</p>',
        '<ul><li><strong>Wheelchair users</strong> who do not want to make continuous transfers from one session to another.</li><li><strong>Families</strong> who need a temporary solution to make their home accessible.</li><li><strong>Condominiums and public facilities</strong> (schools, hotels, museums) to remove architectural barriers without building work.</li><li><strong>Transport of goods and heavy loads</strong>Thanks to its sturdiness, it can also be used to handle parcels weighing up to 160 kg.</li></ul>',
        '<h3>How the EasyStep stairlift works</h3>',
        '<p>Use is intuitive and safe thanks to the integrated control panel:</p>',
        '<ol start="1"><li><strong>Preparation</strong>This opens the device and adjusts the backrest lock to suit the wheelchair.</li><li><strong>Loading</strong>The wheelchair is placed on the platform and secured with the <strong>seat belt</strong> and adjustable blocks.</li><li><strong>Ignition</strong>The system is activated via the security key and the red switch on the panel.</li><li><strong>Manoeuvre</strong>The helper uses the button <strong>Yellow</strong> (Forward/Upward) or <strong>Green</strong> (Back/Down).</li><li><strong>Security</strong>: Electromagnetic brakes lock the device instantly when the controls are released.</li></ol>',
        '<h3>Technical Specifications</h3>',
        '<ul><li><strong>Maximum Load Capacity</strong>: 160 kg (one of the heaviest in its class).</li><li><strong>Material</strong>: High-strength, lightweight, rustproof aluminium alloy construction.</li><li><strong>Powerful motor</strong>: Silent electrical system powered by <strong>lithium battery</strong> long-lasting.</li><li><strong>Dimensions</strong>77 × 70 × 160 cm open; extremely compact when closed 122 x 51 x 16.5 cm.</li><li><strong>Autonomy</strong>Ideal for covering several floors with a single charge.</li><li><strong>Security</strong>Toothed tracks for maximum grip and universal wheels with brakes for moving on level ground.</li></ul>',
        '<h3>Why choose rental with MIA Medical Italia</h3>',
        '<ul><li><strong>Ready for Delivery</strong>Available in 24/48h in Rome and Florence.</li><li><strong>Training Included</strong>One of our technicians will show you how to attach the wheelchair and manoeuvre the device with complete peace of mind.</li><li><strong>Hygiene Guaranteed</strong>: Each device is thoroughly sanitised before each rental.</li><li><strong>Flexibility</strong>Rent only for the time you need (days, weeks or months).</li><li><strong>Zero Thoughts</strong>Maintenance and continuous technical support included in the price.</li></ul>',
        '<blockquote><p><strong>Safety Note</strong>: For evacuations or use with persons weighing more than 100 kg, we always recommend the presence of two operators for optimal handling.</p></blockquote>',
        '<h3>Contact us today</h3>',
        '<p>Addressing architectural barriers with technology <strong>EasyStep</strong>. Request a free, customised quote.</p>',
        '<ul><li><strong>Phone</strong>: <a href="https://www.google.com/search?q=tel:%2B393926509237&amp;authuser=1">+39 392 65 09 237</a></li><li><strong>WhatsApp</strong>: Click here to write to us now</li><li><strong>Email</strong>: <a href="mailto:info@miamedicalitalia.it">info@miamedicalitalia.it</a></li></ul>',
        '<p><strong>Want to see how it fits in your wheelchair?</strong> Contact us for a free no-obligation consultation!</p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 160,
    'seat-width': { min: 44, max: 44 },
    'total-width': { min: 70, max: 70 },
    'total-length': { min: 77, max: 77 },
    'total-height': { min: 160, max: 160 },
    'frame-material': 'aluminium',
    battery: { it: 'Litio', en: 'Lithium' },
  },

  media: {
    thumbnail: 'easystep-wheelchair-stairlift-1.png',
    gallery: [
      'easystep-wheelchair-stairlift-2.png',
      'easystep-wheelchair-stairlift-3.png',
      'easystep-wheelchair-stairlift-4.png',
    ],
  },

  addons: [homeDeliveryOnly(45), homeCollection(45)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
