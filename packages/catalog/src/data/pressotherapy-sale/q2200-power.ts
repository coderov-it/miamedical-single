/**
 * Vendita Pressoterapia Q2200 POWER
 *
 * /prodotto/vendita-pressoterapia-professionaleq2200-power/
 * WooCommerce product 6600 — the oldest product in the catalogue by id, at
 * 799,00 €, and the one pressotherapy page with real figures:
 *
 *   Pressione  0 – 200 mmHg ±20%       Timer  15 / 30 minuti
 *   Alimentazione  AC 220–240 V, 50–60 Hz
 *   Dimensioni  290 × 172 × 260 mm     Peso  3,1 kg
 *   Garanzia  24 mesi
 *
 * The dimensions are in millimetres on the page; they are recorded in centimetres
 * because the spec's unit is `cm`, and the conversion is exact.
 */

import { generalTerms } from '../shared/terms.ts';
import { pressotherapySale } from './category.ts';

export const q2200Power = pressotherapySale.fixed({
  code: 'q2200-power',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 799,

  translations: {
    it: {
      title: 'Vendita Pressoterapia Q2200 POWER',
      slug: 'vendita-pressoterapia-professionaleq2200-power',
      shortDescription: 'PRESSOTERAPIA M.I.A. Q2200 Prodotto professionale di ultima generazione interamente digitale, ideato anche per l’utilizzo domiciliare. Combatte gli inestetismi della cellulite, riduce la ritenzione idrica, ridefinisce alcune parti del corpo (solitamente le gambe), incentiva l’eliminazione delle sostanze tossiche e favorisce lo snellimento di alcune zone. Incluso: 2 gambali + fascia addominale. Provala a noleggio 7 giorni per solo 50€. Guarda anche le nostre offerte di noleggio',
      metaTitle: 'Vendita e noleggio PRESSOTERAPIA professionale a casa.',
      metaDescription: 'Vendita pressoterapia professionale a domicilio. Per la cellulite e la pesantezza delle gambe. Chiama subito al +39 3926509237. Prezzi migliori del web.',
      description: [
        '<h2><strong>Vendita Pressoterapia&nbsp;</strong>Q2200 POWER: pressoterapia professionale digitale per uso domiciliare e clinico</h2>',
        '<p>La&nbsp;<strong>Pressoterapia&nbsp;</strong>Q2200 POWER<strong>&nbsp;</strong>è un&nbsp;<strong>dispositivo professionale di ultima generazione</strong>, interamente digitale, progettato per offrire un&nbsp;<strong>trattamento di pressoterapia efficace, sicuro e personalizzabile</strong>, adatto sia all’<strong>uso domiciliare</strong>&nbsp;sia all’impiego in&nbsp;<strong>ambito professionale</strong>.</p>',
        '<p>Compatta, leggera e facile da utilizzare, consente di eseguire trattamenti mirati per il&nbsp;<strong>miglioramento della circolazione venosa e linfatica</strong>, la riduzione della ritenzione idrica e il benessere generale degli arti inferiori, direttamente a casa.</p>',
        '<p><strong>Vuoi sapere se la pressoterapia è adatta alle tue esigenze? <a href="https://wa.me/393926509237">Contattaci per una consulenza gratuita.</a></strong></p>',
        '<h3><strong>Cos’è la pressoterapia e come funziona</strong></h3>',
        '<p>La&nbsp;<strong>pressoterapia</strong>&nbsp;è una terapia basata sulla&nbsp;<strong>compressione pneumatica sequenziale</strong>, effettuata tramite gambali dotati di camere d’aria che si gonfiano e sgonfiano in modo controllato.</p>',
        '<p>La&nbsp;<strong>Pressoterapia&nbsp;</strong>:</p>',
        '<ul><li>riattiva il flusso linfatico e venoso</li><li>favorisce il drenaggio dei liquidi in eccesso</li><li>migliora la circolazione periferica</li><li>allevia gonfiori e senso di pesantezza</li></ul>',
        '<p>Il trattamento è&nbsp;<strong>automatico</strong>, ma completamente&nbsp;<strong>personalizzabile</strong>&nbsp;nei parametri di pressione e durata, in base alle esigenze dell’utilizzatore o alle indicazioni del medico o fisioterapista.</p>',
        '<p><strong><a href="https://wa.me/393926509237">Chiamaci per ricevere indicazioni personalizzate sull’utilizzo del dispositivo.</a></strong></p>',
        '<h4><strong>Programmi di gonfiaggio della nostra Pressoterapia professionale in vendita&nbsp;</strong></h4>',
        '<p>La Pressoterapia Q2200 POWER è dotata di&nbsp;<strong>4 programmi professionali</strong>, pensati per adattarsi a diverse necessità terapeutiche ed estetiche.</p>',
        '<ul><li><strong>MODE A Sequenziale classico:&nbsp;</strong>gonfiaggio e sgonfiaggio dal piede alla coscia,&nbsp;<strong>una camera per volta</strong>. Al termine del tempo di pressione, l’aria viene trattenuta per&nbsp;<strong>3 secondi in ogni settore</strong>.</li><li><strong>MODE B Sequenziale singolo :&nbsp;</strong>la pressione viene esercitata&nbsp;<strong>da una sola camera per volta</strong>, in modo progressivo.</li><li><strong>MODE C Progressivo cumulativo :&nbsp;</strong>la pressione parte dal piede e&nbsp;<strong>mantiene gonfie le camere precedenti</strong>, fino a coinvolgere l’intero arto.</li><li><strong>MODE D Combinato</strong>&nbsp;: modalità mista tra&nbsp;<strong>MODE B e MODE C</strong>, per un’azione più intensa e completa.</li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Non sai quale programma utilizzare? Il nostro team ti aiuta a scegliere quello più adatto.</a></strong></p>',
        '<h4><strong>Benefici della pressoterapia&nbsp;</strong>Q2200 POWER</h4>',
        '<p>L’utilizzo regolare della Pressoterapia professionale favorisce:</p>',
        '<ul><li>drenaggio linfatico efficace</li><li>riduzione della ritenzione idrica</li><li>sollievo da gambe gonfie e pesanti</li><li>miglioramento della circolazione venosa e linfatica</li><li>stimolazione del microcircolo</li><li>supporto nel trattamento di linfedemi ed edemi</li><li>effetto rilassante e defaticante</li></ul>',
        '<p><strong>Benefici anche estetici:</strong></p>',
        '<ul><li>riduzione degli inestetismi della cellulite</li><li>miglioramento del tono cutaneo</li><li>supporto al rimodellamento degli arti inferiori</li></ul>',
        '<p><strong>Vuoi integrare la pressoterapia in un percorso di benessere o recupero? <a href="https://wa.me/393926509237">Contattaci</a>.</strong></p>',
        '<h3><strong>A chi è consigliata la Pressoterapia&nbsp;</strong>Q2200 POWER</h3>',
        '<p>La Pressoterapia Professionale è indicata per:</p>',
        '<ul><li>persone con&nbsp;<strong>gambe gonfie o pesanti</strong></li><li>chi soffre di&nbsp;<strong>problemi di circolazione venosa o linfatica</strong></li><li>pazienti con&nbsp;<strong>linfedemi o edemi post-operatori</strong></li><li>persone con&nbsp;<strong>ritenzione idrica cronica</strong></li><li>trattamento della&nbsp;<strong>cellulite</strong></li><li>sportivi e atleti per il&nbsp;<strong>recupero muscolare</strong></li></ul>',
        '<p><strong>Prima di iniziare qualsiasi trattamento di pressoterapia è sempre consigliato consultare il medico curante.</strong></p>',
        '<h4><strong>Caratteristiche tecniche Pressoterapia Professionale Q2200 POWER</strong></h4>',
        '<ul><li>Uscite:&nbsp;<strong>2</strong></li><li>Programmi:&nbsp;<strong>4</strong></li><li>Pressione:&nbsp;<strong>0 – 200 mmHg ±20%</strong></li><li>Timer:&nbsp;<strong>15 / 30 minuti</strong></li><li>Alimentazione:&nbsp;<strong>AC 220–240 V, 50–60 Hz</strong></li><li>Dimensioni:&nbsp;<strong>290 × 172 × 260 mm</strong></li><li>Peso:&nbsp;<strong>3,1 kg</strong></li><li>Garanzia:&nbsp;<strong>24 mesi</strong></li></ul>',
        '<h3><strong>Perché acquistare una Pressoterapia professionale da MIA Medical Italia</strong></h3>',
        '<p>Acquistando la&nbsp;<strong>Pressoterapia Q2200 POWER</strong>&nbsp;da&nbsp;<strong>MIA Medical Italia</strong>, hai la sicurezza di:</p>',
        '<ul><li>dispositivo&nbsp;<strong>professionale e certificato</strong></li><li>prodotto nuovo e conforme alle normative vigenti</li><li>assistenza pre e post vendita qualificata</li><li>supporto tecnico specializzato</li><li>spedizione rapida in tutta Italia</li><li>condizioni di vendita trasparenti</li><li><strong>garanzia 24 mesi</strong></li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Contattaci ora per informazioni su disponibilità, prezzi e tempi di consegna.</a></strong></p>',
        '<h4><strong>Consegna e spedizione</strong></h4>',
        '<ul><li>Spedizione rapida in&nbsp;<strong>tutta Italia</strong></li><li>Imballaggio sicuro</li><li>Costi di spedizione indicati in fase di acquisto</li></ul>',
        '<p><strong><a href="/">Visita il sito o chiamaci per ricevere un preventivo personalizzato.</a></strong></p>',
      ].join(''),
    },
    en: {
      title: 'Q2200 POWER pressotherapy, for sale',
      slug: 'vendita-pressoterapia-professionaleq2200-power',
      shortDescription: 'M.I.A. Q2200 PRESSOTHERAPY Latest generation professional product, fully digital, also designed for home use. It combats cellulite, reduces water retention, redefines certain parts of the body (usually the legs), promotes the elimination of toxic substances and helps to slim down certain areas. Included: 2 leggings + abdominal band. Try it out on a 7-day hire for just €50. See also our rental offers',
      metaTitle: 'Professional PRESSOTHERAPY for sale and hire, at home',
      metaDescription: 'Professional pressotherapy for sale, for use at home. For cellulite and heavy legs. Call +39 392 650 9237',
      description: [
        '<h2><strong>Pressotherapy for sale&nbsp;</strong>Q2200 POWER: professional digital pressure therapy for home and clinical use</h2>',
        '<p>La&nbsp;<strong>Pressotherapy&nbsp;</strong>Q2200 POWER<strong>&nbsp;</strong>is a&nbsp;<strong>state-of-the-art professional device</strong>, entirely digital, designed to offer a&nbsp;<strong>effective, safe and customisable pressotherapy treatment</strong>, suitable for both’<strong>home use</strong>&nbsp;both for use in&nbsp;<strong>professional field</strong>.</p>',
        '<p>Compact, light and easy to use, it enables targeted treatments for the&nbsp;<strong>improvement of venous and lymphatic circulation</strong>, the reduction of water retention and the general well-being of the lower limbs, directly at home.</p>',
        '<p><strong>Do you want to know if pressotherapy is suitable for your needs? <a href="https://wa.me/393926509237">Contact us for a free consultation.</a></strong></p>',
        '<h3><strong>What is pressotherapy and how does it work</strong></h3>',
        '<p>La&nbsp;<strong>pressotherapy</strong>&nbsp;it is a therapy based on&nbsp;<strong>sequential pneumatic compression</strong>, carried out using boots equipped with air chambers that inflate and deflate in a controlled manner.</p>',
        '<p>La&nbsp;<strong>Pressotherapy&nbsp;</strong>:</p>',
        '<ul><li>reactivates lymphatic and venous flow</li><li>promotes the drainage of excess fluid</li><li>improves peripheral circulation</li><li>relieves swelling and heaviness</li></ul>',
        '<p>The treatment is&nbsp;<strong>automatic</strong>, but completely&nbsp;<strong>customisable</strong>&nbsp;in the pressure and duration parameters, based on the user\'s requirements or the instructions of a doctor or physiotherapist.</p>',
        '<p><strong><a href="https://wa.me/393926509237">Call us for personalised guidance on using the device.</a></strong></p>',
        '<h4><strong>Inflation programmes of our professional pressotherapy for sale&nbsp;</strong></h4>',
        '<p>The Q2200 POWER Pressotherapy unit is equipped with&nbsp;<strong>4 professional programmes</strong>, designed to suit diverse therapeutic and aesthetic needs.</p>',
        '<ul><li><strong>MODE A Classic Sequential:&nbsp;</strong>inflating and deflating from foot to thigh,&nbsp;<strong>one room at a time</strong>. At the end of the pressure time, the air is held for&nbsp;<strong>3 seconds in each sector</strong>.</li><li><strong>MODE B Single Sequential :&nbsp;</strong>pressure is exerted&nbsp;<strong>from only one room at a time</strong>, progressively.</li><li><strong>MODE C Cumulative Progression :&nbsp;</strong>pressure starts from the foot and&nbsp;<strong>keeps the previous chambers inflated</strong>, until it involves the entire limb.</li><li><strong>MODE D Combined</strong>&nbsp;mixed mode between&nbsp;<strong>MODE B and MODE C</strong>, for a more intense and complete action.</li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Don\'t know which program to use? Our team will help you choose the most suitable one.</a></strong></p>',
        '<h4><strong>Benefits of pressure therapy&nbsp;</strong>Q2200 POWER</h4>',
        '<p>The regular use of professional pressotherapy promotes:</p>',
        '<ul><li>effective lymphatic drainage</li><li>reduction of water retention</li><li>relief from swollen, heavy legs</li><li>improvement of venous and lymphatic circulation</li><li>stimulation of microcirculation</li><li>support in the treatment of lymphoedema and oedema</li><li>relaxing and relaxing effect</li></ul>',
        '<p><strong>Aesthetic benefits as well:</strong></p>',
        '<ul><li>reduction of cellulite blemishes</li><li>improvement of skin tone</li><li>lower limb remodelling support</li></ul>',
        '<p><strong>Do you want to integrate pressotherapy into a wellness or recovery programme? <a href="https://wa.me/393926509237">Contact us</a>.</strong></p>',
        '<h3><strong>Who is Pressotherapy recommended for&nbsp;</strong>Q2200 POWER</h3>',
        '<p>Professional pressotherapy is indicated for:</p>',
        '<ul><li>people with&nbsp;<strong>swollen or heavy legs</strong></li><li>those suffering from&nbsp;<strong>venous or lymphatic circulation problems</strong></li><li>patients with&nbsp;<strong>post-operative lymphoedema or oedema</strong></li><li>people with&nbsp;<strong>chronic water retention</strong></li><li>treatment of&nbsp;<strong>cellulite</strong></li><li>sportspeople and athletes for the&nbsp;<strong>muscle recovery</strong></li></ul>',
        '<p><strong>Before starting any pressotherapy treatment, it is always advisable to consult your GP.</strong></p>',
        '<h4><strong>Technical specifications Professional Pressotherapy Q2200 POWER</strong></h4>',
        '<ul><li>Outputs:&nbsp;<strong>2</strong></li><li>Programmes:&nbsp;<strong>4</strong></li><li>Pressure:&nbsp;<strong>0 – 200 mmHg ±20%</strong></li><li>Timer:&nbsp;<strong>15 / 30 minutes</strong></li><li>Power supply:&nbsp;<strong>AC 220–240 V, 50–60 Hz</strong></li><li>Dimensions:&nbsp;<strong>290 × 172 × 260 mm</strong></li><li>Weight:&nbsp;<strong>3.1 kg</strong></li><li>Guarantee:&nbsp;<strong>24 months</strong></li></ul>',
        '<h3><strong>Why buy a professional pressotherapy device from MIA Medical Italia</strong></h3>',
        '<p>By purchasing the&nbsp;<strong>Q2200 POWER pressotherapy</strong>&nbsp;by&nbsp;<strong>Mia Medical Italia</strong>, you have the security of:</p>',
        '<ul><li>device&nbsp;<strong>professional and certified</strong></li><li>new and compliant product</li><li>qualified pre- and after-sales service</li><li>specialised technical support</li><li>fast shipping throughout Italy</li><li>transparent conditions of sale</li><li><strong>24-month warranty</strong></li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Contact us now for information on availability, prices and delivery times.</a></strong></p>',
        '<h4><strong>Delivery and dispatch</strong></h4>',
        '<ul><li>Fast shipping in&nbsp;<strong>the whole of Italy</strong></li><li>Safe packaging</li><li>Shipping costs indicated at time of purchase</li></ul>',
        '<p><strong><a href="/en/">Visit the site or call us for a customised quote.</a></strong></p>',
      ].join(''),
    },
  },

  specs: {
    'treatment-pressure': { it: '0 – 200 mmHg ±20%', en: '0 – 200 mmHg ±20%' },
    'treatment-timer': { it: '15 o 30 minuti', en: '15 or 30 minutes' },
    'power-supply': { it: 'AC 220–240 V, 50–60 Hz', en: 'AC 220–240 V, 50–60 Hz' },
    'total-length': { min: 29, max: 29 },
    'total-width': { min: 17.2, max: 17.2 },
    'total-height': { min: 26, max: 26 },
    weight: { min: 3.1, max: 3.1 },
    warranty: { it: '24 mesi', en: '24 months' },
    colour: { it: 'Rosa o grigio', en: 'Pink or grey' },
  },

  media: {
    thumbnail: 'q2200-power-1.jpg',
    gallery: [
      'q2200-power-2.jpg',
      'q2200-power-3.jpg',
    ],
  },
  terms: [generalTerms],
});
