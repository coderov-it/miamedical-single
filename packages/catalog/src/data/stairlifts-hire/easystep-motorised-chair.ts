/**
 * Noleggio Sedia Motorizzata Easystep
 *
 * /prodotto/noleggio-sedia-motorizzata-sali-scendiscale/
 * WooCommerce product 8999. One figure on the page — "Portata fino a 169 kg",
 * the same rating its sale twin (15102) states.
 * Delivery from 45 €, Rome and Florence only, free from 45 days.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { stairliftsHire } from './category.ts';

export const easystepMotorisedChair = stairliftsHire.rental({
  code: 'easystep-motorised-chair',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 105),
    days(15, 150),
    days(30, 240),
    days(45, 340),
    days(60, 420),
    days(90, 600),
  ],

  translations: {
    it: {
      title: 'Noleggio Sedia Motorizzata Easystep',
      slug: 'noleggio-sedia-motorizzata-sali-scendiscale',
      shortDescription: 'Il Sali/Scendi, carrozzina elettrica per salire e scendere le scale. Consegna a domicilio soltanto a Roma e Firenze a partire da 45€. Consegna gratis se acquisti un noleggio per un minimo di 45 giorni. Il ritiro e la riconsegna degli ausili in magazzino sono Gratuiti. Deposito richiesto:Per il noleggio di questo articolo è richiesto un deposito di 300€.',
      metaTitle: 'Noleggio sedia motorizzata montascale: salire e scendere le scale',
      metaDescription: 'Noleggio sedia motorizzata Montascale elettrico per salire e scendere le scale. Migliore Prezzo Garantito. Scopri i nostri prezzi imbattibili.',
      description: [
        '<p>Hai bisogno di un <strong>noleggio sedia motorizzata montascale o di un noleggio montascale elettrico</strong> per aiutare una persona cara a salire e scendere le scale in sicurezza? La nostra sedia elettrica a cingoli è la soluzione ideale per edifici con scale dritte, anche senza ascensore. </p>',
        '<p>Con il servizio di&nbsp;<strong>noleggio M.I.A. Medical Italia</strong>, puoi riceverla direttamente a casa tua, con&nbsp;<strong>consegna rapida</strong>,&nbsp;<strong>dimostrazione all’utilizzo inclusa</strong>&nbsp;e&nbsp;<strong>supporto tecnico costante</strong>.</p>',
        '<h3>Montascale elettrico: cosa è una sedia motorizzata per salire e scendere le scale a noleggio</h3>',
        '<p>Questa&nbsp;<strong>sedia motorizzata con cingoli</strong>&nbsp;è pensata per trasportare persone con mobilità ridotta lungo le scale,&nbsp;<strong>senza dover usare la carrozzina</strong>. L’accompagnatore gestisce facilmente il dispositivo attraverso&nbsp;<strong>comandi elettronici</strong>: la salita e la discesa avvengono in modo&nbsp;<strong>fluido, controllato e senza sforzo</strong>.</p>',
        '<p>Grazie alla&nbsp;<strong>struttura pieghevole in alluminio</strong>, alla&nbsp;<strong>seduta imbottita integrata</strong>&nbsp;e al sistema a&nbsp;<strong>cingoli ad alta aderenza</strong>, la sedia garantisce&nbsp;<strong>comfort, stabilità e sicurezza</strong>, anche su scale con forte pendenza.</p>',
        '<h3>Noleggio sedia motorizzata montascale: a chi la consigliamo</h3>',
        '<p>La sedia elettrica per salire le scale è ideale per:</p>',
        '<ul><li><strong>Anziani o persone con difficoltà motorie</strong>&nbsp;che vivono in edifici senza ascensore;</li><li>Famiglie che hanno bisogno di&nbsp;<strong>una soluzione temporanea</strong>&nbsp;per trasportare un parente su e giù per le scale;</li><li><strong>Strutture sanitarie, RSA, scuole</strong>&nbsp;o luoghi pubblici non accessibili;</li><li>Persone in fase di&nbsp;<strong>post-operatorio</strong>&nbsp;o riabilitazione;</li><li>Chi ha necessità di&nbsp;<strong>portare con sé un dispositivo sicuro e pieghevole</strong>&nbsp;durante trasferte o viaggi.</li></ul>',
        '<h3>Come funziona il noleggio della nostra sedia motorizzata per salire e scendere le scale a noleggio a Roma e Firenze</h3>',
        '<p>L’accompagnatore:</p>',
        '<p>1. Apre la sedia e regola l’impugnatura in base alla propria altezza;</p>',
        '<p>2. Fa accomodare la persona da trasportare sulla seduta imbottita;</p>',
        '<p>3. Blocca le&nbsp;<strong>cinture di sicurezza</strong>&nbsp;e i&nbsp;<strong>braccioli ribaltabili</strong>;</p>',
        '<p>4. Avvia il sistema tramite il pannello comandi;</p>',
        '<p>5. I cingoli salgono o scendono la scala&nbsp;<strong>in totale sicurezza</strong>, senza sforzi fisici.</p>',
        '<p>Il dispositivo è&nbsp;<strong>intelligente, silenzioso e stabile</strong>, anche su scale strette o con gradini alti.</p>',
        '<h3>Caratteristiche principali della nostra sedia motorizzata</h3>',
        '<ul><li><strong>Seduta comoda e integrata</strong>, con cinture e poggiatesta;</li><li><strong>Struttura in alluminio</strong>&nbsp;leggera e pieghevole;</li><li><strong>Motore elettrico potente</strong>&nbsp;da 120 W (batteria 24V);</li><li><strong>Cingoli in gomma ad alta aderenza</strong>, ideali per scale dritte;</li><li><strong>Portata fino a 169 kg</strong>;</li><li><strong>Velocità</strong>: fino a 12 gradini/minuto;</li><li><strong>Autonomia</strong>: fino a 2.500 gradini con una sola carica;</li><li><strong>Facile da riporre</strong>&nbsp;e trasportare in auto.</li></ul>',
        '<h3><strong>Perché è utile anche in scuole, alberghi e strutture pubbliche</strong></h3>',
        '<p>Avere una&nbsp;<strong>sedia elettrica per salire e scendere le scale</strong>&nbsp;non è solo una scelta di comfort: è una vera misura di&nbsp;<strong>sicurezza preventiva</strong>. In&nbsp;<strong>scuole, hotel, uffici pubblici o strutture sanitarie</strong>, questo ausilio può fare la differenza in caso di&nbsp;<strong>evacuazione di emergenza</strong>, blackout o ascensori fuori uso.</p>',
        '<p><strong>Non aspettare l’emergenza per accorgerti della necessità di un ausilio del genere.</strong>&nbsp;Con il noleggio, puoi essere pronto in ogni momento, senza impegni a lungo termine.</p>',
        '<h4>I vantaggi del noleggio: sedia motorizzata per salire e scendere le scale in totale sicurezza</h4>',
        '<ul><li><strong>Consegna a domicilio rapida</strong>, anche urgente;</li><li><strong>Istruzione all’uso gratuita</strong>&nbsp;al momento della consegna;</li><li><strong>Durata flessibile</strong>: pochi giorni, settimane o mesi;</li><li>Dispositivi&nbsp;<strong>certificati, sicuri e sanificati</strong>;</li><li><strong>Supporto continuo via WhatsApp o telefono</strong>;</li><li><strong>Zero investimento iniziale</strong></li></ul>',
        '<h3>Perchè scegliere il servizio di noleggio montascale elettrico MIA Medical Italia</h3>',
        '<p>Con il nostro servizio di <strong>noleggio sedia motorizzata montascale</strong>, puoi ricevere il dispositivo direttamente a casa in 24/48 ore.<br />Offriamo infatti un servizio di&nbsp;<strong>noleggio rapido su Roma e Firenze (anche 24/48h in base alla disponibilità)</strong>&nbsp;con&nbsp;<strong>personale qualificato</strong>&nbsp;per la&nbsp;<strong>consegna</strong>&nbsp;e&nbsp;<strong>istruzioni all’uso</strong>. Tutti i nostri&nbsp;<strong>ausili</strong>&nbsp;sono&nbsp;<strong>sicuri</strong>&nbsp;e&nbsp;<strong>certificati</strong>, inoltre arrivano nelle vostre case&nbsp;<strong>sanificati</strong>&nbsp;e pronti all’utilizzo! Forniamo anche&nbsp;<strong>assistenza</strong>&nbsp;<strong>continua per tutta la durata del noleggio.&nbsp;</strong></p>',
        '<p>Contattaci per un <strong>preventivo gratuito telefonico</strong> o una <strong>consulenza senza impegno</strong> sui nostri montascale. Il nostro team ti aiuterà a scegliere la soluzione più adatta alle tue esigenze.</p>',
        '<p>In alternativa, puoi visitare il nostro sito per scoprire la vasta gamma di <strong><a href="/catalogo-noleggio/">ausili medicali ed elettromedicali disponibili a noleggio e in vendita</a></strong>, tra cui:<br />carrozzine, scooter elettrici, sollevatori, verticalizzatori, letti ortopedici, carrozzine elettriche, materassi antidecubito e dispositivi per magnetoterapia e pressoterapia.</p>',
        '<p>Scopri tutti i nostri prodotti e servizi direttamente sul sito M.I.A. Medical Italia.</p>',
        '<p><b>Chiama il&nbsp;</b><a href="tel:+39 392 65 09 237">+39 392 65 09 237</a>, <strong><a href="https://wa.me/393926509237">Scrivici su WhatsApp</a></strong> oppure invia una mail a&nbsp;<strong>info@miamedicalitalia.it</strong></p>',
        '<p><strong>Scegli il nostro <strong>noleggio sedia motorizzata</strong> per affrontare le scale in totale sicurezza.</strong></p>',
        '<h2>Link utili</h2>',
        '<p>Nel <strong><a href="/easystep-il-nuovo-montascale-a-cingoli-in-vendita-e-a-noleggio/">nostro articolo</a></strong> sul <strong>montascale a cingoli Easystep</strong> trovi tantissime informazioni utili per scegliere il modello corretto.</p>',
      ].join(''),
    },
    en: {
      title: 'Easystep motorised stair chair, for hire',
      slug: 'noleggio-sedia-motorizzata-sali-scendiscale',
      shortDescription: 'The up-and-down: an electric chair for getting up and down stairs. Home delivery in Rome and Florence only, from €45. Free delivery on hires of 45 days or more. Collection and return of aids at the warehouse are free.',
      metaTitle: 'Motorised stair chair hire: getting up and down stairs',
      metaDescription: 'Hire a motorised electric stair chair for getting up and down stairs. Best price guaranteed — see our prices.',
      description: [
        '<p>You need a <strong>hire motorised stairlift chair or electric stairlift hire</strong> to help a loved one go up and down the stairs safely? Our tracked stair lift is the ideal solution for buildings with straight stairs, even without a lift. </p>',
        '<p>With the service of&nbsp;<strong>M.I.A. Medical Italia rental</strong>, you can receive it directly at your home, with&nbsp;<strong>rapid delivery</strong>,&nbsp;<strong>demonstration of use included</strong>&nbsp;e&nbsp;<strong>ongoing technical support</strong>.</p>',
        '<h3>Electric stairlift: what a motorise chair for going up and down stairs on hire is</h3>',
        '<p>This&nbsp;<strong>motorised chair with tracks</strong>&nbsp;is designed to transport people with reduced mobility up and down stairs,&nbsp;<strong>without having to use a wheelchair</strong>. The accompanying person can easily operate the device through&nbsp;<strong>electronic controls</strong>: the ascent and descent take place in a&nbsp;<strong>smooth, controlled and effortless</strong>.</p>',
        '<p>Thanks to the&nbsp;<strong>folding aluminium structure</strong>, to&nbsp;<strong>integrated upholstered seat</strong>&nbsp;and to the system&nbsp;<strong>high-grip tracks</strong>, the chair guarantees&nbsp;<strong>comfort, stability and safety</strong>, even on steep stairs.</p>',
        '<h3>Hire motorised stairlift chair: who we recommend it for</h3>',
        '<p>The electric stair climber is ideal for:</p>',
        '<ul><li><strong>Elderly people or people with mobility difficulties</strong>&nbsp;who live in buildings without lifts;</li><li>Families in need of&nbsp;<strong>a temporary solution</strong>&nbsp;to carry a relative up and down the stairs;</li><li><strong>Healthcare facilities, nursing homes, schools</strong>&nbsp;or inaccessible public places;</li><li>People in the process of&nbsp;<strong>post-operative</strong>&nbsp;or rehabilitation;</li><li>Who needs&nbsp;<strong>carry a secure, foldable device with you</strong>&nbsp;during business trips or travel.</li></ul>',
        '<h3>How our motorised staircase chair rental works in Rome and Florence</h3>',
        '<p>The guide:</p>',
        '<p>1. Open the chair and adjust the handle according to your height;</p>',
        '<p>2. Seats the person to be transported on the padded seat;</p>',
        '<p>3. Lock the&nbsp;<strong>seat belts</strong>&nbsp;and the&nbsp;<strong>folding armrests</strong>;</p>',
        '<p>4. Start the system via the control panel;</p>',
        '<p>5. The tracks go up or down the ladder.&nbsp;<strong>in total safety</strong>, without physical effort.</p>',
        '<p>The device is&nbsp;<strong>intelligent, quiet and stable</strong>, even on narrow staircases or stairs with high steps.</p>',
        '<h3>Main features of our motorised chair</h3>',
        '<ul><li><strong>Comfortable, integrated seat</strong>, with seat belts and headrests;</li><li><strong>Aluminium frame</strong>&nbsp;lightweight and foldable;</li><li><strong>Powerful electric motor</strong>&nbsp;120 W (24 V battery);</li><li><strong>High-grip rubber tracks</strong>, ideal for straight staircases;</li><li><strong>Load capacity up to 169 kg</strong>;</li><li><strong>Speed</strong>: up to 12 steps per minute;</li><li><strong>Autonomy</strong>: up to 2,500 steps on a single charge;</li><li><strong>Easy to store</strong>&nbsp;and transport by car.</li></ul>',
        '<h3><strong>Why it is also useful in schools, hotels and public facilities</strong></h3>',
        '<p>To have a&nbsp;<strong>electric stairlift</strong>&nbsp;It is not merely a matter of comfort: it is a true measure of&nbsp;<strong>preventive security</strong>. In&nbsp;<strong>schools, hotels, public offices or healthcare facilities</strong>, this aid can make a difference in the event of&nbsp;<strong>emergency evacuation</strong>, power outages or lifts out of service.</p>',
        '<p><strong>Do not wait for an emergency to realise that you need this kind of aid.</strong>&nbsp;With hire, you can be ready at any time, without long-term commitments.</p>',
        '<h4>The advantages of renting: motorised chair for going up and down stairs in complete safety</h4>',
        '<ul><li><strong>Fast home delivery</strong>, even urgent;</li><li><strong>Free instructions for use</strong>&nbsp;upon delivery;</li><li><strong>Flexible duration</strong>: a few days, weeks or months;</li><li>Devices&nbsp;<strong>certified, safe and sanitised</strong>;</li><li><strong>Ongoing support via WhatsApp or telephone</strong>;</li><li><strong>Zero initial investment</strong></li></ul>',
        '<h3>Why choose the MIA Medical Italia electric stairlift rental service</h3>',
        '<p>With our <strong>hire motorised stairlift chair</strong>, you can receive the device directly at home in 24/48 hours.<br />We offer a service of&nbsp;<strong>quick rental in Rome and Florence (also 24/48h depending on availability)</strong>&nbsp;with&nbsp;<strong>qualified personnel</strong>&nbsp;for the&nbsp;<strong>delivery</strong>&nbsp;e&nbsp;<strong>instructions for use</strong>. All our&nbsp;<strong>aids</strong>&nbsp;are&nbsp;<strong>safe</strong>&nbsp;e&nbsp;<strong>certificates</strong>also arrive in your homes&nbsp;<strong>sanitised</strong>&nbsp;and ready to use! We also provide&nbsp;<strong>assistance</strong>&nbsp;<strong>continues throughout the duration of the rental.&nbsp;</strong></p>',
        '<p>Contact us for a <strong>free telephone quote</strong> or one <strong>non-binding consultancy</strong> on our stairlifts. Our team will help you choose the most suitable solution for your needs.</p>',
        '<p>Alternatively, you can visit our website to discover the wide range of <strong><a href="/en/rental-catalog/">medical and electro-medical aids available for hire and sale</a></strong>, including:<br />wheelchairs, electric scooters, lifts, verticalisers, orthopaedic beds, electric wheelchairs, anti-decubitus mattresses and devices for magnetotherapy and pressotherapy.</p>',
        '<p>Discover all our products and services directly on the M.I.A. Medical Italia website.</p>',
        '<p><b>Call the&nbsp;</b><a href="tel:+39 392 65 09 237">+39 392 65 09 237</a>, <strong><a href="https://wa.me/393926509237">Write to us on WhatsApp</a></strong> or send an e-mail to&nbsp;<strong>info@miamedicalitalia.it</strong></p>',
        '<p><strong>Choose our <strong>motorised chair hire</strong> to tackle stairs in total safety.</strong></p>',
        '<h2>Useful links</h2>',
        '<p>In <strong><a href="/en/easystep-il-nuovo-montascale-a-cingoli-in-vendita-e-a-noleggio/">our article</a></strong> on <strong>Easystep crawler stairlift</strong> you will find lots of useful information for choosing the correct model.</p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: { file: 'easystep-motorised-chair-1.png', alt: { it: 'Noleggio sedia motorizzata montascale' } },
    gallery: [
      'easystep-motorised-chair-2.png',
      'easystep-motorised-chair-3.png',
      'easystep-motorised-chair-4.png',
      'easystep-motorised-chair-5.png',
      'easystep-motorised-chair-6.png',
      'easystep-motorised-chair-7.png',
    ],
  },

  specs: {
    'max-load': 169,
  },

  addons: [homeDelivery(45)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
