/**
 * Noleggio Kinetec Ginocchio + Crioterapia
 *
 * /prodotto/noleggio-kinetec-ginocchio-e-crioterapia/
 * WooCommerce product 14204 — the one product in the category with a real
 * specification block, for the Kinetec Ginocchio Classic:
 *
 *   Alimentazione  220 V
 *   Gamma di movimento  estensione/flessione da -10° a 120°
 *   Timer  1–59 minuti / 1–24 ore / uso continuo
 *   Inversione del carico in fasi  regolabile da 1 a 25 (sistema di sicurezza)
 *   Dimensioni  97 × 36 × 23 cm
 *   Altezza paziente supportata  120 – 200 cm    Peso  11 kg
 *
 * Listed under both Crioterapia and Kinetec; filed here after its own title.
 * Delivery 15 € out and 15 € back anywhere in Italy, free from 30 days.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { kinetecHire } from './category.ts';

export const kinetecAndCryotherapy = kinetecHire.rental({
  code: 'kinetec-and-cryotherapy',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 320),
    days(20, 420),
    days(30, 550),
  ],

  translations: {
    it: {
      title: 'Noleggio Kinetec Ginocchio + Crioterapia',
      slug: 'noleggio-kinetec-ginocchio-e-crioterapia',
      shortDescription: 'Noleggio Kinetec ginocchio abbinato alla Crioterapia compressiva Consegna gratuita per i noleggi da 30 giorni, in tutta l’Italia! Per i noleggi di durata minore consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Ricordati di richiedere il tutore per il ginocchio e gli accessori per la crioterapia in fase di prenotazione, così da ricevere tutto il necessario per iniziare subito la terapia. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio combinato Kinetec Ginocchio + Crioterapia',
      metaDescription: 'Noleggio combinato del Kinetec Ginocchio e della Crioterapia, eccellente combo per un recupero veloce. Chiama : 3926509237',
      description: [
        '<h2><strong><br />Noleggio Combinato Kinetec Ginocchio e Crioterapia Compressiva</strong></h2>',
        '<p><strong>La soluzione completa per il recupero post-operatorio e post-traumatico del ginocchio</strong></p>',
        '<p>Durante le fasi iniziali della riabilitazione del ginocchio è fondamentale intervenire in modo tempestivo e continuo per ridurre dolore, infiammazione e rigidità articolare.</p>',
        '<p>Il&nbsp;<strong>noleggio combinato Kinetec Ginocchio + Crioterapia compressiva</strong>&nbsp;di Mia Medical Italia nasce per offrire un trattamento completo direttamente a domicilio, unendo&nbsp;<strong>mobilizzazione passiva continua (CPM)</strong>&nbsp;e&nbsp;<strong>trattamento crioterapico controllato</strong>.</p>',
        '<p>Questa combinazione consente di lavorare simultaneamente su mobilità articolare, gestione del dolore e controllo dell’edema, favorendo un recupero più rapido e sicuro.</p>',
        '<h3><strong>A chi è indicato il noleggio combinato Kinetec Ginocchio e Crioterapia Compressiva</strong></h3>',
        '<p>Il pacchetto è indicato per pazienti che devono affrontare:</p>',
        '<ul><li>recupero post-operatorio al ginocchio</li><li>riabilitazione post-traumatica</li><li>interventi ortopedici complessi</li><li>fase riabilitativa precoce</li><li>dolore e gonfiore persistente</li><li>riduzione del range articolare</li></ul>',
        '<p><strong>Principali scenari di utilizzo</strong></p>',
        '<ul><li>protesi totale o parziale di ginocchio</li><li>lesioni meniscali</li><li>traumi sportivi</li><li>distorsioni articolari</li><li>edema post-chirurgico</li></ul>',
        '<p>È una soluzione particolarmente indicata nelle&nbsp;<strong>prime settimane dopo l’intervento</strong>, quando il movimento attivo è limitato ma è necessario mantenere l’articolazione in funzione.</p>',
        '<h3><strong>In cosa consiste il noleggio combinato</strong></h3>',
        '<p>Il pacchetto include due dispositivi elettromedicali professionali, ampiamente utilizzati nei protocolli riabilitativi ortopedici.</p>',
        '<h4><strong><a href="/catalogo-noleggio/">Kinetec Ginocchio : Mobilizzatore passivo continuo (CPM)</a></strong></h4>',
        '<p>Il Kinetec è un dispositivo medico progettato per la mobilizzazione passiva continua dell’articolazione del ginocchio. Il movimento avviene in modo automatico, senza contrazione muscolare volontaria da parte del paziente.</p>',
        '<p><strong>Funzioni principali</strong></p>',
        '<ul><li>flessione ed estensione controllata del ginocchio</li><li>regolazione graduale dell’angolo articolare</li><li>movimento continuo e ripetitivo</li><li>utilizzo in fase post-operatoria precoce</li></ul>',
        '<p><strong>Benefici clinici</strong></p>',
        '<ul><li>prevenzione della rigidità articolare</li><li>riduzione delle aderenze</li><li>recupero progressivo del range di movimento</li><li>diminuzione del dolore post-operatorio</li><li>riduzione dell’edema</li><li>miglioramento della circolazione locale</li></ul>',
        '<p>Il Kinetec è spesso prescritto già nei primi giorni successivi all’intervento, quando il movimento attivo non è ancora consentito.</p>',
        '<p><strong>Caratteristiche tecniche : Kinetec Ginocchio modello Classic</strong></p>',
        '<ul><li>Alimentazione: 220 V</li><li>Gamma di movimento: estensione/flessione da -10° a 120°</li><li>Velocità: regolabile dal 5% al 100%</li><li>Blocco tasti: previene modifiche accidentali dei parametri</li><li>Timer: 1–59 minuti / 1–24 ore / uso continuo</li><li>Programma di riscaldamento: incluso</li><li>Monitoraggio durata terapia: conteggio cumulativo delle sessioni</li><li>Inversione del carico in fasi: regolabile da 1 a 25 (sistema di sicurezza)</li><li>Regolazione per il trasporto: posizionamento facilitato della stecca</li><li>Dimensioni: 97 × 36 × 23 cm</li><li>Altezza paziente supportata: 120 – 200 cm</li><li>Peso: 11 kg</li></ul>',
        '<h4><strong><a href="/catalogo-noleggio/">Crioterapia compressiva CryoPus</a>h</strong></h4>',
        '<p>La crioterapia compressiva è un trattamento avanzato che combina&nbsp;<strong>freddo terapeutico e compressione pneumatica controllata</strong>.</p>',
        '<p>Il sistema CryoPush consente un’applicazione localizzata e costante del freddo, migliorando l’efficacia rispetto alla crioterapia tradizionale.</p>',
        '<p><strong>Benefici della crioterapia compressiva</strong></p>',
        '<ul><li>riduzione del dolore</li><li>diminuzione dell’infiamzione</li><li>controllo del gonfiore</li><li>accelerazione del recupero tissutale</li><li>sollievo immediato nelle fasi acute</li></ul>',
        '<p>L’azione del freddo provoca una vasocostrizione locale che limita i processi infiammatori e favorisce una rigenerazione più rapida dei tessuti.</p>',
        '<p><strong>Caratteristiche tecniche: CryoPush</strong></p>',
        '<ul><li>Sistema portatile con compressione pneumatica regolabile</li><li>Funzionamento silenzioso e intuitivo</li><li>Temperatura costante controllata in base al ghiaccio inserito</li><li>Timer integrato per la gestione delle sessioni</li><li>Applicatori anatomici disponibili per ginocchio, spalla, caviglia, anca, zona lombare</li><li>Serbatoio refrigerante ad alta capacità</li><li>Display digitale per controllo di tempo, temperatura e compressione</li></ul>',
        '<h3><strong>Noleggio Kinetec e Crioterapia compressiva : un trattamento combinato più efficace</strong></h3>',
        '<p>L’abbinamento tra Kinetec e crioterapia compressiva permette di:</p>',
        '<ul><li>mobilizzare l’articolazione in sicurezza</li><li>ridurre il dolore dopo le sedute</li><li>controllare l’edema</li><li>migliorare la risposta ai trattamenti riabilitativi</li><li>accelerare i tempi di recupero</li></ul>',
        '<p>Per ottenere il massimo beneficio è consigliabile utilizzare la crioterapia prima o dopo le sessioni di mobilizzazione passiva, secondo indicazione del medico o fisioterapista.</p>',
        '<h4><strong>Perché scegliere il noleggio a domicilio di kinetec e crioterapia compressiva&nbsp;</strong></h4>',
        '<p>Il noleggio consente di:</p>',
        '<ul><li>effettuare il trattamento ogni giorno</li><li>ripetere le sedute anche più volte al giorno</li><li>evitare i limiti delle sedute ambulatoriali</li><li>ridurre i costi complessivi</li><li>adattare la durata alle reali esigenze cliniche</li><li>prorogare il noleggio in base all’andamento del recupero</li></ul>',
        '<p>Il percorso riabilitativo non è uguale per tutti e richiede continuità.</p>',
        '<h4><strong>Consegna, montaggio e ritiro</strong></h4>',
        '<ul><li>Consegna gratuita in tutta Italia per noleggi da 30 giorni</li><li>Consegna e Ritiro in magazzino gratuito</li><li>Consegna a domicilio in tutta Italia a partire da 15 € + 15 € per il ritiro</li></ul>',
        '<p><strong>Formazione e assistenza</strong></p>',
        '<p>Con il noleggio vengono fornite:</p>',
        '<ul><li>formazione completa all’utilizzo</li><li>indicazioni personalizzate</li><li>assistenza tecnica continua</li><li>supporto anche dopo la consegna</li></ul>',
        '<p>Il paziente può così svolgere la terapia in modo&nbsp;<strong>efficace, sicuro e confortevole direttamente a casa</strong>.</p>',
        '<h3><strong>Perché scegliere Mia Medical Italia</strong></h3>',
        '<ul><li>tecnici esperti e servizio personalizzato</li><li>tempi rapidi di consegna, anche entro 24–48 ore</li><li>prezzi chiari e trasparenti</li><li>dispositivi sanificati e certificati</li><li>programmazione personalizzata dei parametri</li><li>assistenza continua durante tutto il noleggio</li></ul>',
        '<p>Scegliere Mia Medical Italia significa affidarsi a un partner competente nel percorso di riabilitazione domiciliare.</p>',
        '<p>Per ulteriori informazioni puoi contattarci telefonicamente al <strong><a href="https://wa.me/393926509237">+39 3926509237</a></strong> oppure scriverci su WhatsApp. Il nostro personale specializzato è sempre disponibile per aiutarti a individuare la soluzione più adatta alle tue esigenze.</p>',
        '<p>Ti interessano i noleggi combinati? Leggi di più sull&#8217;articolo del nostro blog sui noleggi combinati di Mia Medical Italia: <a href="/trasforma-la-tua-casa-per-terapia-a-domicilio-noleggio-ausili-medicali/">Leggi qui.</a></p>',
      ].join(''),
    },
    en: {
      title: 'Kinetec knee CPM + cryotherapy, combined hire',
      slug: 'noleggio-kinetec-ginocchio-e-crioterapia',
      shortDescription: 'Kinetec knee rental combined with compression cryotherapy Free delivery for 30-day rentals, all over Italy! For shorter rental periods home delivery throughout Italy from 15€ + 15€ for collection. Remember to request the knee brace and cryotherapy accessories when booking, so that you receive everything you need to start therapy immediately. No deposit required!',
      metaTitle: 'Kinetec knee + cryotherapy combined hire',
      metaDescription: 'Combined hire of a knee CPM machine and compression cryotherapy — an excellent pairing for a fast recovery. Call +39 392 650 9237',
      description: [
        '<h2><strong><br />Kinetec Knee and Cryotherapy Compressions Combination Hire</strong></h2>',
        '<p><strong>The complete solution for post-operative and post-traumatic knee recovery</strong></p>',
        '<p>During the initial stages of knee rehabilitation, it is crucial to intervene early and continuously to reduce pain, inflammation and joint stiffness.</p>',
        '<p>The&nbsp;<strong>rental combined Kinetec Knee + Compression Cryotherapy</strong>&nbsp;of Mia Medical Italia was created to offer complete treatment directly at home, combining&nbsp;<strong>continuous passive mobilisation (CPM)</strong>&nbsp;e&nbsp;<strong>controlled cryotherapy treatment</strong>.</p>',
        '<p>This combination allows simultaneous work on joint mobility, pain management and oedema control, promoting faster and safer recovery.</p>',
        '<h3><strong>For whom the combined Kinetec Knee and Cryotherapy Compressions rental is indicated</strong></h3>',
        '<p>The package is suitable for patients facing:</p>',
        '<ul><li>post-operative knee recovery</li><li>post-traumatic rehabilitation</li><li>complex orthopaedic interventions</li><li>early rehabilitation phase</li><li>persistent pain and swelling</li><li>reduction in joint range</li></ul>',
        '<p><strong>Main usage scenarios</strong></p>',
        '<ul><li>total or partial knee replacement</li><li>meniscal lesions</li><li>sports injuries</li><li>joint sprains</li><li>post-surgical oedema</li></ul>',
        '<p>It is a particularly suitable solution in&nbsp;<strong>first weeks after surgery</strong>, when active movement is limited but it is necessary to keep the joint working.</p>',
        '<h3><strong>What combined hire consists of</strong></h3>',
        '<p>The package includes two professional electro-medical devices, widely used in orthopaedic rehabilitation protocols.</p>',
        '<h4><strong><a href="/en/rental-catalog/">Kinetec Knee : Continuous passive mobiliser (CPM)</a></strong></h4>',
        '<p>The Kinetec is a medical device designed for continuous passive mobilisation of the knee joint. The movement occurs automatically, without voluntary muscle contraction on the part of the patient.</p>',
        '<p><strong>Main functions</strong></p>',
        '<ul><li>controlled knee flexion and extension</li><li>gradual adjustment of the joint angle</li><li>continuous and repetitive movement</li><li>use in the early post-operative phase</li></ul>',
        '<p><strong>Clinical benefits</strong></p>',
        '<ul><li>prevention of joint stiffness</li><li>reduction of adhesions</li><li>progressive recovery of range of motion</li><li>decreased post-operative pain</li><li>reduction of oedema</li><li>improvement of local circulation</li></ul>',
        '<p>Kinetec is often prescribed already in the first few days after surgery, when active movement is not yet allowed.</p>',
        '<p><strong>Technical specifications : Kinetec Knee model Classic</strong></p>',
        '<ul><li>Power supply: 220 V</li><li>Movement range: extension/flexion from -10° to 120°.</li><li>Speed: adjustable from 5% to 100%</li><li>Key lock: prevents accidental parameter changes</li><li>Timer: 1-59 minutes / 1-24 hours / continuous use</li><li>Warm-up programme: included</li><li>Therapy duration monitoring: cumulative session counting</li><li>Load reversal in phases: adjustable from 1 to 25 (safety system)</li><li>Adjustment for transport: easy positioning of the splint</li><li>Dimensions: 97 × 36 × 23 cm</li><li>Supported patient height: 120 - 200 cm</li><li>Weight: 11 kg</li></ul>',
        '<h4><strong><a href="/en/rental-catalog/">CryoPus compression cryotherapy</a>h</strong></h4>',
        '<p>Compression cryotherapy is an advanced treatment that combines&nbsp;<strong>therapeutic cold and controlled pneumatic compression</strong>.</p>',
        '<p>The CryoPush system allows for a localised and constant application of cold, improving effectiveness compared to traditional cryotherapy.</p>',
        '<p><strong>Benefits of cryotherapy compression</strong></p>',
        '<ul><li>reduction of pain</li><li>decrease in inflammation</li><li>swelling control</li><li>acceleration of tissue recovery</li><li>immediate relief in acute phases</li></ul>',
        '<p>The action of cold causes local vasoconstriction that limits inflammatory processes and promotes faster tissue regeneration.</p>',
        '<p><strong>Technical characteristics: CryoPush</strong></p>',
        '<ul><li>Portable system with adjustable pneumatic compression</li><li>Silent and intuitive operation</li><li>Constant temperature controlled according to the ice inserted</li><li>Integrated timer for session management</li><li>Anatomical applicators available for knee, shoulder, ankle, hip, lumbar area</li><li>High-capacity coolant tank</li><li>Digital display for time, temperature and compression control</li></ul>',
        '<h3><strong>Kinetec rental and compression cryotherapy: a more effective combined treatment</strong></h3>',
        '<p>The combination of Kinetec and compression cryotherapy makes it possible to</p>',
        '<ul><li>mobilising the joint safely</li><li>reduce pain after sessions</li><li>controlling oedema</li><li>improve response to rehabilitation treatments</li><li>speed up recovery time</li></ul>',
        '<p>For maximum benefit, it is advisable to use cryotherapy before or after passive mobilisation sessions, according to the doctor\'s or physiotherapist\'s instructions.</p>',
        '<h4><strong>Why choose kinetec and cryotherapy compression home hire&nbsp;</strong></h4>',
        '<p>The rental allows</p>',
        '<ul><li>carry out the treatment every day</li><li>repeat sessions even several times a day</li><li>avoid the limits of outpatient sessions</li><li>reduce overall costs</li><li>adapt the duration to actual clinical needs</li><li>extend the rental based on the recovery trend</li></ul>',
        '<p>The rehabilitation path is not the same for everyone and requires continuity.</p>',
        '<h4><strong>Delivery, assembly and collection</strong></h4>',
        '<ul><li>Free delivery throughout Italy for rentals from 30 days</li><li>Free delivery and pick-up</li><li>Home delivery throughout Italy from 15 € + 15 € for collection</li></ul>',
        '<p><strong>Training and assistance</strong></p>',
        '<p>With the rental comes</p>',
        '<ul><li>comprehensive user training</li><li>customised indications</li><li>continuous technical assistance</li><li>support even after delivery</li></ul>',
        '<p>The patient can thus carry out the therapy in&nbsp;<strong>effective, safe and comfortable right at home</strong>.</p>',
        '<h3><strong>Why choose Mia Medical Italia</strong></h3>',
        '<ul><li>expert technicians and personalised service</li><li>fast delivery times, even within 24-48 hours</li><li>clear and transparent prices</li><li>sanitised and certified devices</li><li>customised parameter programming</li><li>continuous assistance throughout the rental</li></ul>',
        '<p>Choosing Mia Medical Italia means relying on a competent partner in home rehabilitation.</p>',
        '<p>For further information you can contact us by phone at <strong><a href="https://wa.me/393926509237">+39 3926509237</a></strong> or write to us on WhatsApp. Our specialised staff is always available to help you find the best solution for your needs.</p>',
        '<p>Are you interested in combined rentals? Read more in our blog article on Mia Medical Italia\'s combined rentals: <a href="/en/trasforma-la-tua-casa-per-terapia-a-domicilio-noleggio-ausili-medicali/">Read here.</a></p>',
      ].join(''),
    },
  },

  specs: {
    'range-of-motion': { it: 'Estensione/flessione da -10° a 120°', en: 'Extension and flexion from -10° to 120°' },
    'patient-height': { min: 120, max: 200 },
    'treatment-timer': { it: '1–59 minuti, 1–24 ore o uso continuo', en: '1–59 minutes, 1–24 hours or continuous' },
    programmes: { it: 'Inversione del carico in fasi regolabile da 1 a 25', en: 'Load reversal adjustable in 25 steps' },
    'total-length': { min: 97, max: 97 },
    'total-width': { min: 36, max: 36 },
    'total-height': { min: 23, max: 23 },
    weight: { min: 11, max: 11 },
    'power-supply': { it: '220 V', en: '220 V' },
  },

  media: {
    thumbnail: 'kinetec-and-cryotherapy-1.png',
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
