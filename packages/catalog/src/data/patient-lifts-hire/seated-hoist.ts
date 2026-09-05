/**
 * Noleggio sollevatore elettrico con seduta
 *
 * /prodotto/noleggio-sollevatore-elettrico-con-seduta-per-il-bagno/
 * WooCommerce product 11090 — a MUEVO Home, per the page's Yoast description.
 *
 * ⚠️ The 30-day variation is labelled "30 giorni - 240 €" and charges 260 €. The
 * charged figure is written here.
 *
 * Delivery from 45 €, free from 45 days. No deposit.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { patientLiftsHire } from './category.ts';

export const seatedHoist = patientLiftsHire.rental({
  code: 'seated-hoist',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 150),
    days(30, 260),
    days(45, 315),
    days(60, 360),
  ],

  translations: {
    it: {
      title: 'Noleggio sollevatore elettrico con seduta',
      slug: 'noleggio-sollevatore-elettrico-con-seduta-per-il-bagno',
      shortDescription: 'Noleggio sollevatore elettrico con seduta ed imbracatura. Consegna a Roma e Firenze a partire da 45€. Consegna gratuita per i noleggi da 45 giorni! Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Noleggio sollevatore elettrico con seduta per il bagno',
      metaDescription: 'Noleggio sollevatore elettrico con seduta per anziani e sollevatore per persone disabili MUEVO Home. Ideale per interni ed esterni. Chiamaci ora!',
      description: [
        '<h3>MUEVO HOME &#8211; noleggio sollevatore elettrico per anziani con seduta per uso domiciliare. Sostegno quotidiano per chi assiste e per chi è assistito.</h3>',
        '<p>Il noleggio sollevatore elettrico con seduta MUEVO HOME è la soluzione ideale per chi necessita di assistenza domestica sicura per il sollevamento di persone anziane o con ridotta mobilità.<br />È un dispositivo pensato anche come <strong>sollevatore per persone disabili</strong> per garantire trasferimenti sicuri e controllati.</p>',
        '<h4>Come il <strong>noleggio sollevatore elettrico con seduta</strong> può essere un aiuto concreto nella quotidianità</h4>',
        '<ul><li><strong>Trasferimenti più sicuri e senza sforzi</strong>: da letto a carrozzina, dal bagno alla poltrona, ogni movimento è gestito in modo fluido e controllato.</li><li>Il sollevatore elettrico con seduta a noleggio <strong>riduce il rischio di infortuni per i caregiver</strong>: questo lo rende un efficace <strong>sollevatore per persone disabili</strong> adatto all’uso domestico quotidiano.</li><li><strong>Compatto e maneggevole</strong>: perfetto anche in spazi ristretti grazie alla base regolabile in larghezza.</li><li><strong>Batteria a lunga durata</strong>: oltre 40 cicli completi di utilizzo con una sola ricarica.</li><li><strong>Sistema di emergenza integrato</strong>: per garantire la massima sicurezza anche in caso di imprevisti.</li></ul>',
        '<h4>In quali attività è utile il <strong>sollevatore elettrico con seduta a noleggio</strong></h4>',
        '<p>Il <strong>sollevatore elettrico con seduta a noleggio</strong> permette trasferimenti più sicuri e senza sforzi.</p>',
        '<ul><li><em>Movimentare la&nbsp;persona&nbsp;dal letto con il <strong>sollevatore elettrico con seduta</strong>, facendola alzare o adagiare</em><em>su di esso</em></li><li><em> Accompagnare la persona&nbsp;in bagno</em></li><li><em>&nbsp;Far sedere o spostare la persona&nbsp;dalla&nbsp;poltrona, sedia, sedia comoda e carrozzina</em></li><li><em>Trasferire la persona all’interno dell’abitazione</em></li><li><em> Accomodare la persona nella vettura</em></li></ul>',
        '<h4>Specifiche tecniche del <strong>sollevatore elettrico con seduta a noleggio MUEVO HOME</strong></h4>',
        '<ul><li><strong>Portata massima</strong>: 135 kg</li><li>Motore elettrico TiMotion</li><li>Struttura in acciaio verniciato</li><li>Cinque ruote piroettanti, di cui due con <strong>freno</strong></li><li><strong>Apertura elettrica delle gambe</strong></li><li><strong>Batteria estraibile con segnalazione acustico-visiva di scarica</strong></li><li><strong>Pulsante d’arresto d’emergenza</strong></li><li><strong>Discesa manuale d’emergenza</strong></li><li><strong>Sicurezza antischiacciamento integrata</strong></li></ul>',
        '<p>Clicca <a href="/wp-content/uploads/2023/04/Muevo-home-.pdf?_gl=1*su4zs4*_up*MQ..*_ga*MTIzODA2NjA5My4xNzQ0NDYzMDQ5*_ga_D9FZ9V3LL7*MTc0NDQ2MzA0OC4xLjEuMTc0NDQ2MzA2Ni4wLjAuMA..">qui</a> per consultare la scheda tecnica completa. </p>',
        '<p><strong>Accessori Inclusi e Opzionali </strong></p>',
        '<ul><li><strong>Imbracatura standard in poliestere</strong>&nbsp;(in dotazione)</li><li><strong>Imbracatura per WC</strong>&nbsp;(opzionale)</li><li><strong>Braccio di sollevamento centrale</strong>&nbsp;(opzionale)</li></ul>',
        '<h4>Per chi è pensato il servizio di noleggio di MUEVO HOME?</h4>',
        '<p>Questo servizio di noleggio sollevatore elettrico con seduta è ideale per l’utilizzo come <strong>sollevatore per persone disabili</strong>, come <strong>sollevatore per anziani </strong>e per:</p>',
        '<ul><li><strong>Caregiver domestici</strong>&nbsp;che desiderano una gestione più semplice e sicura dei trasferimenti quotidiani.</li><li>Situazioni temporanee di non autosufficienza (post-operatorio, riabilitazione, incidenti).</li></ul>',
        '<h4>Perché scegliere Mia Medical Italia come tuo alleato</h4>',
        '<p>Scegliendo Mia Medical Italia per il tuo noleggio:</p>',
        '<ul><li>Hai&nbsp;<strong>assistenza personalizzata</strong>&nbsp;e consegna del dispositivo direttamente in&nbsp;<strong>clinica, ospedale o appartamento</strong>.</li><li>Trovi dispositivi&nbsp;<strong>igienizzati, sicuri e controllati</strong>&nbsp;da personale qualificato.</li><li>Hai&nbsp;<strong>supporto locale immediato</strong>, sia a Roma che a Firenze.</li><li>Prenoti in modo facile, con tariffe trasparenti e opzioni flessibili anche per più giorni.</li><li><strong><a href="https://www.morettispa.com/prodotto/sollevatore-elettrico-muevo-home-portata-max-135-kg-copia/">Dispositivi di ultima generazione e migliore qualità sul mercato</a></strong></li></ul>',
        '<h4>Noleggio Sollevatore Elettrico con Seduta: un investimento per il benessere di tutta la famiglia. </h4>',
        '<p><strong>MUEVO HOME</strong>&nbsp;migliora concretamente la qualità della vita sia della persona assistita, che può sentirsi più sicura e meno dipendente, sia di chi si prende cura di lei, riducendo lo stress fisico ed emotivo.</p>',
        '<p><strong>Un aiuto silenzioso ma indispensabile, ogni giorno, a casa tua.</strong> Inoltre, se sei il caregiver di una persona non autosufficiente e hai bisogno di una mano, ti consigliamo di visitare il sito web del nostro Infermiere di fiducia <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong>, specializzato nell’assistenza domiciliare, darà la possibilità ai vostri cari o pazienti di proseguire le cure necessarie da comfort della loro abitazione! Non esitate a contattarlo. </p>',
        '<h4>Come Contattarci </h4>',
        '<p><strong><a href="https://wa.me/393926509237">Contattaci</a></strong>&nbsp;oggi per la disponibilità e preventivo. Inoltre, se ancora non ti abbiamo convinto, chiamaci subito al numero&nbsp;<strong><a href="https://wa.me/393926509237">+39 392 65 09 237.</a></strong>&nbsp;Il nostro&nbsp;<strong>team di specialisti</strong>&nbsp;del settore sarà pronto a rispondere a ogni tua domanda e chiarire ogni dubbio.&nbsp;<strong>Contattaci </strong>oggi stesso per ricevere una consulenza gratuita, senza impegno, e fatti guidare dai nostri esperti per un’esperienza di noleggio personalizzata su misura alle tue necessità.</p>',
        '<p><a href="/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*hr9jjl*_up*MQ..*_ga*MTUxMzgwNzg3Ni4xNzQ0NDY0NDE1*_ga_D9FZ9V3LL7*MTc0NDQ2NDQxNC4xLjEuMTc0NDQ2NDc5MC4wLjAuMA..">Nota bene: consulta le nostre condizioni di noleggio</a>. </p>',
      ].join(''),
    },
    en: {
      title: 'Electric hoist with a seat, for hire',
      slug: 'noleggio-sollevatore-elettrico-con-seduta-per-il-bagno',
      shortDescription: 'Hire of electric hoist with seat and sling. Delivery in Rome and Florence from €45. Free delivery for 45-day rentals! No deposit required. Delivery and collection from the warehouse are FREE!',
      metaTitle: 'Electric hoist with a seat for the bathroom, for hire',
      metaDescription: 'Hire the MUEVO Home electric hoist with a seat, for older and disabled users. Suits indoors and out.',
      description: [
        '<h3>MUEVO HOME – electric hoist hire for the elderly with a seat for home use. Daily support for both carers and those being cared for.</h3>',
        '<p>The MUEVO HOME electric seated hoist rental is the ideal solution for those who need safe home assistance for lifting elderly people or those with reduced mobility.<br />It is a device also designed as <strong>hoist for disabled persons</strong> to ensure safe and controlled transfers.</p>',
        '<h4>Like the <strong>hire electric hoist with seat</strong> it can be a practical help in everyday life</h4>',
        '<ul><li><strong>Safer and more effortless transfers</strong>From bed to wheelchair, from bath to chair, every movement is managed in a fluid and controlled manner.</li><li>The electric hoist with rental seat <strong>reduces the risk of injuries for carers</strong>this makes it an effective <strong>hoist for disabled persons</strong> suitable for everyday home use.</li><li><strong>Compact and manoeuvrable</strong>Perfect even in tight spaces thanks to the width-adjustable base.</li><li><strong>Long-life battery</strong>more than 40 complete cycles of use on a single charge.</li><li><strong>Integrated emergency system</strong>to ensure maximum security even in the event of unforeseen events.</li></ul>',
        '<h4>In what activities is it useful <strong>electric hoist with rental seat</strong></h4>',
        '<p>The <strong>electric hoist with rental seat</strong> It allows for safer and effortless transfers.</p>',
        '<ul><li><em>Moving the person from the bed with the <strong>electric hoist with seat</strong>, making it stand up or lie down</em><em>on it</em></li><li><em> Accompanying the person to the bathroom</em></li><li><em>&nbsp;Sitting or moving the person from the chair, comfy chair and wheelchair</em></li><li><em>Moving the person inside the home</em></li><li><em> Accommodating the person in the car</em></li></ul>',
        '<h4>Technical specifications of the <strong>electric hoist with rental seat MUEVO HOME</strong></h4>',
        '<ul><li><strong>Maximum flow rate</strong>135 kg</li><li>TiMotion electric motor</li><li>Painted steel structure</li><li>Five swivel wheels, two of them with <strong>brake</strong></li><li><strong>Electric leg opening</strong></li><li><strong>Removable battery with audible-visual low battery warning</strong></li><li><strong>Emergency stop button</strong></li><li><strong>Emergency manual descent</strong></li><li><strong>Integrated anti-crushing safety</strong></li></ul>',
        '<p>Click <a href="/wp-content/uploads/2023/04/Muevo-home-.pdf?_gl=1*su4zs4*_up*MQ..*_ga*MTIzODA2NjA5My4xNzQ0NDYzMDQ5*_ga_D9FZ9V3LL7*MTc0NDQ2MzA0OC4xLjEuMTc0NDQ2MzA2Ni4wLjAuMA..">here</a> to consult the complete data sheet. </p>',
        '<p><strong>Included and Optional Accessories </strong></p>',
        '<ul><li><strong>Standard polyester harness</strong>&nbsp;(supplied)</li><li><strong>Toilet harness</strong>&nbsp;(optional)</li><li><strong>Central lifting arm</strong>&nbsp;(optional)</li></ul>',
        '<h4>Who is the MUEVO HOME rental service designed for?</h4>',
        '<p>This electric hoist with seat rental service is ideal for use as <strong>hoist for disabled persons</strong>, such as <strong>hoist for the elderly </strong>and for:</p>',
        '<ul><li><strong>Domestic caregivers</strong>&nbsp;who want simpler and safer management of daily transfers.</li><li>Temporary situations of non-self-sufficiency (post-operative, rehabilitation, accidents).</li></ul>',
        '<h4>Why choose Mia Medical Italia as your ally</h4>',
        '<p>Choose Mia Medical Italia for your rental:</p>',
        '<ul><li>Hai&nbsp;<strong>personalised assistance</strong>&nbsp;and delivery of the device directly to&nbsp;<strong>clinic, hospital or flat</strong>.</li><li>Find devices&nbsp;<strong>sanitised, safe and controlled</strong>&nbsp;by qualified personnel.</li><li>Hai&nbsp;<strong>immediate local support</strong>in both Rome and Florence.</li><li>Book easily, with transparent rates and flexible options even for several days.</li><li><strong><a href="https://www.morettispa.com/prodotto/sollevatore-elettrico-muevo-home-portata-max-135-kg-copia/">Latest generation devices and best quality on the market</a></strong></li></ul>',
        '<h4>Hire Electric Lift with Seat: an investment in the well-being of the whole family. </h4>',
        '<p><strong>MUEVO HOME</strong>&nbsp;concretely improves the quality of life of both the care recipient, who can feel safer and less dependent, and the carer, by reducing physical and emotional stress.</p>',
        '<p><strong>A silent but indispensable help, every day, in your home.</strong> In addition, if you are the caregiver of a dependent person and need a hand, we recommend you visit the website of our Nurse <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong>, specialising in home care, will enable your loved ones or patients to continue the necessary treatment from the comfort of their own home! Do not hesitate to contact him. </p>',
        '<h4>How to contact us </h4>',
        '<p><strong><a href="https://wa.me/393926509237">Contact us</a></strong>&nbsp;today for availability and quotation. Also, if we still haven\'t convinced you, call us now at&nbsp;<strong><a href="https://wa.me/393926509237">+39 392 65 09 237.</a></strong>&nbsp;Our&nbsp;<strong>team of specialists</strong>&nbsp;of the industry will be ready to answer all your questions and clarify any doubts.&nbsp;<strong>Contact us </strong>today to receive a free, no-obligation consultation and let our experts guide you to a customised rental experience tailored to your needs.</p>',
        '<p><a href="/en/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*hr9jjl*_up*MQ..*_ga*MTUxMzgwNzg3Ni4xNzQ0NDY0NDE1*_ga_D9FZ9V3LL7*MTc0NDQ2NDQxNC4xLjEuMTc0NDQ2NDc5MC4wLjAuMA..">Please note: see our rental conditions</a>. </p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 135,
    'has-seat': true,
    'includes-sling': true,
  },

  media: {
    thumbnail: { file: 'seated-hoist-1.jpg', alt: { it: 'noleggio sollevatore elettrico con seduta MUEVO HOME' } },
    gallery: [
      'seated-hoist-2.png',
      'seated-hoist-3.jpg',
      'seated-hoist-4.jpg',
    ],
  },

  addons: [homeDelivery(45)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
