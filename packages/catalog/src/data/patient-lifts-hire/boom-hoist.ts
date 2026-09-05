/**
 * Noleggio Sollevatore elettrico con asta
 *
 * /prodotto/sollevatore-elettrico-forfait-imbattibili/
 * WooCommerce product 8852. The `Motore` attribute names Linak, which is the
 * actuator maker rather than the hoist's own brand, so it is recorded as the
 * motor spec and not as `brand`.
 *
 * Delivery from 45 €, free on hires of 60 days or more. No deposit.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { patientLiftsHire } from './category.ts';

export const boomHoist = patientLiftsHire.rental({
  code: 'boom-hoist',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 80),
    days(30, 120),
    days(60, 200),
    days(90, 250),
  ],

  translations: {
    it: {
      title: 'Noleggio Sollevatore elettrico con asta',
      slug: 'sollevatore-elettrico-forfait-imbattibili',
      shortDescription: 'Noleggio sollevatore elettrico con imbracatura. Consegna a Roma e Firenze a partire da 45€. Consegna gratuita per i noleggi da 60 giorni ! Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Sollevatore elettrico con asta: noleggio da 2,50€ al giorno',
      metaDescription: 'Noleggio Sollevatore elettrico con asta per anziani e persone con disabilità. Contattaci al +39 392 65 09 237 per maggiori informazioni.',
      description: [
        '<h3>Sollevatore elettrico con asta per anziani e disabili: per chi assiste ogni giorno con cura, forza e responsabilità.</h3>',
        '<p>Assistere una persona con mobilità ridotta è una missione che richiede attenzione, competenza e gli strumenti giusti. Il servizio di noleggio del <strong>sollevatore elettrico con asta MUEVO RI828</strong> è stato progettato per garantire massima sicurezza e potenza anche nei trasferimenti più complessi, supportando utenti fino a 200 kg di peso. Si tratta di un <strong>sollevatore per anziani e per persone con disabilità</strong>, una soluzione resistente, affidabile e pensata per agevolare il lavoro di caregiver e operatori sanitari a domicilio o in clinica.</p>',
        '<h4>Un aiuto concreto per chi si prende cura degli altri</h4>',
        '<blockquote><p>L’utilizzo di un <strong>Sollevatore Elettrico con asta </strong>è particolarmente utile quando il paziente è impossibilitato a spostarsi ad esempio da carrozzina a letto, o da carrozzina a poltrona, poiché le sue condizioni di salute gli inibiscono sia la movimentazione attiva che passiva, si può ricorrere al sollevatore per disabili. Questo modello offre:</p></blockquote>',
        '<ul><li><strong>Alta capacità di sollevamento:</strong> questo sollevatore elettrico con asta supporta fino a 200 kg, ideale anche per pazienti bariatrici.</li><li><strong>Base regolabile in larghezza</strong>: si adatta facilmente a spazi domestici ristretti o stanze attrezzate.</li><li><strong>Struttura smontabile</strong>&nbsp;in acciaio verniciato: resistente ma semplice da montare e trasportare.</li><li><strong>Sicurezza integrata</strong>: discesa d’emergenza manuale, pulsante di stop e protezione antischiacciamento.</li><li><strong>Batteria a lunga durata</strong>: più di 40 cicli completi a pieno carico con una sola ricarica.</li><li><strong>Avvisi visivi e acustici</strong>: segnalano in modo chiaro quando la batteria è da ricaricare.</li></ul>',
        '<h4>Specifiche Tecniche del Sollevatore Elettrico con Asta ad alta Portata</h4>',
        '<ul><li><strong>Motore elettrico TiMotion</strong></li><li><strong>Portata massima</strong>: 200 kg</li><li><strong>Struttura</strong>: acciaio verniciato con impugnature in poliuretano</li><li><strong>Ruote piroettanti da 10 cm</strong>, due con freno</li><li><strong>Apertura gambe manuale a leva</strong></li><li><strong>Batteria estraibile con segnalatore di scarica</strong></li></ul>',
        '<p>Clicca <a href="/wp-content/uploads/2022/12/sollevatore-con-asta-.pdf?_gl=1*1rhhl60*_up*MQ..*_ga*ODE3OTQwNDIwLjE3NDQ0NjU4ODI.*_ga_D9FZ9V3LL7*MTc0NDQ2NTg4Mi4xLjEuMTc0NDQ2NTg5Mi4wLjAuMA..">qui</a> per consultare la scheda tecnica completa. </p>',
        '<h4>Per chi è pensato il noleggio del sollevatore elettrico MUEVO RI828?</h4>',
        '<p>Il <strong>sollevatore elettrico con asta</strong> è la scelta ideale per:</p>',
        '<ul><li><strong>Caregiver domiciliari</strong>&nbsp;che gestiscono pazienti con mobilità assente o fortemente ridotta.</li><li><strong>Famiglie che assistono persone con disabilità o patologie complesse</strong>&nbsp;che richiedono massima sicurezza nei trasferimenti.</li><li>Situazioni di&nbsp;<strong>assistenza post-operatoria</strong>&nbsp;o di lunga degenza in ambito domestico.</li><li>Ambienti residenziali dove è necessario un dispositivo&nbsp;<strong>robusto ma maneggevole</strong>.</li><li><strong>Cliniche</strong> ed <strong>ospedali</strong> che vogliono garantire il massimo della sicurezza e del confort ai propri pazienti.</li></ul>',
        '<h4>Migliora le qualità dell’assistenza, riduci lo sforzo fisico </h4>',
        '<p>Il servizio di noleggio del sollevatore elettrico con asta MUEVO RI828 è un alleato silenzioso che permette di evitare sforzi eccessivi, ridurre il rischio di infortuni e affrontare la giornata con maggiore serenità. Ogni trasferimento diventa più sicuro per chi lo riceve e più gestibile per chi lo esegue.</p>',
        '<p>Il nostro servizio di noleggio del <strong>sollevatore elettrico con asta</strong> è pensato come <strong>investimento intelligente</strong> per proteggere la <strong>salute</strong> di chi assiste e migliorare il benessere di chi viene assistito.</p>',
        '<p>Visita il nostro <strong><a href="/catalogo-noleggio/">sito</a></strong> per scoprire la vasta gamma di Mia Medical Italia e contattaci per avere una <strong>consulenza gratuita</strong>, senza impegno, per capire quale modello si adatta meglio alle tue esigenze e a quelle di chi assisti.</p>',
        '<h4>Perché scegliere il servizio di noleggio Mia Medical Italia per il noleggio del tuo sollevatore elettrico</h4>',
        '<p>Scegliendo noi come alleati per il tuo noleggio:</p>',
        '<ul><li>Hai <strong>assistenza personalizzata</strong> e <strong>consegna del dispositivo direttamente a casa tua</strong>.</li><li>Trovi <strong>dispositivi igienizzati, sicuri e controllati</strong> da personale qualificato.</li><li>Hai <strong>supporto locale immediato</strong>, sia a Roma che Firenze.</li><li>Prenoti in modo <strong>facile</strong>, con <strong>tariffe trasparenti</strong> e <strong>opzioni flessibili</strong> in base alle tue necessità.</li><li><strong><a href="https://www.morettispa.com/prodotto/sollevamalati-in-acciaio-verniciato-elettrico-timotion-modello-ingombro-standard-apertura-gambe-a-leva-portata-max-150-kg/">Dispositivi di ultima generazione e migliore qualità sul mercato.</a></strong></li></ul>',
        '<p>Inoltre, se sei il caregiver di una persona non autosufficiente e hai bisogno di una mano, ti consigliamo di visitare il sito web del nostro <strong>infermiere</strong> di fiducia <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong>, specializzato nell’assistenza domiciliare, darà la possibilità ai vostri cari o pazienti di proseguire le cure necessarie dal comfort della loro abitazione! Non esitate a contattarlo. </p>',
        '<h4>Come noleggiare il tuo sollevatore elettrico con asta per anziani e persone con disabilità</h4>',
        '<p><strong><a href="https://wa.me/393926509237">Contattaci</a></strong> oggi per il noleggio del sollevatore elettrico con asta per anziani e persone con disabilità. Ti daremo isponibilità e preventivo. Contattaci Inoltre, se ancora non ti abbiamo convinto, chiamaci subito al numero <strong><a href="https://wa.me/393926509237">+39 392 65 09 237.</a></strong> Il nostro <strong>team di specialisti</strong> del settore sarà pronto a rispondere a ogni tua domanda e chiarire ogni dubbio. <strong>Contattaci </strong>oggi stesso per ricevere una consulenza gratuita, senza impegno, e fatti guidare dai nostri esperti per un’esperienza di noleggio personalizzata su misura alle tue necessità.</p>',
        '<p>Nota bene: ricorda di <a href="/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*yeqgme*_up*MQ..*_ga*OTQxOTI0NzI3LjE3NDQ0Njc1NjM.*_ga_D9FZ9V3LL7*MTc0NDQ2NzU2Mi4xLjEuMTc0NDQ2ODI5Mi4wLjAuMA..">consultare le nostre condizioni di noleggio. </a></p>',
      ].join(''),
    },
    en: {
      title: 'Electric boom hoist for hire',
      slug: 'sollevatore-elettrico-forfait-imbattibili',
      shortDescription: 'Hire of electric hoist with sling. Delivery in Rome and Florence from €45. Free delivery for 60-day rentals! No deposit required. Delivery and collection from the warehouse are FREE!',
      metaTitle: 'Electric boom hoist: hire from €2.50 a day',
      metaDescription: 'Hire an electric boom hoist for older and disabled users. Call +39 392 65 09 237 for more.',
      description: [
        '<h3>Electric hoist with mast for the elderly and disabled: for those who care every day with dedication, strength and responsibility.</h3>',
        '<p>Assisting a person with reduced mobility is a mission that requires attention, competence and the right tools. The rental service of <strong>MUEVO RI828 electric pole lift</strong> It has been designed to guarantee maximum safety and power even in the most complex transfers, supporting users weighing up to 200 kg. This is a <strong>hoist for elderly people and people with disabilities</strong>, a durable, reliable solution designed to make life easier for carers and healthcare professionals, whether at home or in a clinic.</p>',
        '<h4>Concrete help for those who care for others</h4>',
        '<blockquote><p>The use of a <strong>Electric lift with boom </strong>it is particularly useful when the patient is unable to move, for example from a wheelchair to a bed, or from a wheelchair to an armchair, as their health condition inhibits both active and passive movement; a hoist for disabled people can be used. This model offers:</p></blockquote>',
        '<ul><li><strong>High lifting capacity:</strong> This electric lift with a support pole can hold up to 200 kg and is also ideal for bariatric patients.</li><li><strong>Width-adjustable base</strong>It adapts easily to confined domestic spaces or furnished rooms.</li><li><strong>Demountable structure</strong>&nbsp;in painted steel: durable yet easy to assemble and transport.</li><li><strong>Integrated security</strong>manual emergency lowering, stop button and anti-crushing protection.</li><li><strong>Long-life battery</strong>more than 40 full load cycles on a single charge.</li><li><strong>Visual and acoustic warnings</strong>They clearly indicate when the battery needs recharging.</li></ul>',
        '<h4>Technical Specifications of the High Capacity Electric Rod Lift</h4>',
        '<ul><li><strong>TiMotion electric motor</strong></li><li><strong>Maximum flow rate</strong>200 kg</li><li><strong>Structure</strong>: painted steel with polyurethane grips</li><li><strong>10 cm swivel castors</strong>two with brakes</li><li><strong>Manual lever leg opening</strong></li><li><strong>Removable battery with discharge indicator</strong></li></ul>',
        '<p>Click <a href="/wp-content/uploads/2022/12/sollevatore-con-asta-.pdf?_gl=1*1rhhl60*_up*MQ..*_ga*ODE3OTQwNDIwLjE3NDQ0NjU4ODI.*_ga_D9FZ9V3LL7*MTc0NDQ2NTg4Mi4xLjEuMTc0NDQ2NTg5Mi4wLjAuMA..">here</a> to consult the complete data sheet. </p>',
        '<h4>Who is the MUEVO RI828 electric hoist for?</h4>',
        '<p>The <strong>electric lift with a boom</strong> it is the ideal choice for:</p>',
        '<ul><li><strong>Home caregivers</strong>&nbsp;managing patients with no or severely reduced mobility.</li><li><strong>Families caring for persons with disabilities or complex illnesses</strong>&nbsp;requiring maximum security in transfers.</li><li>Situations of&nbsp;<strong>post-operative care</strong>&nbsp;or long-stay home.</li><li>Residential environments where a device is needed&nbsp;<strong>robust but manageable</strong>.</li><li><strong>Clinics</strong> and <strong>hospitals</strong> who want to ensure maximum safety and comfort for their patients.</li></ul>',
        '<h4>Improve the quality of care, reduce physical effort </h4>',
        '<p>The rental service for the MUEVO RI828 electric hoist with mast is a silent ally that helps avoid excessive effort, reduces the risk of injury and enables you to face the day with greater peace of mind. Every transfer becomes safer for the recipient and more manageable for the person carrying it out.</p>',
        '<p>Our car hire service <strong>electric lift with a boom</strong> it is designed as <strong>smart investment</strong> to protect the <strong>health</strong> of the carer and improve the well-being of the carer.</p>',
        '<p>Visit our <strong><a href="/en/rental-catalog/">.</a></strong> to discover Mia Medical Italia’s wide range of products and contact us to receive a <strong>free consultation</strong>without obligation, to find out which model best suits your needs and the needs of those you assist.</p>',
        '<h4>Why choose the Mia Medical Italia rental service for the hire of your electric hoist</h4>',
        '<p>Choosing us as your rental allies:</p>',
        '<ul><li>Hai <strong>personalised assistance</strong> e <strong>delivery of the device directly to your home</strong>.</li><li>Find <strong>sanitised, safe and controlled devices</strong> by qualified personnel.</li><li>Hai <strong>immediate local support</strong>in both Rome and Florence.</li><li>Book in a way <strong>easy</strong>with <strong>transparent tariffs</strong> e <strong>flexible options</strong> according to your needs.</li><li><strong><a href="https://www.morettispa.com/prodotto/sollevamalati-in-acciaio-verniciato-elettrico-timotion-modello-ingombro-standard-apertura-gambe-a-leva-portata-max-150-kg/">Latest generation devices and best quality on the market.</a></strong></li></ul>',
        '<p>Also, if you are the caregiver of a dependent person and need a hand, we recommend you visit our <strong>nurse</strong> trustworthy <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong>, specialising in home care, will enable your loved ones or patients to continue the necessary treatment from the comfort of their own home! Do not hesitate to contact him. </p>',
        '<h4>How to hire your electric hoist with a boom for elderly people and people with disabilities</h4>',
        '<p><strong><a href="https://wa.me/393926509237">Contact us</a></strong> today for the rental of the electric patient hoist with sling for the elderly and disabled. We will give you availability and a quote. Contact us Moreover, if we haven\'t convinced you yet, call us now at the number <strong><a href="https://wa.me/393926509237">+39 392 65 09 237.</a></strong> Our <strong>team of specialists</strong> of the industry will be ready to answer all your questions and clarify any doubts. <strong>Contact us </strong>today to receive a free, no-obligation consultation and let our experts guide you to a customised rental experience tailored to your needs.</p>',
        '<p>Please note: remember to <a href="/en/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*yeqgme*_up*MQ..*_ga*OTQxOTI0NzI3LjE3NDQ0Njc1NjM.*_ga_D9FZ9V3LL7*MTc0NDQ2NzU2Mi4xLjEuMTc0NDQ2ODI5Mi4wLjAuMA..">consult our rental conditions. </a></p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 200,
    motor: { it: 'Linak', en: 'Linak' },
    'frame-material': 'painted-steel',
    'includes-sling': true,
  },

  media: {
    thumbnail: { file: 'boom-hoist-1.jpg', alt: { it: 'Sollevatore elettrico con asta MUEVO' } },
    gallery: [
      'boom-hoist-2.jpg',
    ],
  },

  addons: [homeDelivery(45)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
