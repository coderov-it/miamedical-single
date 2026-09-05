/**
 * Noleggio Letto Ospedaliero Bariatrico Elettrico largo 120cm portata 300kg
 *
 * /prodotto/letto-ortopedico-con-materasso-antidecubito-roma-firenze-300kg/
 * WooCommerce product 8946 — the bariatric bed, and the highest safe working
 * load in the catalogue at 300 kg. Delivery from 80 €, the same again to collect.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { hospitalBedsHire } from './category.ts';

export const bariatricElectricBed = hospitalBedsHire.rental({
  code: 'bariatric-electric-bed',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(30, 200),
    days(45, 280),
    days(60, 350),
    days(90, 495),
  ],

  translations: {
    it: {
      title: 'Noleggio Letto Ospedaliero Bariatrico Elettrico largo 120cm portata 300kg con materasso antidecubito',
      slug: 'letto-ortopedico-con-materasso-antidecubito-roma-firenze-300kg',
      shortDescription: 'Noleggio Letto ospedaliero Bariatrico Prenotazione facile, costi chiari, ausili di ultima generazione. Nessun deposito! Consegna a Roma e a Firenze a domicilio incluso di montaggio a partire da 80€. Lo stesso prezzo vale anche per il ritiro! Il costo sarà maggiorato in caso di consegna al piano senza ascensore. La struttura di questo letto è rinforzata. Il motore è potenziato per una portata fino a 300kg. Per motivi igienici, è obbligatorio acquistare la copertura del materasso a 120€.',
      metaTitle: 'Noleggio letti ortopedici - con materasso incluso | Roma e Firenze',
      metaDescription: 'Noleggio letto ortopedico bariatrico elettrico per anziani con materasso antidecubito a Roma e Firenze. Chiamaci ora al +39 392 65 09 237!',
      description: [
        '<p>Il l<strong>etto ortopedico ospedaliero bariatrico elettrico</strong> è un <strong>dispositivo medicale </strong>progettato per garantire<br /><strong>sicurezza</strong>, <strong>comfort </strong>e <strong>supporto</strong> ottimale ad anziani, persone con obesità grave, mobilità ridotta o che devono trascorrere un periodo di <strong>degenza a casa</strong>. Mia Medical offre un servizio di noleggio su Roma e Firenze di una vasta gamma di letti ortopedici elettrici ospedalieri.</p>',
        '<p>Questo modello, grazie alla sua <strong>struttura rinforzata</strong> con una <strong>portata massima di 300 kg</strong>, sponde laterali, triangolo &#8220;alza-malato&#8221;, e una <strong>larghezza extra di 120 cm</strong>, questo letto è ideale per garantire la <strong>massima stabilità e comodità</strong> anche per <strong>pazienti bariatrici.</strong></p>',
        '<p>Non farti scappare questa occasione! <strong>Incluso nel noleggio su Roma e Firenze : <a href="/prodotto/vendita-materasso-antidecubito-polyplot-90cm/">materasso antidecubito ad alta resistenza</a></strong>, progettato per prevenire lesioni da pressione e migliorare la qualità del riposo.</p>',
        '<p>Perfetto per l’<strong>uso domiciliare e ospedaliero</strong>, questo il letto ortopedico per anziani offre regolazioni<br />elettriche avanzate per un’assistenza più semplice e confortevole.</p>',
        '<h3>A chi può essere utile il noleggio di un letto elettrico ortopedico | Roma e Firenze ? </h3>',
        '<p>Il letto ortopedico elettrico è consigliato per:</p>',
        '<ul><li><strong>Persone con obesità grave</strong> (fino a 300 kg): La struttura extra-large offre maggiore stabilità e comfort.</li><li><strong>Pazienti con mobilità ridotta o anziani allettati a lungo termine</strong>: Ideale per chi ha difficoltà a muoversi autonomamente.</li><li><strong>Soggetti in fase post-operatoria</strong>: Supporta il recupero in sicurezza, riducendo il rischio di complicazioni.</li><li><strong>Persone con disabilità motorie o patologie neurologiche</strong>: Facilita l’assistenza domiciliare e ospedaliera.</li><li><strong>Chi è a rischio di piaghe da decubito</strong>: Grazie al materasso antidecubito incluso, aiuta a prevenire lesioni da pressione.</li><li>Persone che hanno bisogno di un <strong>letto confortevole, pratico e sicuro</strong> per un periodo di <strong>degenza</strong> da <strong>casa</strong></li></ul>',
        '<p><strong>Cerchi il miglior letto ortopedico ospedaliero Bariartico? Questo modello è la scelta perfetta!</strong></p>',
        '<p>Ecco perché: </p>',
        '<ul><li><strong>Portata massima del letto</strong>: infatti, se il paziente pesa oltre i 200 kg, è fondamentale un letto con struttura rinforzata e portata fino a 300 kg, come questo modello.</li><li><strong>Dimensioni extra-large</strong>: un letto più largo (120 cm invece di 90 cm) offre maggiore stabilità e comfort.</li><li><strong>Regolazioni elettriche</strong>: questo letto ortopedico elettrico consente di regolare l’altezza, l’inclinazione della schiena e delle gambe, facilitando i movimenti e migliorando la postura del paziente.</li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Hai dubbi? Contattaci per una consulenza gratuita!</a></strong></p>',
        '<p><strong>Caratteristiche del letto ortopedico ospedaliero elettrico bariatrico </strong></p>',
        '<ul><li>regolazione elettrica completa.</li><li>Superficie netta: 200 cm x 140 cm ;</li><li>Lunghezza totale: 220 cm;</li><li>Larghezza totale: 140 cm.</li><li>Peso max. paziente: 250 Kg.;</li><li>Carico max. di sicuro utilizzo: 300Kg.</li><li>Regolazione in altezza con telecomando: minima: 30 cm. – massima: 80 cm.</li></ul>',
        '<p>Grazie a queste caratteristiche, il <strong>noleggio del letto ortopedico elettrico migliorerà la qualità della vita del paziente e semplificherà il lavoro di assistenza.</strong></p>',
        '<h3>Perché questo modello Mia Medical?</h3>',
        '<ul><li><strong>Maggiore sicurezza e stabilità</strong> per persone con obesità</li><li><strong>Facilità di utilizzo</strong> con regolazioni elettriche avanzate</li><li><strong>Comfort ottimale</strong> grazie alla larghezza extra e al materasso antidecubito</li><li>Perfetto per <strong>uso domiciliare e ospedaliero</strong></li><li><strong>Facilità di trasporto e installazione </strong>con ruote bloccabili</li></ul>',
        '<h2>Come funziona?</h2>',
        '<p>Il letto ortopedico ospedaliero ortopedico è dotato di <strong>motori elettrici</strong> che permettono di<br /><strong>regolare</strong> facilmente:<br />&#8211; <strong>L’altezza del letto</strong>, per facilitare l’ingresso e l’uscita dal letto.<br />&#8211; <strong>L’inclinazione dello schienale</strong>, per migliorare la postura e il comfort del paziente.<br />&#8211; <strong>L’inclinazione delle gambe,</strong> per favorire la circolazione sanguigna e ridurre il gonfiore</p>',
        '<p>Il materasso antidecubito incluso garantisce protezione dalle <a href="https://www.google.com/url?sa=t&amp;source=web&amp;rct=j&amp;opi=89978449&amp;url=https://www.gavazzeni.it/malattie/piaghe-decubito-lesioni-pressione/%23:~:text%3DLe%2520piaghe%2520da%2520decubito%252C%2520chiamate,una%2520superficie%2520esterna%2520di%2520appoggio.&amp;ved=2ahUKEwj666nR0qKLAxVexAIHHdlfHvkQFnoECBIQAw&amp;usg=AOvVaw2dqHCsm4gMnJfObu94QXFk">piaghe da pressione,</a><br />assicurando un riposo sicuro e confortevole.</p>',
        '<p>Tutti i nostri letti elettrici&nbsp; sono igienizzati e sanificati prima della consegna. Il <a href="/prodotto/vendita-materasso-antidecubito-polyplot-90cm/">materasso in dotazione</a> è&nbsp; preventivi antidecubito ed ha una copertura sanitaria integrale.</p>',
        '<p>Se sei il caregiver di una persona non autosufficiente e hai bisogno di una mano, il nostro <strong>infermiere</strong> di fiducia <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> è specializzato proprio nel campo dell’assistenza domiciliare, in modo da poter portare avanti le cure dal comfort della propria casa. <strong>Non esitare a contattarlo! </strong></p>',
        '<p><a href="https://wa.me/393926509237">Contattaci per il noleggio del tuo letto ortopedico!</a></p>',
      ].join(''),
    },
    en: {
      title: 'Bariatric electric hospital bed, 120 cm wide, 300 kg, with pressure-relief mattress',
      slug: 'letto-ortopedico-con-materasso-antidecubito-roma-firenze-300kg',
      shortDescription: 'Hire Bariatric Hospital Bed Easy booking, clear costs, state-of-the-art aids. No deposit! Delivery in Rome and Florence home delivery including assembly starting from €80. The same price also applies for collection! The cost will be increased in the case of delivery to a floor without a lift. The structure of this bed is reinforced. The motor is upgraded for a capacity of up to 300kg. For hygiene reasons, it mandatory purchase of the mattress cover at €120.',
      metaTitle: 'Orthopaedic bed hire — mattress included | Rome and Florence',
      metaDescription: 'Hire a bariatric electric orthopaedic bed with a pressure-relief mattress in Rome and Florence. Call +39 392 650 9237',
      description: [
        '<p>The l<strong>electric bariatric hospital orthopaedic hectograph</strong> is a <strong>medical device </strong>designed to ensure<br /><strong>security</strong>, <strong>comfort </strong>e <strong>support</strong> ideal for older people, individuals with severe obesity, reduced mobility or who have to spend a period of <strong>home care</strong>. Mia Medical offers a rental service in Rome and Florence for a wide range of electric orthopaedic hospital beds.</p>',
        '<p>This model, thanks to its <strong>reinforced structure</strong> with a <strong>maximum load capacity of 300 kg</strong>, side rails, triangle \'riser\', and a <strong>extra width of 120 cm</strong>, this bed is ideal for ensuring the <strong>maximum stability and comfort</strong> also for <strong>bariatric patients.</strong></p>',
        '<p>Don\'t let this opportunity pass you by! <strong>Included in the rental on Rome and Florence : <a href="/en/product/vendita-materasso-antidecubito-polyplot-90cm/">high-strength anti-decubitus mattress</a></strong>designed to prevent pressure injuries and improve the quality of rest.</p>',
        '<p>Perfect for the<strong>home and hospital use</strong>, This orthopaedic bed for the elderly offers adjustments.<br />advanced electrics for easier and more comfortable servicing.</p>',
        '<h3>Who can hire an electric orthopaedic bed | Rome and Florence ? </h3>',
        '<p>The electric orthopaedic bed is recommended for:</p>',
        '<ul><li><strong>People with severe obesity</strong> (up to 300 kg): The extra-large frame provides greater stability and comfort.</li><li><strong>Patients with reduced mobility or elderly patients confined to bed for long periods</strong>: Ideal for those who have difficulty moving independently.</li><li><strong>Post-operative subjects</strong>: Supports safe recovery, reducing the risk of complications.</li><li><strong>People with motor disabilities or neurological disorders</strong>: Facilitates home and hospital care.</li><li><strong>Who is at risk of pressure sores</strong>Thanks to the included anti-decubitus mattress, it helps prevent pressure injuries.</li><li>People who need a <strong>comfortable, practical and safe bed</strong> for a period of <strong>hospitalisation</strong> by <strong>home</strong></li></ul>',
        '<p><strong>Looking for the best orthopaedic hospital bed Bariartico? This model is the perfect choice!</strong></p>',
        '<p>Here\'s why: </p>',
        '<ul><li><strong>Maximum bed capacity</strong>In fact, if the patient weighs over 200 kg, a bed with a reinforced frame and a load capacity of up to 300 kg, such as this model, is essential.</li><li><strong>Extra-large dimensions</strong>A wider bed (120 cm instead of 90 cm) offers more stability and comfort.</li><li><strong>Electrical adjustments</strong>This electric orthopaedic bed allows the height, back and leg angle to be adjusted, facilitating movement and improving the patient\'s posture.</li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Do you have doubts? Contact us for a free consultation!</a></strong></p>',
        '<p><strong>Features of the bariatric electric hospital orthopaedic bed </strong></p>',
        '<ul><li>full electric adjustment.</li><li>Net area: 200 cm x 140 cm ;</li><li>Total length: 220 cm;</li><li>Total width: 140 cm.</li><li>Maximum patient weight: 250 kg;</li><li>Maximum safe load: 300Kg.</li><li>Height adjustment with remote control: minimum: 30 cm. - maximum: 80 cm.</li></ul>',
        '<p>Thanks to these characteristics, the <strong>renting the electric orthopaedic bed will improve the patient\'s quality of life and simplify care work.</strong></p>',
        '<h3>Why this Mia Medical model?</h3>',
        '<ul><li><strong>Increased safety and stability</strong> for people with obesity</li><li><strong>Ease of use</strong> with advanced electrical adjustments</li><li><strong>Optimal comfort</strong> thanks to the extra width and anti-decubitus mattress</li><li>Perfect for <strong>home and hospital use</strong></li><li><strong>Ease of transport and installation </strong>with lockable wheels</li></ul>',
        '<h2>How does it work?</h2>',
        '<p>The orthopaedic hospital bed is equipped with <strong>electric motors</strong> that allow<br /><strong>regular</strong> easily:<br />– <strong>The height of the bed</strong>to facilitate getting in and out of bed.<br />– <strong>The inclination of the backrest</strong>to improve patient posture and comfort.<br />– <strong>The inclination of the legs,</strong> to promote blood circulation and reduce swelling</p>',
        '<p>The included anti-decubitus mattress provides protection from the <a href="https://www.google.com/url?sa=t&amp;source=web&amp;rct=j&amp;opi=89978449&amp;url=https://www.gavazzeni.it/malattie/piaghe-decubito-lesioni-pressione/%23:~:text%3DLe%2520piaghe%2520da%2520decubito%252C%2520chiamate,una%2520superficie%2520esterna%2520di%2520appoggio.&amp;ved=2ahUKEwj666nR0qKLAxVexAIHHdlfHvkQFnoECBIQAw&amp;usg=AOvVaw2dqHCsm4gMnJfObu94QXFk">pressure sores,</a><br />ensuring safe and comfortable sleep.</p>',
        '<p>All our electric beds are disinfected and sanitised before delivery. The <a href="/en/product/vendita-materasso-antidecubito-polyplot-90cm/">mattress supplied</a> is anti-decubitus preventive and has full medical coverage.</p>',
        '<p>If you are the caregiver of a dependent person and need a hand, our <strong>nurse</strong> trustworthy <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> specialises precisely in the field of home care, so that care can be carried out from the comfort of one\'s own home. <strong>Do not hesitate to contact him! </strong></p>',
        '<p><a href="https://wa.me/393926509237">Contact us for your orthopaedic bed rental!</a></p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 250,
    'safe-working-load': 300,
    'mattress-surface': { it: '200 × 140 cm', en: '200 × 140 cm' },
    'total-length': { min: 220, max: 220 },
    'total-width': { min: 140, max: 140 },
    'height-adjustment': { min: 30, max: 80 },
    'includes-mattress': true,
  },

  media: {
    thumbnail: 'bariatric-electric-bed-1.jpg',
    gallery: [
      'bariatric-electric-bed-2.jpg',
    ],
  },

  addons: [homeDelivery(80)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
