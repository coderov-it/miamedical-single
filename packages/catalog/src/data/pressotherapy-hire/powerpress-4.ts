/**
 * Noleggio Pressoterapia Professionale
 *
 * /prodotto/pressoterapia-professionale-a-casa-tua/  ·  WooCommerce product 9603.
 *
 * ⚠️ Its 60-day variation is labelled "60 giorni - 240 €" and charges 250 €. The
 * charged figure is written.
 *
 * ⚠️ Duplicate of 12141 — see the note on the category.
 *
 * Delivery 15 € out and 15 € back anywhere in Italy, free from 60 days.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { pressotherapyHire } from './category.ts';

export const powerpress4 = pressotherapyHire.rental({
  code: 'powerpress-4',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 90),
    days(30, 140),
    days(60, 250),
  ],

  translations: {
    it: {
      title: 'Noleggio Pressoterapia Professionale',
      slug: 'pressoterapia-professionale-a-casa-tua',
      shortDescription: 'Noleggio Pressoterapia Include 2 gambali, la fascia addominale, il bracciale e una tutina protettiva. Consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Consegna gratis se acquisti un noleggio per un minimo di 60 giorni. Nessun deposito richiesto!',
      metaTitle: 'PRESSOTERAPIA a noleggio comodo a casa da 4€ al giorno',
      metaDescription: 'Noleggio Pressoterapia Proffessionale . Prezzi imbattibili.Perfetto per il trattamento contro la cellulite. Prenota online ora i chiama al 3926509237.',
      description: [
        '<p>Il nostro servizio di noleggio di macchinari per Pressoterapia PowerPress 4 fornisce un dispositivo professionale pensato per migliorare la circolazione venosa e linfatica, combattere gonfiori, ritenzione idrica e stanchezza degli arti inferiori, con benefici anche a livello estetico. Facile da usare, silenziosa ed efficace, è la scelta ideale per chi cerca un trattamento completo, comodo e rilassante da svolgere direttamente a casa.</p>',
        '<h4>Cosa è la pressoterapia e come funziona</h4>',
        '<p>La PowerPress 4 è un’apparecchiatura per pressione pneumatica sequenziale: grazie a speciali gambali a camere d’aria, esercita una compressione graduale sugli arti inferiori che riattiva il flusso venoso e linfatico, migliorando il drenaggio dei liquidi in eccesso.</p>',
        '<p>Funziona in modo completamente automatico, ma può essere personalizzata nei parametri di pressione, durata e frequenza, in base alle esigenze del paziente e agli obiettivi della terapia.</p>',
        '<ul><li><strong>MODE A:</strong>&nbsp;la sequenza del programma prevede il gonfiamento e lo sgonfiamento del gambale dal piede alla coscia un settore per volta. Al termine del tempo di pressione, l’aria compressa viene trattenuta per altri 3 secondi in ogni settore;</li><li><strong>MODE B:</strong>&nbsp;la pressione viene esercitata da una sola camera per volta in maniera sequenziale;</li><li><strong>MODE C:</strong>&nbsp;la sequenza del programma effettua una pressione partendo dal piede e mantenendo gonfie tutte le camere precedenti fino a gonfiare l’intera parte;</li><li><strong>MODE D:</strong>&nbsp;questa modalità è un misto fra la modalità B e C.</li></ul>',
        '<h4>Benefici della pressoterapia </h4>',
        '<ul><li>Drenaggio linfatico e riduzione della ritenzione idrica;</li><li>Alleviamento di gambe pesanti, gonfiori e stasi venosa;</li><li>Stimolazione del microcircolo e miglioramento della circolazione;</li><li>Supporto nel trattamento di linfedemi e patologie venose;</li><li>Effetto tonificante e rilassante;</li><li>Utilizzata anche in ambito estetico per ridurre cellulite e favorire il rimodellamento.</li></ul>',
        '<h4>A chi è rivolto il servizio di noleggio del macchinario per Pressoterapia Power press 4</h4>',
        '<p>Il noleggio della pressoterapia PowerPress 4 è indicato per chi soffre di:</p>',
        '<ul><li>Gambe gonfie o pesanti, soprattutto dopo molte ore in piedi o seduti;</li><li>Problemi di circolazione venosa o linfatica;</li><li>Linfedemi, edemi post-operatori o post-traumatici;</li><li>Ritenzione idrica cronica;</li><li>Cellulite e inestetismi legati alla stasi linfatica;</li><li>Atleti o sportivi, per un recupero muscolare più rapido.</li></ul>',
        '<h4><p><strong>&nbsp;Il noleggio M.I.A. Medical: comodo, personalizzato, vantaggioso</strong></h4>',
        '<p>Con il nostro servizio di noleggio:</p>',
        '<ul><li>ricevi la PowerPress 4 direttamente a casa tua, pronta all’uso;</li><li>i nostri tecnici eseguono una dimostrazione completa e ti spiegano come usarla al meglio;</li><li>programmiamo il dispositivo su misura in base alla tua condizione o alle indicazioni del tuo fisioterapista;</li><li>puoi eseguire la pressoterapia in autonomia, nei tuoi orari, senza vincoli di studio o struttura.</li></ul>',
        '<p>Questo tipo di trattamento è molto più efficace se svolto con regolarità, e averlo a casa ti permette di farlo ogni giorno, ottenendo risultati tangibili in tempi più brevi.</p>',
        '<h4>Perché scegliere il nostro servizio </h4>',
        '<ul><li>Macchinari di qualità professionale, sanificati e certificati;</li><li>Prezzi imbattibili e trasparenti;</li><li>Tecnici esperti disponibili per supporto e assistenza;</li><li>Consegna rapida in tutta Italia;</li><li>Servizio competente e attento al tuo benessere.</li></ul>',
        '<p>Scegli il comfort della <strong>terapia a casa</strong>, con un <strong>servizio sicuro, efficace e conveniente.</strong> Se hai ulteriori domande puoi contattarci telefonicamente al <strong><a href="tel:+39 3926509237">+39 3926509237</a></strong> o puoi mandarci un messaggio su <strong><a href="https://wa.me/393926509237">whatsapp</a></strong>. Il nostro personale specializzato è sempre disponibile ad aiutarti a trovare la <strong>soluzione</strong> che meglio si adatta alle tue <strong>esigenze</strong>! Inoltre, visita il nostro <strong><a href="/?_gl=1*1bx2a6k*_up*MQ..*_ga*MjA0NTM0ODc4NS4xNzUxMTA5Nzg0*_ga_D9FZ9V3LL7*czE3NTExMDk3ODQkbzEkZzAkdDE3NTExMDk3ODQkajYwJGwwJGgw">sito web</a></strong> per scoprire la vasta gamma di <strong>ausili medicali pensati per aiutarti a riscoprire il vero benessere fisico!</strong></p>',
      ].join(''),
    },
    en: {
      title: 'Professional pressotherapy, for hire',
      slug: 'pressoterapia-professionale-a-casa-tua',
      shortDescription: 'Pressotherapy hire. Includes two leg sleeves, the abdominal belt, the arm sleeve and a protective suit. Home delivery anywhere in Italy from €15 out and €15 back. Free delivery on hires of 60 days or more. No deposit required.',
      metaTitle: 'PRESSOTHERAPY for hire at home from €4 a day',
      metaDescription: 'Professional pressotherapy hire at unbeatable prices. Ideal for treating cellulite. Book online now.',
      description: [
        '<p>Our PowerPress 4 pressotherapy equipment rental service provides a professional device designed to improve venous and lymphatic circulation, combat swelling, water retention and tiredness in the lower limbs, with aesthetic benefits too. Easy to use, quiet and effective, it is the ideal choice for those looking for a complete, comfortable and relaxing treatment to be carried out directly at home.</p>',
        '<h4>What is pressotherapy and how does it work?</h4>',
        '<p>The PowerPress 4 is a sequential pneumatic pressure device: thanks to special air chamber leg cuffs, it exerts gradual compression on the lower limbs, reactivating venous and lymphatic flow and improving the drainage of excess fluids.</p>',
        '<p>It operates fully automatically, but can be customised in terms of pressure, duration and frequency, according to the patient\'s needs and the objectives of the therapy.</p>',
        '<ul><li><strong>MODE A:</strong>&nbsp;The programme sequence involves inflating and deflating the leg from foot to thigh one sector at a time. At the end of the pressure time, the compressed air is held for a further 3 seconds in each sector;</li><li><strong>MODE B:</strong>&nbsp;pressure is exerted from only one chamber at a time in a sequential manner;</li><li><strong>MODE C:</strong>&nbsp;the programme sequence applies pressure starting from the foot and keeping all previous chambers inflated until the entire part is inflated;</li><li><strong>MODE D:</strong>&nbsp;this mode is a mixture of B and C modes.</li></ul>',
        '<h4>Benefits of pressure therapy </h4>',
        '<ul><li>Lymphatic drainage and reduction of water retention;</li><li>Relief of heavy legs, swelling and venous stasis;</li><li>Stimulation of microcirculation and improvement of circulation;</li><li>Support in the treatment of lymphoedema and venous pathologies;</li><li>Invigorating and relaxing effect;</li><li>Also used in aesthetics to reduce cellulite and promote reshaping.</li></ul>',
        '<h4>Who is the Power Press 4 pressotherapy equipment rental service aimed at?</h4>',
        '<p>The PowerPress 4 pressotherapy rental is recommended for those suffering from:</p>',
        '<ul><li>Swollen or heavy legs, especially after many hours standing or sitting;</li><li>Problems with venous or lymphatic circulation;</li><li>Lymphoedema, post-operative or post-traumatic oedema;</li><li>Chronic water retention;</li><li>Cellulite and blemishes related to lymphatic stasis;</li><li>Athletes or sportspeople, for faster muscle recovery.</li></ul>',
        '<h4><p><strong>&nbsp;M.I.A. Medical hire: convenient, customised, advantageous</strong></h4>',
        '<p>With our rental service:</p>',
        '<ul><li>Receive the PowerPress 4 directly at your home, ready to use.;</li><li>our technicians will carry out a full demonstration and explain how to use it best;</li><li>We customise the device according to your condition or the instructions of your physiotherapist;</li><li>you can perform pressotherapy on your own, at your own time, with no studio or facility constraints.</li></ul>',
        '<p>This type of treatment is much more effective when performed regularly, and having it at home allows you to do it every day, achieving tangible results in a shorter time.</p>',
        '<h4>Why choose our service </h4>',
        '<ul><li>Professional-grade equipment, sanitised and certified;</li><li>Unbeatable and transparent prices;</li><li>Experienced technicians available for support and assistance;</li><li>Quick delivery throughout Italy;</li><li>Competent and caring service.</li></ul>',
        '<p>Choose the comfort of <strong>therapy at home</strong>with a <strong>safe, effective and convenient service.</strong> If you have further questions you can contact us by phone at <strong><a href="tel:+39 3926509237">+39 3926509237</a></strong> or you can send us a message on <strong><a href="https://wa.me/393926509237">whatsapp</a></strong>. Our specialised staff is always available to help you find the <strong>solution</strong> that best suits your <strong>needs</strong>! Also, visit our <strong><a href="/en/?_gl=1*1bx2a6k*_up*MQ..*_ga*MjA0NTM0ODc4NS4xNzUxMTA5Nzg0*_ga_D9FZ9V3LL7*czE3NTExMDk3ODQkbzEkZzAkdDE3NTExMDk3ODQkajYwJGwwJGgw">website</a></strong> to discover the wide range of <strong>medical aids designed to help you rediscover true physical well-being!</strong></p>',
      ].join(''),
    },
  },

  specs: {
    channels: { it: '2 gambali, fascia addominale, bracciale e tutina protettiva', en: 'Two leg sleeves, an abdominal belt, an arm sleeve and a protective suit' },
    programmes: { it: '4 programmi di trattamento', en: 'Four treatment programmes' },
  },

  media: {
    thumbnail: 'powerpress-4-1.jpg',
    gallery: [
      'powerpress-4-2.jpeg',
      'powerpress-4-3.jpeg',
    ],
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
