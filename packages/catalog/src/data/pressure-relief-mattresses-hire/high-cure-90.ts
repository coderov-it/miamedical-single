/**
 * Noleggio Materasso Antidecubito 90cm ad Alto Rischio High Cure
 *
 * /prodotto/noleggio-materasso-antidecubito-ad-alto-rischio/
 * WooCommerce product 9699. Rated to stage 4 and to 300 kg therapeutic load, with
 * the compressor kit and a cover included. Transport is 45 € and covers delivery
 * and installation.
 *
 * The page requires the mattress protector to be bought for hygiene, at 150 € —
 * compulsory, so not an add-on. It stays in the description.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { pressureReliefMattressesHire } from './category.ts';

export const highCure90 = pressureReliefMattressesHire.rental({
  code: 'high-cure-90',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 90),
    days(30, 120),
    days(45, 160),
    days(60, 210),
    days(90, 290),
  ],

  translations: {
    it: {
      title: 'Noleggio Materasso Antidecubito 90cm ad Alto Rischio High Cure',
      slug: 'noleggio-materasso-antidecubito-ad-alto-rischio',
      shortDescription: 'Noleggio Materasso Antidecubito Noleggio del Materasso ad Alto Rischio per decubito fino al 4° stadio. Portata fino a 300KG. Noleggialo e lo consegneremo direttamente a casa tua! Il prezzo del trasporto è di 45€ e include la consegna e l’installazione a domicilio + 45€ di ritiro. Materasso antidecubito disponibile anche in vendita. Per motivi igienici, è obbligatorio acquistare la copertura del materasso a 150€.',
      metaTitle: 'Noleggio Materasso Antidecubito 90cm ad Alto Rischio High Cure - Mia Medical Italia',
      metaDescription: 'Noleggio materasso antidecubito Ad Alto Rischio DOMUS 4 fino al 4 stadio di decubito. Sanificato, con copertura e Kit compressore. Consegna immediata.',
      description: [
        '<p>Hai appena subito un’operazione e sei costretto a letto? Hai un genitore o un familiare anziano che ormai ha una mobilità ridotta? Ottieni il massimo del comfort e della sicurezza, previeni la comparsa di piaghe da decubito o alleviarne il fastidio tramite il noleggio di un materasso antidecubito ad alto rischio HIGH CURE.</p>',
        '<h2>Cosa è un Materasso Antidecubito? </h2>',
        '<p>Un&nbsp;<strong>materasso anti decubito&nbsp;</strong>è un dispositivo medico progettato per&nbsp;<strong>prevenire&nbsp;</strong>e alleviare le&nbsp;<strong><a href="https://www.focus.it/scienza/salute/che-cosa-sono-le-piaghe-da-decubito">piaghe da decubito</a>&nbsp;</strong>, dette anche lesioni da pressione. Tali lesioni tendono a svilupparsi su quelle determinate aree del corpo che sono soggette a pressione prolungata, specialmente in pazienti con mobilità ridotta, o coloro che sono costretti a letto per lunghi periodi.&nbsp;</p>',
        '<h2>A Cosa Serve ?</h2>',
        '<p>Dunque, questi dispositivi medici avanzati utilizzano una&nbsp;<strong>tecnologia a pressione alternata,&nbsp;</strong>che riduce la pressione sulle aree più a rischio,&nbsp;<strong>migliorando la circolazione sanguigna,&nbsp;</strong>e garantendo un comfort ottimale. Specialmente su:</p>',
        '<ul><li>Schiena e Zona Sacrale</li><li>Talloni e Caviglie</li><li>Gomiti e Scapole</li></ul>',
        '<p>I materassi ad “alto rischio” sono necessari per quei pazienti che già presentano delle piaghe da decubito a stadi medio-avanzati, ma sono ottimali anche per la prevenzione, e consigliati per coloro che presentano stadi meno gravi per evitare un peggioramento. </p>',
        '<h4> Come Riconoscere i 4 stadi di DECUBITO</h4>',
        '<ol><li>Il PRIMO STADIO, prende in considerazione dei fenomeni superficiali, come la colorazione della pelle. </li><li>Il SECONDO STADIO, comporta una lesione cutanea parziale che intacca il derma. </li><li>Il TERZO STADIO, rileva una lesione cutanea spessore totale, coinvolgendo i tessuti sottocutanei. </li><li>Il QUARTO STADIO, la lesione è totale tanto da compromettere muscoli e/o articolazioni. </li></ol>',
        '<p>Se soffri di <strong>lesioni da pressione</strong>, non preoccuparti. Il nostro infermiere di fiducia <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> è specializzato proprio nella cura delle lesioni cutanee e ha anche esperienza nel campo dell’assistenza domiciliare. <strong>Non esitare a contattarlo</strong>! </p>',
        '<h2>A Chi Può Essere Utile Un Materasso Antidecubito?</h2>',
        '<p>Questo tipo di materasso medico è raccomandato per chiunque sia a rischio di sviluppare piaghe da decubito. In particolare:</p>',
        '<ul><li><strong>Anziani con mobilità ridotta</strong>, che passano molto tempo a letto o sulla sedia a rotelle.</li><li><strong>Pazienti Post Operatori,&nbsp;</strong>che hanno subito un intervento chirurgico e devono rimanere a letto per un periodo di tempo prolungato.</li><li><strong>Pazienti con disabilità,&nbsp;</strong>che sono affetti da patologie neurologiche o muscolari che ne limitano il movimento.&nbsp;</li><li><strong>Pazienti Oncologici o in Cure Palliative,&nbsp;</strong>che hanno una pelle particolarmente delicata a causa di trattamenti o condizioni mediche.</li><li><strong>Chiunque soffra di Problemi di Circolazione o Fragilità Cutanea,&nbsp;</strong>che corre un rischio maggiore di contrarre ulcere da pressione.&nbsp;</li></ul>',
        '<p>Il noleggio di un materasso antidecubito ad alto rischio o non, può davvero fare la differenza!</p>',
        '<h2>Come Scegliere il Materasso che si adatta Meglio alle tue Esigenze</h2>',
        '<p>Esistono vari tipi di materassi anti decubito, dunque ci sono degli elementi che devono essere tenuti in considerazione per decidere quale modello si adatta meglio alle necessità del paziente. Questi sono:&nbsp;</p>',
        '<ul><li><strong>Grado di rischio del paziente</strong></li><li><strong>Durata dell’allettamento</strong>.</li><li><strong>Livello di Comfort Desiderato</strong></li></ul>',
        '<p>Leggi la nostra Guida alla scelta del materasso perfetto per te! </p>',
        '<p>Se non sai quale scegliere, contattaci: ti aiuteremo a trovare la soluzione perfetta per te.</p>',
        '<h2>Il Migliore sul mercato: Materasso Antidecubito ad Alto Rischio HIGH CURE</h2>',
        '<p>Il modello HIGH CURE è il migliore che si può trovare sul mercato per garantire ai pazienti ad alto rischio, o con piaghe da decubito in stadi avanzati, il maggiore sollievo possibile e il massimo del comfort.</p>',
        '<p>Grazie ai suoi&nbsp;<strong>20 elementi intercambiabili in Nylon/TPU</strong>, è impermeabile, traspirante e dotato di una&nbsp;<strong>copertura con trattamento antimicrobico agli ioni d’argento</strong>&nbsp;per la massima igiene. Inoltre, con la sua&nbsp;<strong>struttura con elementi intercambiabili e microforati</strong>, assicura un’elevata ventilazione (<em>LOW AIR LOSS</em>), mantenendo la pelle asciutta e riducendo il rischio di infezioni.</p>',
        '<p><strong>Perfetto per uso domiciliare e ospedaliero, in quanto adattabile, il materasso HIGH CURE offre un sollievo efficace e duraturo.</strong></p>',
        '<h4>Informazioni Tecniche Materasso Antidecubito ad Alto Rischio HIGH CURE</h4>',
        '<p>Clicca <a href="https://www.wimed.it/wp-content/uploads/2024/08/WI-H_ST-20035_SISTEMA-HIGH-CURE_94140000_rev.5.pdf">QUI</a> per scaricare la scheda tecnica completa.</p>',
        '<p><strong>Informazioni Principali </strong>Materasso Antidecubito ad Alto Rischio HIGH CURE</p>',
        '<figure><table><tbody><tr><td><strong>Tipo</strong></td><td>Materasso ad aria con compressione</td></tr><tr><td><strong>Materiale </strong></td><td>Nylon + TPU impermeabile e traspirante</td></tr><tr><td><strong>Copertura </strong></td><td>Nylon + PU con trattamento antimicrobico agli ioni d’argento </td></tr><tr><td><strong>Numero Elementi</strong></td><td>20 intercambiabili</td></tr><tr><td><strong>Elementi Micro-forati</strong></td><td>9 con ventilazione forzata (Low Air Loss)</td></tr><tr><td><strong>Altezza Materasso</strong></td><td>20,3 cm</td></tr><tr><td><strong>Dimensioni Materasso</strong></td><td>200 x 90 cm</td></tr><tr><td><strong>Peso Massimo Paziente</strong></td><td>200 kg</td></tr><tr><td><strong>Pressione Regolabile</strong></td><td>15 &#8211; 40 mmHg</td></tr><tr><td><strong>Rumorosità </strong></td><td>&lt; 26 dB</td></tr><tr><td><strong>Alimentazione</strong></td><td>220-240V / 50 Hz</td></tr><tr><td><strong>Tempo di un Ciclo</strong></td><td>9,6 minuti</td></tr></tbody></table></figure>',
        '<h2>Perché Scegliere un Materasso Ad Alto Rischio?</h2>',
        '<ul><li><strong>Perfetto per la Riduzione del rischio di piaghe da decubito fino al IV stadio,&nbsp;</strong>ma ottimale anche per la Prevenzione di pazienti soggetti a rischi meno elevati.&nbsp;</li><li><strong>Migliore circolazione sanguigna e riduzione della pressione cutanea,&nbsp;</strong>grazie alla tecnologia avanzata di pressione alternata.&nbsp;</li><li><strong>Maggiore igiene grazie al trattamento antimicrobico impermeabile,&nbsp;</strong>per non correre rischio di infezioni.&nbsp;</li><li><strong>Silenzioso e confortevole, con rumore inferiore a 26 dB</strong></li><li><strong>Facile da installare e regolare,&nbsp;</strong>si adatta a letti ospedalieri e non.&nbsp;</li></ul>',
        '<p>Guarda anche i nostri <strong><a href="/catalogo-noleggio/">letti ortopedici elettrici a noleggio</a></strong>. </p>',
        '<h2><a href="https://www.wimed.it/prodotti/antidecubito/high-cure/#1527600285871-61c0b829-41a7d64c-f4fb4427-0a99">Come Funziona il Materasso Antidecubito ad Alto Rischio HIGH CURE</a></h2>',
        '<p>Il&nbsp;<strong>MODELLO HIGH CURE</strong>&nbsp;utilizza un&nbsp;<strong>compressore digitale</strong>&nbsp;che gonfia e sgonfia le&nbsp;<strong>celle ad aria in modo alternato</strong>, garantendo:</p>',
        '<ul><li><strong>Distribuzione uniforme del peso</strong>&nbsp;per evitare punti di pressione prolungata.</li><li><strong>Miglior afflusso di sangue ai tessuti</strong>&nbsp;per una rigenerazione più rapida.</li><li><strong>Ventilazione costante</strong>&nbsp;per mantenere la pelle asciutta. </li></ul>',
        '<p><strong>Basta accendere il compressore e il sistema lavorerà in autonomia per garantire il massimo comfort e prevenzione.&nbsp;</strong></p>',
        '<p>Inoltre, dato che i 20&nbsp;&nbsp;elementi sono realizzati con la tecnica CELL-ON-CELL, il materasso è diviso in 2 SEZIONI, delle quali quella inferiore rimane costantemente gonfia per evitare un eccessivo effetto di “sprofondamento”, garantendo sicurezza in caso di mancanza di corrente.&nbsp;</p>',
        '<ul><li>I primi tre elementi del materasso sono a funzionamento statico per la testa.</li><li>I 9 elementi centrali sono micro-forati garantendo una ventilazione forzata</li></ul>',
        '<p>Ti abbiamo convinto che il Noleggio di un Materasso Antidecubito ad Alto Rischio sia la soluzione migliore per te? </p>',
      ].join(''),
    },
    en: {
      title: 'High Cure 90 cm high-risk pressure-relief mattress, for hire',
      slug: 'noleggio-materasso-antidecubito-ad-alto-rischio',
      shortDescription: 'Antidecubitus Mattress Hire Rental of the High-risk mattress for decubitus up to stage 4. Capacity up to 300KG. Rent it and we will deliver it directly to your home! The transport price is €45 and includes home delivery and installation, plus €45 for collection. Anti-decubitus mattress also available for sale. For hygiene reasons, it compulsory purchase of the mattress protector for €150.',
      metaTitle: 'High Cure 90 cm high-risk pressure-relief mattress hire',
      metaDescription: 'Hire a DOMUS 4 high-risk pressure-relief mattress rated to stage 4 pressure sores. Sanitised, with a cover and compressor kit.',
      description: [
        '<p>Have you just undergone surgery and are bedridden? Do you have an elderly parent or family member with limited mobility? Achieve maximum comfort and safety, prevent the development of pressure sores or relieve discomfort by renting a HIGH CURE high-risk anti-decubitus mattress.</p>',
        '<h2>What is an Antidecubitus Mattress? </h2>',
        '<p>A&nbsp;<strong>anti decubitus mattress&nbsp;</strong>is a medical device designed to&nbsp;<strong>prevent&nbsp;</strong>and alleviate the&nbsp;<strong><a href="https://www.focus.it/scienza/salute/che-cosa-sono-le-piaghe-da-decubito">bedsores</a>&nbsp;</strong>also known as pressure injuries. These injuries tend to develop on certain areas of the body that are subject to prolonged pressure, especially in patients with reduced mobility, or those who are bedridden for long periods.&nbsp;</p>',
        '<h2>What is it for?</h2>',
        '<p>So, these advanced medical devices use a&nbsp;<strong>alternating pressure technology,&nbsp;</strong>which reduces pressure on the areas most at risk,&nbsp;<strong>improving blood circulation,&nbsp;</strong>and ensuring optimal comfort. Especially on:</p>',
        '<ul><li>Back and Sacral Zone</li><li>Heels and Ankles</li><li>Elbows and Scapulae</li></ul>',
        '<p>High-risk\' mattresses are necessary for patients who already have medium to advanced stages of pressure sores, but are also optimal for prevention, and recommended for those with less severe stages to avoid worsening. </p>',
        '<h4> How to Recognise the 4 Stages of DECUBITY</h4>',
        '<ol><li>The FIRST STAGE, takes into account superficial phenomena, such as skin colouring. </li><li>The SECOND STAGE, involves a partial skin lesion affecting the dermis. </li><li>The THIRD STAGE, detects a full thickness skin lesion, involving subcutaneous tissues. </li><li>The FOURTH STAGE, the injury is total to the extent that muscles and/or joints are affected. </li></ol>',
        '<p>If you suffer from <strong>pressure injuries</strong>don\'t worry. Our trusted nurse <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> specialises precisely in the treatment of skin lesions and also has experience in home care. <strong>Do not hesitate to contact him</strong>! </p>',
        '<h2>Who Can An Antidecubitus Mattress Help?</h2>',
        '<p>This type of medical mattress is recommended for anyone at risk of developing pressure sores. In particular:</p>',
        '<ul><li><strong>Elderly people with reduced mobility</strong>who spend a lot of time in bed or in a wheelchair.</li><li><strong>Post-operative Patients,&nbsp;</strong>who have undergone surgery and have to remain in bed for an extended period of time.</li><li><strong>Patients with disabilities,&nbsp;</strong>who suffer from neurological or muscular pathologies that limit their movement.&nbsp;</li><li><strong>Oncological or Palliative Care patients,&nbsp;</strong>who have particularly delicate skin due to treatments or medical conditions.</li><li><strong>Anyone suffering from Circulatory Problems or Skin Fragility,&nbsp;</strong>who run a higher risk of contracting pressure ulcers.&nbsp;</li></ul>',
        '<p>Renting an anti-decubitus mattress, high-risk or not, can really make a difference!</p>',
        '<h2>How to Choose the Mattress that Best Fits Your Needs</h2>',
        '<p>There are various types of decubitus mattresses, so there are elements that must be taken into consideration when deciding which model best suits the patient\'s needs. These are:&nbsp;</p>',
        '<ul><li><strong>Patient\'s degree of risk</strong></li><li><strong>Duration of allurement</strong>.</li><li><strong>Desired comfort level</strong></li></ul>',
        '<p>Read our guide to choosing the perfect mattress for you! </p>',
        '<p>If you do not know which one to choose, contact us: we will help you find the perfect solution.</p>',
        '<h2>The Best on the Market: HIGH CURE Antidecubitus Mattress</h2>',
        '<p>The HIGH CURE model is the best that can be found on the market to provide patients at high risk, or with advanced pressure sores, with the greatest possible relief and comfort.</p>',
        '<p>Thanks to its&nbsp;<strong>20 interchangeable Nylon/TPU elements</strong>is waterproof, breathable and equipped with a&nbsp;<strong>cover with antimicrobial silver ion treatment</strong>&nbsp;for maximum hygiene. In addition, with its&nbsp;<strong>structure with interchangeable and micro-perforated elements</strong>ensures high ventilation (<em>LOW AIR LOSS</em>), keeping the skin dry and reducing the risk of infection.</p>',
        '<p><strong>Perfect for home and hospital use, as it is adaptable, the HIGH CURE mattress provides effective and long-lasting relief.</strong></p>',
        '<h4>Technical Information High Risk Antidecubitus Mattress HIGH CURE</h4>',
        '<p>Click <a href="https://www.wimed.it/wp-content/uploads/2024/08/WI-H_ST-20035_SISTEMA-HIGH-CURE_94140000_rev.5.pdf">HERE</a> to download the complete data sheet.</p>',
        '<p><strong>Key Information </strong>HIGH CURE Antidecubitus Mattress</p>',
        '<figure><table><tbody><tr><td><strong>Type</strong></td><td>Air mattress with compression</td></tr><tr><td><strong>Material </strong></td><td>Nylon + TPU waterproof and breathable</td></tr><tr><td><strong>Coverage </strong></td><td>Nylon + PU with antimicrobial silver ion treatment </td></tr><tr><td><strong>Number Elements</strong></td><td>20 interchangeable</td></tr><tr><td><strong>Micro-hollow elements</strong></td><td>9 with forced ventilation (Low Air Loss)</td></tr><tr><td><strong>Mattress Height</strong></td><td>20.3 cm</td></tr><tr><td><strong>Mattress Dimensions</strong></td><td>200 x 90 cm</td></tr><tr><td><strong>Maximum Patient Weight</strong></td><td>200 kg</td></tr><tr><td><strong>Adjustable pressure</strong></td><td>15 - 40 mmHg</td></tr><tr><td><strong>Noise </strong></td><td>&lt; 26 dB</td></tr><tr><td><strong>Power supply</strong></td><td>220-240V / 50 Hz</td></tr><tr><td><strong>One Cycle Time</strong></td><td>9.6 minutes</td></tr></tbody></table></figure>',
        '<h2>Why Choose a High Risk Mattress?</h2>',
        '<ul><li><strong>Perfect for reducing the risk of pressure sores up to stage IV,&nbsp;</strong>but also optimal for the prevention of patients at lower risk.&nbsp;</li><li><strong>Improved blood circulation and reduced skin pressure,&nbsp;</strong>thanks to advanced alternating pressure technology.&nbsp;</li><li><strong>Improved hygiene thanks to waterproof antimicrobial treatment,&nbsp;</strong>so as not to run the risk of infection.&nbsp;</li><li><strong>Quiet and comfortable, with noise less than 26 dB</strong></li><li><strong>Easy to install and adjust,&nbsp;</strong>adapts to hospital and non-hospital beds.&nbsp;</li></ul>',
        '<p>See also our <strong><a href="/en/rental-catalog/">electric orthopaedic beds for hire</a></strong>. </p>',
        '<h2><a href="https://www.wimed.it/prodotti/antidecubito/high-cure/#1527600285871-61c0b829-41a7d64c-f4fb4427-0a99">How the HIGH CURE Antidecubitus Mattress Works</a></h2>',
        '<p>The&nbsp;<strong>HIGH CURE MODEL</strong>&nbsp;uses a&nbsp;<strong>digital compressor</strong>&nbsp;that inflates and deflates the&nbsp;<strong>air cells in alternating mode</strong>, ensuring:</p>',
        '<ul><li><strong>Uniform weight distribution</strong>&nbsp;to avoid prolonged pressure points.</li><li><strong>Better blood flow to the tissues</strong>&nbsp;for faster regeneration.</li><li><strong>Constant ventilation</strong>&nbsp;to keep the skin dry. </li></ul>',
        '<p><strong>Simply switch on the compressor and the system will work autonomously for maximum comfort and prevention.&nbsp;</strong></p>',
        '<p>Furthermore, as the 20 elements are made using the CELL-ON-CELL technique, the mattress is divided into 2 SECTIONS, of which the lower one remains constantly inflated to avoid an excessive \'sinking\' effect, ensuring safety in the event of a power failure.&nbsp;</p>',
        '<ul><li>The first three elements of the mattress are static for the head.</li><li>The 9 central elements are micro-drilled ensuring forced ventilation</li></ul>',
        '<p>Have we convinced you that renting a High Risk Anti-Decubitus Mattress is the best solution for you? </p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 300,
    'pressure-ulcer-stage': 'stage-4',
    'has-compressor': true,
  },

  media: {
    thumbnail: { file: 'high-cure-90-1.jpg', alt: { it: 'materasso-antidecubito-alto-rischio.' } },
  },

  addons: [homeDelivery(45)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
