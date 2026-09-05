/**
 * Kinetec Artromot K1 Ginocchio Anca
 *
 * /prodotto/noleggio-kinetec-artromot-k1-ginocchio-anca-riabilitazione/
 * WooCommerce product 8936. No specification block on the page; nothing is
 * borrowed from the sibling CPM machines.
 *
 * Delivery 30 € out and 30 € back, Rome and Florence only, free from 30 days.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { kinetecHire } from './category.ts';

export const artromotK1 = kinetecHire.rental({
  code: 'artromot-k1',
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
      title: 'Kinetec Artromot K1 Ginocchio Anca',
      slug: 'noleggio-kinetec-artromot-k1-ginocchio-anca-riabilitazione',
      shortDescription: 'I ritiri in magazzino sono Gratuiti Chiamaci o prenota online subito! Consegna a domicilio solo a Roma e Firenze: 30€ + 30€ per il ritiro. Consegna gratis se acquisti un noleggio per un minimo di 30 giorni.',
      metaTitle: 'Noleggio Kinetec Artromot K1 per riabilitazione ginocchio e anca',
      metaDescription: 'Noleggio Kinetec Artromot K1 per riabilitazione del ginocchio e anca a partire da 8,00€ al giorno. Consegna a domicilio. Prenota ora online!',
      description: [
        '<p>Scopri il servizio di <strong>noleggio</strong> del <strong>Kinetec</strong><strong><a href="https://www.chattanoogarehab.com/it/artromot-k1-80-00-04x-it">Artromot K1</a></strong>: un apparecchio per la <strong>mobilizzazione passiva continua (CPM)</strong>, progettato per favorire la <strong>riabilitazione delle articolazioni del ginocchio e dell’anca in fase post-operatoria o post-traumatica</strong>.</p>',
        '<p>È la soluzione ideale per chi desidera <strong>recuperare mobilità e funzionalità in modo efficace, sicuro e comodo, direttamente a casa.</strong></p>',
        '<h4>Cosa è l’Artromot K1 e come funziona</h4>',
        '<p><strong>Artromot k1&nbsp;per ginocchio CPM</strong>&nbsp;(Continuous Passive Motion) consente di eseguire in modo automatico e controllato <strong>movimenti passivi di flessione ed estensione</strong>, sia del <strong>ginocchio</strong> che <strong>dell’anca</strong>, <strong>senza alcuno sforzo attivo da parte del paziente</strong> nelle fasi di recupero e riabilitazione e dopo traumi o interventi chirurgici. Favorisce&nbsp;un rapido ritorno alle funzionalità delle articolazioni e previene la rigidità. Inoltre, migliora le proprietà meccaniche dei legamenti danneggiati e stimola la circolazione linfatica e sanguigna diminuendo il rischio di trombosi ed emboli.</p>',
        '<ul><li>mobilizza delicatamente le articolazioni in modo progressivo;</li><li>favorisce il recupero articolare dopo interventi ortopedici;</li><li>riduce dolore, rigidità e gonfiore;</li><li>accelera il processo di guarigione;</li><li>consente di personalizzare i parametri di movimento (angoli, velocità, durata) in base alla terapia prescritta.</li><li>FLESSIONE GINOCCHIO &#8211; 10° /0°/120° ESTENSIONE/FLESSIONE ANCA 0°/7°/115°</li></ul>',
        '<h4>A chi consigliamo di usufruire del servizio di noleggio del Kinetec Artromot K1</h4>',
        '<p>Il noleggio del Kinetec per CPM Artromot K1 è indicato in tutti i casi in cui è necessario recuperare mobilità articolare dopo un intervento o un trauma, come:</p>',
        '<ul><li>protesi totale o parziale di ginocchio o anca;</li><li>interventi ai legamenti crociati o menischi;</li><li>fratture articolari;</li><li>rigidità articolare;</li><li>riabilitazione ortopedica in pazienti anziani o con ridotta mobilità.</li></ul>',
        '<h4>Consegna, dimostrazione e programmazione su misura </h4>',
        '<p>Quando noleggi l’Artromot K1 da M.I.A. Medical Italia, pensiamo a tutto noi.</p>',
        '<p>Il nostro personale tecnico:</p>',
        '<ul><li>consegna il dispositivo a domicilio;</li><li>esegue una dimostrazione completa del funzionamento;</li><li>programma il macchinario in base al protocollo indicato dal medico o fisioterapista;</li><li>fornisce istruzioni chiare su come integrarlo nella tua routine riabilitativa.</li></ul>',
        '<p>Se non possiedi un protocollo riabilitativo relativo al tuo intervento, puoi richiederlo gratuitamente online o direttamente al nostro terapista.</p>',
        '<h4>Perché conviene il noleggio?</h4>',
        '<p>Le terapie CPM funzionano solo se protratte con costanza e frequenza nel tempo. Poche sedute occasionali in studio non sono sufficienti per ottenere risultati efficaci.</p>',
        '<p>Con il noleggio:</p>',
        '<ul><li>puoi seguire la terapia comodamente da casa;</li><li>integri il trattamento nella tua routine quotidiana, senza stress o spostamenti;</li><li>risparmi rispetto al costo cumulativo di più sedute fisioterapiche in struttura;</li><li>ottieni un recupero più rapido e continuo.</li></ul>',
        '<p>L&#8217;utilizzo di&nbsp;<strong>Artromot k1</strong>&nbsp;non comporta<strong>&nbsp;nessun trauma o dolore</strong>&nbsp;al paziente.</p>',
        '<h4>Perché scegliere M.I.A Medical Italia?</h4>',
        '<ul><li>Tecnici esperti e servizio personalizzato;</li><li>Tempi rapidi di consegna, anche in 24h;</li><li>Prezzi imbattibili e trasparenti;</li><li>Dispositivi sanificati, sicuri e programmati su misura;</li><li>Assistenza continua anche dopo la consegna.</li></ul>',
        '<p>Artromot k1&nbsp;grazie ad un movimento anatomico corretto ed un sistema elettronico&nbsp;<strong>molto affidabile</strong>. Rappresenta la&nbsp;<strong>soluzione ideale</strong>&nbsp;per raggiungere risultati terapeutici ottimali nei trattamenti di&nbsp;<strong>riabilitazione domiciliare</strong>.</p>',
        '<p>Scegli il comfort della <strong>riabilitazione a casa</strong>, con un <strong>servizio sicuro, efficace e conveniente.</strong> Se hai ulteriori domande puoi contattarci telefonicamente al <strong>+39 3926509237</strong> o puoi mandarci un messaggio su <strong><a href="https://wa.me/393926509237">whatsapp</a></strong>. Il nostro personale specializzato è sempre disponibile ad aiutarti a trovare la <strong>soluzione</strong> che meglio si adatta alle tue <strong>esigenze</strong>! Inoltre, visita il nostro <strong><a href="/?_gl=1*1bx2a6k*_up*MQ..*_ga*MjA0NTM0ODc4NS4xNzUxMTA5Nzg0*_ga_D9FZ9V3LL7*czE3NTExMDk3ODQkbzEkZzAkdDE3NTExMDk3ODQkajYwJGwwJGgw">sito web</a></strong> per scoprire la vasta gamma di <strong>ausili medicali pensati per aiutarti a riscoprire la libertà di muoverti con autonomia!</strong></p>',
      ].join(''),
    },
    en: {
      title: 'Kinetec Artromot K1 knee and hip CPM, for hire',
      slug: 'noleggio-kinetec-artromot-k1-ginocchio-anca-riabilitazione',
      shortDescription: 'Collection at the warehouse is free. Call us or book online now! Home delivery in Rome and Florence only: €30 out and €30 back. Free delivery on hires of 30 days or more.',
      metaTitle: 'Kinetec Artromot K1 hire for knee and hip rehabilitation',
      metaDescription: 'Kinetec Artromot K1 hire for knee and hip rehabilitation from €8.00 a day, delivered to your door. Book online.',
      description: [
        '<p>Discover the service of <strong>rental</strong> of <strong>Kinetec</strong><strong><a href="https://www.chattanoogarehab.com/it/artromot-k1-80-00-04x-it">Artromot K1</a></strong>an apparatus for the <strong>continuous passive mobilisation (CPM)</strong>designed to promote the <strong>rehabilitation of knee and hip joints in the post-operative or post-traumatic phase</strong>.</p>',
        '<p>It is the ideal solution for those who want to <strong>regain mobility and functionality in an effective, safe and comfortable way, right at home.</strong></p>',
        '<h4>What the Artromot K1 is and how it works</h4>',
        '<p><strong>Artromot k1 for CPM knee</strong>&nbsp;(Continuous Passive Motion) enables automatic and controlled <strong>passive flexion and extension movements</strong>both of the <strong>knee</strong> which <strong>of the hip</strong>, <strong>without any active effort on the part of the patient</strong> in recovery and rehabilitation phases and after trauma or surgery. It promotes a rapid return to joint function and prevents stiffness. In addition, it improves the mechanical properties of damaged ligaments and stimulates the lymphatic and blood circulation, decreasing the risk of thrombosis and emboli.</p>',
        '<ul><li>gently mobilises the joints in a progressive manner;</li><li>promotes joint recovery after orthopaedic surgery;</li><li>reduces pain, stiffness and swelling;</li><li>accelerates the healing process;</li><li>allows customisation of movement parameters (angles, speed, duration) according to the prescribed therapy.</li><li>KNEE FLEXION - 10° /0°/120° HIP EXTENSION/FLEXION 0°/7°/115°</li></ul>',
        '<h4>Who we recommend the Kinetec Artromot K1 rental service for</h4>',
        '<p>The Kinetec for CPM Artromot K1 is indicated in all cases where joint mobility needs to be regained after surgery or trauma, such as:</p>',
        '<ul><li>total or partial knee or hip replacement;</li><li>cruciate ligament or meniscus surgery;</li><li>joint fractures;</li><li>joint stiffness;</li><li>orthopaedic rehabilitation in elderly patients or patients with reduced mobility.</li></ul>',
        '<h4>Customised delivery, demonstration and programming </h4>',
        '<p>When you rent the Artromot K1 from M.I.A. Medical Italia, we take care of everything.</p>',
        '<p>Our technical staff:</p>',
        '<ul><li>delivers the device at home;</li><li>performs a full demonstration of operation;</li><li>programme the machine according to the protocol indicated by the doctor or physiotherapist;</li><li>provides clear instructions on how to integrate it into your rehabilitation routine.</li></ul>',
        '<p>If you do not have a rehabilitation protocol for your operation, you can request it free of charge online or directly from our therapist.</p>',
        '<h4>Why does it pay to rent?</h4>',
        '<p>CPM therapies only work if they are carried out consistently and frequently over time. A few occasional sessions in the studio are not enough to achieve effective results.</p>',
        '<p>With rental:</p>',
        '<ul><li>you can follow the therapy from the comfort of your home;</li><li>integrate the treatment into your daily routine, without stress or travel;</li><li>savings compared to the cumulative cost of several physiotherapy sessions in a facility;</li><li>you achieve faster and more continuous recovery.</li></ul>',
        '<p>The use of&nbsp;<strong>Artromot k1</strong>&nbsp;does not entail<strong>&nbsp;no trauma or pain</strong>&nbsp;to the patient.</p>',
        '<h4>Why choose M.I.A Medical Italia?</h4>',
        '<ul><li>Experienced technicians and personalised service;</li><li>Fast delivery times, even within 24 hours;</li><li>Unbeatable and transparent prices;</li><li>Sanitised, safe and customised devices;</li><li>Continuous support even after delivery.</li></ul>',
        '<p>Artromot k1 thanks to anatomically correct movement and an electronic system&nbsp;<strong>very reliable</strong>. It represents the&nbsp;<strong>ideal solution</strong>&nbsp;to achieve optimal therapeutic results in the treatment of&nbsp;<strong>home rehabilitation</strong>.</p>',
        '<p>Choose the comfort of <strong>rehabilitation at home</strong>with a <strong>safe, effective and convenient service.</strong> If you have further questions you can contact us by phone at <strong>+39 3926509237</strong> or you can send us a message on <strong><a href="https://wa.me/393926509237">whatsapp</a></strong>. Our specialised staff is always available to help you find the <strong>solution</strong> that best suits your <strong>needs</strong>! Also, visit our <strong><a href="/en/?_gl=1*1bx2a6k*_up*MQ..*_ga*MjA0NTM0ODc4NS4xNzUxMTA5Nzg0*_ga_D9FZ9V3LL7*czE3NTExMDk3ODQkbzEkZzAkdDE3NTExMDk3ODQkajYwJGwwJGgw">website</a></strong> to discover the wide range of <strong>medical aids designed to help you rediscover the freedom to move independently!</strong></p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: 'artromot-k1-1.jpg',
    gallery: [
      'artromot-k1-2.png',
    ],
  },

  addons: [homeDeliveryOnly(30), homeCollection(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
