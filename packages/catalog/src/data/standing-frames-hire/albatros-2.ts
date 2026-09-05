/**
 * Noleggio verticalizzatore attivo Albatros 2
 *
 * /prodotto/verticalizzatore-attivo-albatros-2-a-noleggio/
 * WooCommerce product 14603. The page states one figure — a battery good for up
 * to 40 lifts on a charge — and that it folds. Also sold outright, as
 * `standing-frames-sale/albatros-2`.
 *
 * This product asks NO intake question on the live site either.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { standingFramesHire } from './category.ts';

export const albatros2 = standingFramesHire.rental({
  code: 'albatros-2',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 225),
    days(30, 390),
    days(45, 540),
  ],

  translations: {
    it: {
      title: 'Noleggio verticalizzatore attivo Albatros 2',
      slug: 'verticalizzatore-attivo-albatros-2-a-noleggio',
      shortDescription: 'Verticalizzatore stand-up elettrico Mette in posizione eretta senza sforzo da parte del paziente! Ideal per il bagno. Guarda il video per il funzionamento. Compatto, pieghevole e facile da usare. Batteria fino a 40 sollevamenti con una sola carica. Disponibilità immediata. Consegna a Roma e Firenze a partire da 45€ + 45€ per il ritiro',
      metaTitle: 'Noleggio Verticalizzatore Attivo Albatros2 | Roma e Firenze',
      metaDescription: 'Noleggio verticalizzatore attivo Albatros2 per anziani e disabili. Sollevatore elettrico compatto, pieghevole e sicuro per bagno e trasferimenti.',
      description: [
        '<h3>Noleggio verticalizzatore attivo Albatros2: assistenza sicura e senza sforzo</h3>',
        '<p>Il servizio di <strong>noleggio verticalizzatore attivo Albatros2</strong> di Mia Medical Italia è pensato per anziani, <strong>persone con disabilità e pazienti con mobilità ridotta</strong> che necessitano di un supporto sicuro per alzarsi, trasferirsi e utilizzare il bagno senza sforzi. Compatto, pieghevole e semplice da usare, il verticalizzatore elettrico Albatros 2 è ideale per assistenza domiciliare, riabilitazione e strutture sanitarie. E&#8217; sia un verticalizzatore per anziani che un verticalizzatore per persone con disabilità che necessitano di supporto nei trasferimenti quotidiani.</p>',
        '<p>Se desideri un supporto efficace e semplice per la mobilità assistita, il noleggio verticalizzatore attivo Albatros2 è la soluzione ideale. Con il suo design compatto, pieghevole e di facile utilizzo, permette di sollevare e spostare la persona in totale sicurezza, riducendo lo sforzo del caregiver e aumentando il comfort dell’assistito. Ideale per portare le persone in bagno, lavarle, non necessita di nessuna partecipazione del paziente.</p>',
        '<h3>Perché scegliere il noleggio verticalizzatore attivo Albatros2</h3>',
        '<p><strong>Massima praticità</strong>: struttura pieghevole che si chiude in pochi secondi per facilitarne trasporto e stoccaggio.<br /><strong>Stabilità e comfort</strong>: dotato di pedane con lacci in velcro e imbragatura inclusa, per garantire sicurezza e sostegno ottimali.<br /><strong>Autonomia garantita</strong>: batterie ricaricabili con caricabatterie interno e circa 40 sollevamenti con una carica completa.<br /><strong>Sicurezza totale</strong>: arresto di emergenza, abbassamento manuale e segnalatore acustico che avvisa in caso di batteria scarica.<br /><strong>Tecnologia affidabile</strong>: motore e centralina Linak, telecomando ergonomico e componentistica di alta qualità.</p>',
        '<h3>Verticalizzatore attivo Albatros 2 per la mobilità assistita</h3>',
        '<p>Il <strong>verticalizzatore attivo Albatros2 è pensato per</strong>:</p>',
        '<ul><li>Caregiver e familiari che desiderano un aiuto pratico e sicuro per aiutare le persone care</li><li>Persone con mobilità ridotta che necessitano trasferimenti confortevoli</li><li>Strutture sanitarie e residenze assistenziali che vogliono offrire sicurezza e qualità ai loro ospiti</li></ul>',
        '<p>Il verticalizzatore per anziani Albatros2 rappresenta una soluzione pratica e sicura per la mobilità quotidiana.</p>',
        '<h3>A chi è utile il noleggio verticalizzatore attivo Albatros 2</h3>',
        '<p>Il noleggio verticalizzatore attivo Albatros2 è indicato per:</p>',
        '<ul><li>anziani con ridotta mobilità</li><li>persone con disabilità motorie</li><li>pazienti in riabilitazione</li><li>caregiver e familiari</li><li>RSA e strutture sanitarie</li></ul>',
        '<p>Questo ausilio permette trasferimenti più sicuri e confortevoli, riducendo lo sforzo fisico dell’assistente.</p>',
        '<h3>Come funziona il noleggio verticalizzatore attivo Albatros2</h3>',
        '<p>Consegniamo e ritiriamo il <strong>Sollevatore Albatros 2</strong> direttamente a domicilio a <strong>Roma e Firenze</strong>.<br />Puoi prenotarlo online o chiamare il numero <strong>+39 392 65 09 237</strong>: al resto pensiamo noi!</p>',
        '<ul><li>Consegna rapida</li><li>Assistenza garantita</li><li>Consulenza gratuita e senza impegno</li></ul>',
        '<h3>Recapiti utili</h3>',
        '<p>Contattaci per tariffe e disponibilità giornaliere.<br />Scopri anche gli altri modelli di <a href="/catalogo-noleggio/">sollevatori</a>, <a href="/catalogo-noleggio/">carrozzine</a> e <a href="/catalogo-noleggio/">ausili per la mobilità</a> che <strong>Mia Medical Italia</strong> mette a disposizione.</p>',
        '<p>Non sei ancora convinto? Chiama ora al <strong>+39 392 65 09 237</strong> o mandaci un messaggio su WhatsApp: il nostro team è sempre disponibile a rispondere a qualsiasi domanda.</p>',
        '<p><strong>Muoviti e solleva senza pensieri, con il noleggio verticalizzatore attivo Albatros2 la sicurezza è a portata di mano.</strong></p>',
        '<h2>Link utili</h2>',
        '<p>Per maggiori informazioni sui dispositivi per la mobilità assistita puoi consultare anche il sito del <strong><a href="https://www.salute.gov.it/new/">Ministero della Salute.</a></strong></p>',
      ].join(''),
    },
    en: {
      title: 'Albatros 2 active standing hoist, for hire',
      slug: 'verticalizzatore-attivo-albatros-2-a-noleggio',
      shortDescription: 'Electric stand-up standing hoist. Brings someone upright with no effort on their part. Made for the bathroom. Watch the video to see it work. Compact, folding and easy to use. The battery is good for up to 40 lifts on one charge.',
      metaTitle: 'Albatros 2 active standing hoist hire | Rome and Florence',
      metaDescription: 'Hire the Albatros 2 active standing hoist for older and disabled users: a compact, folding, safe electric hoist for the bathroom and beyond.',
      description: [
        '<h3>Albatros2 active verticaliser rental: safe and effortless assistance</h3>',
        '<p>The service of <strong>rental Albatros2 active verticaliser</strong> of Mia Medical Italia is designed for elderly people, <strong>people with disabilities and patients with reduced mobility</strong> who require secure support to stand up, transfer and use the bathroom effortlessly. Compact, foldable and simple to use, the Albatros 2 electric standing aid is ideal for home care, rehabilitation and healthcare facilities. It functions both as a standing aid for the elderly and for people with disabilities who require support with daily transfers.</p>',
        '<p>If you are looking for effective and simple assistance for supported mobility, the Albatros2 active standing hoist hire is the ideal solution. With its compact, foldable and easy-to-use design, it allows the person to be lifted and moved in complete safety, reducing the caregiver\'s effort and increasing the user\'s comfort. Ideal for taking people to the bathroom and washing them, it requires no participation from the patient.</p>',
        '<h3>Why choose the Albatros2 active standing aid rental</h3>',
        '<p><strong>Maximum practicality</strong>foldable structure that closes in seconds for easy transport and storage.<br /><strong>Stability and comfort</strong>with Velcro straps and sling included for optimal safety and support.<br /><strong>Guaranteed autonomy</strong>rechargeable batteries with internal charger and approximately 40 lifts on a full charge.<br /><strong>Total security</strong>emergency stop, manual lowering and an acoustic warning beeper in case of low battery.<br /><strong>Reliable technology</strong>Linak motor and control unit, ergonomic remote control and high-quality components.</p>',
        '<h3>Albatros 2 active hoist for assisted mobility</h3>',
        '<p>The <strong>active hoist Albatros2 is designed for</strong>:</p>',
        '<ul><li>Caregivers and family members who want safe and practical help for their loved ones</li><li>Persons with reduced mobility requiring comfortable transfers</li><li>Healthcare facilities and nursing homes that want to offer safety and quality to their residents</li></ul>',
        '<p>The Albatros2 standing aid for the elderly represents a practical and safe solution for daily mobility.</p>',
        '<h3>Who benefits from the hire of the Albatros 2 active standing hoist</h3>',
        '<p>The Albatros2 active stand-up hoist rental is suitable for:</p>',
        '<ul><li>older people with reduced mobility</li><li>persons with motor disabilities</li><li>rehabilitation patients</li><li>caregivers and family members</li><li>RSAs and healthcare facilities</li></ul>',
        '<p>This aid allows safer and more comfortable transfers, reducing the physical strain on the carer.</p>',
        '<h3>How the Albatros2 active verticaliser rental works</h3>',
        '<p>We deliver and collect the <strong>Lift Albatros 2</strong> directly to <strong>Rome and Florence</strong>.<br />You can book it online or call <strong>+39 392 65 09 237</strong>we\'ll take care of the rest!</p>',
        '<ul><li>Quick delivery</li><li>Guaranteed assistance</li><li>Free, no-obligation consultation</li></ul>',
        '<h3>Useful addresses</h3>',
        '<p>Contact us for daily rates and availability.<br />Discover also the other models of <a href="/en/rental-catalog/">lifters</a>, <a href="/en/rental-catalog/">wheelchairs</a> e <a href="/en/rental-catalog/">mobility aids</a> which <strong>Mia Medical Italia</strong> makes available.</p>',
        '<p>Still not convinced? Call now at <strong>+39 392 65 09 237</strong> or send us a message on WhatsApp: our team is always available to answer any questions.</p>',
        '<p><strong>Move and lift without a care; with the Albatros2 active standing hoist rental, safety is close at hand.</strong></p>',
        '<h2>Useful links</h2>',
        '<p>For further information on assisted mobility devices, you can also consult the website of the <strong><a href="https://www.salute.gov.it/new/">Ministry of Health.</a></strong></p>',
      ].join(''),
    },
  },

  specs: {
    'lifts-per-charge': 40,
    foldable: true,
  },

  media: {
    thumbnail: { file: 'albatros-2-1.png', alt: { it: 'Noleggio verticalizzatore attivo Albatros2' } },
    gallery: [
      'albatros-2-2.png',
      'albatros-2-3.jpg',
      'albatros-2-4.jpg',
    ],
  },
  terms: [generalTerms],
});
