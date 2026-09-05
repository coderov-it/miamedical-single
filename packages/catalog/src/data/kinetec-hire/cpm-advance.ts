/**
 * Noleggio Kinetec CPM ADVANCE Ginocchio Anca
 *
 * /prodotto/noleggio-kinetec-cpm-advance-ginocchio-anca/
 * WooCommerce product 12192, priced identically to the Artromot K1. No
 * specification block on the page.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { kinetecHire } from './category.ts';

export const cpmAdvance = kinetecHire.rental({
  code: 'cpm-advance',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 150),
    days(20, 200),
    days(30, 260),
    days(60, 480),
  ],

  translations: {
    it: {
      title: 'Noleggio Kinetec CPM ADVANCE Ginocchio Anca',
      slug: 'noleggio-kinetec-cpm-advance-ginocchio-anca',
      shortDescription: 'Ritiro e consegna a domicilio Il ritiro in magazzino è GRATUITO. Chiamaci o prenota online subito! Consegna a domicilio solo a Roma e Firenze: 30€ + 30€ per il ritiro. Consegna gratis se acquisti un noleggio per un minimo di 30 giorni.',
      metaTitle: 'Noleggio Kinetec CPM ADVANCE Ginocchio-Anca',
      metaDescription: 'Noleggio Kinetec CPM ADVANCE a partire da 8,00€ al giorno.Consegna a domicilio. Apparecchi sicuri, affidabili e facili da usare, prenota ora online!',
      description: [
        '<p>Noleggio Kinetec CPM ADVANCE, dispositivo avanzato per la mobilizzazione passiva continua (CPM) delle articolazioni del ginocchio e dell’anca, pensato per accompagnare il paziente nel delicato percorso di recupero post-operatorio o post-traumatico.</p>',
        '<p>Grazie alla sua tecnologia avanzata e all’elevata adattabilità, è una scelta eccellente per chi desidera riabilitarsi in modo efficace, sicuro e confortevole direttamente a casa.</p>',
        '<p><strong>Cos’è il Kinetec CPM ADVANCE e come funzion</strong>a </p>',
        '<p>Il Kinetec CPM ADVANCE è progettato per guidare il movimento dell’articolazione senza sforzi attivi da parte del paziente. Questo permette di mobilizzare il ginocchio e l’anca in modo dolce e controllato, prevenendo rigidità e complicazioni dopo un intervento.</p>',
        '<p>Le sue caratteristiche principali includono:</p>',
        '<ul><li>Movimento passivo controllato di flessione ed estensione;</li><li>Programmazione personalizzata di ampiezza, velocità e durata;</li><li>Possibilità di trattare sia ginocchio che anca con un unico dispositivo;</li><li>Interfaccia intuitiva e massima sicurezza per il paziente.</li><li>FLESSIONE GINOCCHIO – 10° /0°/120° ESTENSIONE/FLESSIONE ANCA 0°/7°/115°</li></ul>',
        '<h4><p><strong>A chi è consigliato il Kinetec CPM ADVANCE?</strong></h4>',
        '<p>Il dispositivo è indicato per tutti i pazienti che necessitano di riabilitazione passiva dell’articolazione del ginocchio o dell’anca, in particolare nei seguenti casi:</p>',
        '<ul><li>Protesi totale o parziale di ginocchio o anca;</li><li>Interventi chirurgici ai legamenti o al menisco;</li><li>Fratture articolari e traumi;</li><li>Rigidità articolare post-immobilizzazione;</li><li>Pazienti anziani con mobilità ridotta;</li><li>Riabilitazione post-chirurgica a lungo termine.</li></ul>',
        '<h4><p><strong>Installazione, assistenza e programmazione a domicilio</strong></h4>',
        '<p>Con M.I.A. Medical, il noleggio è semplice, rapido e completo:</p>',
        '<ul><li>consegniamo il Kinetec CPM ADVANCE direttamente a casa tua;</li><li>i nostri tecnici qualificati ti mostrano passo dopo passo come utilizzarlo;</li><li>programmiamo il macchinario su misura, in base alla prescrizione medica o alle esigenze specifiche del paziente;</li><li>restiamo disponibili anche dopo la consegna per ogni esigenza o supporto.</li></ul>',
        '<h4><p><strong>Perché conviene noleggiare un CPM Kinetec?</strong></h4>',
        '<p>Le terapie CPM sono efficaci solo se costanti e praticate nel tempo. Sedute occasionali presso il fisioterapista non sono sufficienti per ottenere risultati duraturi.</p>',
        '<p>Con il noleggio del CPM Kinetec CPM ADVANCE:</p>',
        '<ul><li>hai il dispositivo a disposizione ogni giorno, a casa tua;</li><li>puoi fare la terapia secondo i tuoi ritmi, in totale autonomia;</li><li>risparmi tempo e denaro rispetto a terapie esterne;</li><li>ottieni un recupero più veloce, confortevole e regolare.</li></ul>',
        '<h4><p><strong>Perché scegliere M.I.A. Medical?</strong></h4>',
        '<p>Con noi hai la sicurezza di:</p>',
        '<ul><li>qualità professionale certificata;</li><li>prezzi imbattibili e nessun costo nascosto;</li><li>personale tecnico esperto e disponibile;</li><li>macchinari sanificati e pronti all’uso;</li><li>consegne rapide e assistenza continua anche dopo l’installazione.</li></ul>',
        '<p>Scegli il comfort della <strong>riabilitazione a casa</strong>, con un <strong>servizio sicuro, efficace e conveniente.</strong> Se hai ulteriori domande puoi contattarci telefonicamente al <strong><a href="tel:+39 3926509237">+39 3926509237</a></strong> o puoi mandarci un messaggio su <strong><a href="https://wa.me/393926509237">whatsapp</a></strong>. Il nostro personale specializzato è sempre disponibile ad aiutarti a trovare la <strong>soluzione</strong> che meglio si adatta alle tue <strong>esigenze</strong>! Inoltre, visita il nostro <strong><a href="/?_gl=1*1bx2a6k*_up*MQ..*_ga*MjA0NTM0ODc4NS4xNzUxMTA5Nzg0*_ga_D9FZ9V3LL7*czE3NTExMDk3ODQkbzEkZzAkdDE3NTExMDk3ODQkajYwJGwwJGgw">sito web</a></strong> per scoprire la vasta gamma di <strong>ausili medicali pensati per aiutarti a riscoprire la libertà di muoverti con autonomia!</strong></p>',
      ].join(''),
    },
    en: {
      title: 'Kinetec CPM ADVANCE knee and hip machine, for hire',
      slug: 'noleggio-kinetec-cpm-advance-ginocchio-anca',
      shortDescription: 'Collection and home delivery. Collection at the warehouse is FREE. Call us or book online now! Home delivery in Rome and Florence only: €30 out and €30 back. Free delivery on hires of 30 days or more.',
      metaTitle: 'Kinetec CPM ADVANCE knee and hip hire',
      metaDescription: 'Kinetec CPM ADVANCE hire from €8.00 a day, delivered to your door. Safe, reliable machines that are easy to use.',
      description: [
        '<p>Hire Kinetec CPM ADVANCE, an advanced device for continuous passive mobilisation (CPM) of the knee and hip joints, designed to accompany the patient through the delicate post-operative or post-traumatic recovery process.</p>',
        '<p>Thanks to its advanced technology and high adaptability, it is an excellent choice for those who want to rehabilitate effectively, safely and comfortably right at home.</p>',
        '<p><strong>What is the Kinetec CPM ADVANCE and how it works</strong>a </p>',
        '<p>The Kinetec CPM ADVANCE is designed to guide the movement of the joint without active effort on the part of the patient. This allows the knee and hip to be mobilised in a gentle and controlled manner, preventing stiffness and complications after surgery.</p>',
        '<p>Its main features include:</p>',
        '<ul><li>Controlled passive movement of flexion and extension;</li><li>Custom programming of amplitude, speed and duration;</li><li>Possibility of treating both knee and hip with a single device;</li><li>Intuitive interface and maximum patient safety.</li><li>KNEE FLEXION - 10° /0°/120° HIP EXTENSION/FLEXION 0°/7°/115°</li></ul>',
        '<h4><p><strong>To whom is the Kinetec CPM ADVANCE recommended?</strong></h4>',
        '<p>The device is indicated for all patients requiring passive rehabilitation of the knee or hip joint, particularly in the following cases:</p>',
        '<ul><li>Total or partial knee or hip replacement;</li><li>Ligament or meniscus surgery;</li><li>Joint fractures and traumas;</li><li>Post-immobilisation joint stiffness;</li><li>Elderly patients with reduced mobility;</li><li>Long-term post-surgical rehabilitation.</li></ul>',
        '<h4><p><strong>Installation, servicing and programming at home</strong></h4>',
        '<p>With M.I.A. Medical, rental is simple, fast and complete:</p>',
        '<ul><li>We deliver the Kinetec CPM ADVANCE directly to your home;</li><li>our qualified technicians show you step by step how to use it;</li><li>We customise the machine according to the doctor\'s prescription or the patient\'s specific needs;</li><li>we remain available after delivery for any needs or support.</li></ul>',
        '<h4><p><strong>Why is it worth hiring a Kinetec CPM?</strong></h4>',
        '<p>CPM therapies are only effective if they are constant and practised over time. Occasional sessions at the physiotherapist are not sufficient to achieve lasting results.</p>',
        '<p>With the rental of the Kinetec CPM ADVANCE:</p>',
        '<ul><li>you have the device at your disposal every day, at home;</li><li>you can do the therapy at your own pace, in total autonomy;</li><li>save time and money compared to external therapies;</li><li>you get faster, more comfortable and smoother recovery.</li></ul>',
        '<h4><p><strong>Why choose M.I.A. Medical?</strong></h4>',
        '<p>With us you have the security of:</p>',
        '<ul><li>certified professional quality;</li><li>unbeatable prices and no hidden costs;</li><li>experienced and helpful technical staff;</li><li>machinery sanitised and ready for use;</li><li>quick delivery and continuous support even after installation.</li></ul>',
        '<p>Choose the comfort of <strong>rehabilitation at home</strong>with a <strong>safe, effective and convenient service.</strong> If you have further questions you can contact us by phone at <strong><a href="tel:+39 3926509237">+39 3926509237</a></strong> or you can send us a message on <strong><a href="https://wa.me/393926509237">whatsapp</a></strong>. Our specialised staff is always available to help you find the <strong>solution</strong> that best suits your <strong>needs</strong>! Also, visit our <strong><a href="/en/?_gl=1*1bx2a6k*_up*MQ..*_ga*MjA0NTM0ODc4NS4xNzUxMTA5Nzg0*_ga_D9FZ9V3LL7*czE3NTExMDk3ODQkbzEkZzAkdDE3NTExMDk3ODQkajYwJGwwJGgw">website</a></strong> to discover the wide range of <strong>medical aids designed to help you rediscover the freedom to move independently!</strong></p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: 'cpm-advance-1.jpg',
    gallery: [
      'cpm-advance-2.png',
    ],
  },

  addons: [homeDeliveryOnly(30), homeCollection(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
