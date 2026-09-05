/**
 * Noleggio Pressoterapia Professionale
 *
 * /prodotto/noleggio-pressoterapia-professionale/  ·  WooCommerce product 12141.
 *
 * ⚠️ The second listing of the same machine as 9603, with the same name and the
 * same accessory list. Its 60-day package is 240 €, matching its own label.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { pressotherapyHire } from './category.ts';

export const powerpress4Alt = pressotherapyHire.rental({
  code: 'powerpress-4-alt',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 90),
    days(30, 140),
    days(60, 240),
  ],

  translations: {
    it: {
      title: 'Noleggio Pressoterapia Professionale',
      slug: 'noleggio-pressoterapia-professionale',
      shortDescription: 'Noleggio Pressoterapia Include 2 gambali, la fascia addominale, il bracciale e una tutina protettiva. Consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Consegna gratis se acquisti un noleggio per un minimo di 60 giorni. Nessun deposito richiesto!',
      metaTitle: 'Noleggio Pressoterapia Professionale per Uso Domiciliare',
      metaDescription: 'Pressoterapia Proffessionale . Prezzi imbattibili. Perfetto per il trattamento contro la cellulite. Noleggiala. Chiama subito il 3926509237.',
      description: [
        '<p>Il <strong>noleggio pressoterapia professionale</strong> è la soluzione ideale per chi desidera migliorare la circolazione, ridurre gonfiori e affaticamento e prendersi cura del proprio benessere comodamente a casa. La pressoterapia è particolarmente indicata per alleviare <strong>disturbi legati alla cattiva circolazione</strong>, come mani e piedi freddi, pesantezza alle gambe, dolori articolari e stanchezza muscolare, anche in presenza di traumi post-incidente o ridotta attività fisica.</p>',
        '<h2>Benefici della pressoterapia</h2>',
        '<p>La pressoterapia favorisce il <strong>drenaggio linfatico</strong> e la riattivazione della <strong>circolazione venosa</strong>, contribuendo a:</p>',
        '<ul><li>Ridurre gonfiori e ristagni di liquidi</li><li>Alleviare dolori muscolari e articolari</li><li>Contrastare il senso di affaticamento agli arti</li><li>Migliorare il benessere generale delle gambe e delle braccia</li></ul>',
        '<p>Il trattamento agisce in modo naturale e non invasivo, risultando adatto anche a cicli di utilizzo frequenti.</p>',
        '<h2>Pressoterapia FREE: dispositivo professionale digitale</h2>',
        '<p>La <strong>PRESSOTERAPIA FREE</strong> è un macchinario <strong>professionale di ultima generazione</strong>, completamente digitale, progettato anche per un <strong>utilizzo domiciliare semplice e sicuro</strong>.<br />È dotata di <strong>telecomando remoto</strong> per la gestione dei trattamenti ed è <strong>leggera, compatta e facilmente trasportabile</strong>, offrendo un’esperienza di <strong>massaggio professionale direttamente a casa</strong>.</p>',
        '<p>Il dispositivo dispone di <strong>4 programmi di gonfiaggio</strong>, studiati per adattarsi alle diverse esigenze terapeutiche e di comfort.</p>',
        '<h2>Come funziona la pressoterapia</h2>',
        '<p>Gli <strong>accessori</strong> principali sono i <strong>gambali con camere gonfiabili</strong>, all’interno dei quali l’apparecchio immette aria secondo <strong>pressioni ben definite e sequenziali</strong>.<br />Il gonfiaggio procede dalla <strong>periferia degli arti verso la radice</strong>, creando un’<strong>onda peristaltica</strong> che favorisce lo spostamento del liquido interstiziale nei vasi linfatici e venosi, stimolandone progressivamente la circolazione.</p>',
        '<h2>Cosa include il noleggio della pressoterapia</h2>',
        '<p>Il <strong>noleggio pressoterapia</strong> comprende:</p>',
        '<ul><li><strong>2 gambali</strong></li><li><strong>Fascia addominale</strong></li><li><strong>Bracciale</strong></li><li><strong>Tutina protettiva</strong></li></ul>',
        '<p>Una soluzione completa e professionale per trattamenti efficaci, sia per uso personale che come supporto a percorsi fisioterapici e riabilitativi.</p>',
      ].join(''),
    },
    en: {
      title: 'Professional pressotherapy, for hire',
      slug: 'noleggio-pressoterapia-professionale',
      shortDescription: 'Pressotherapy Hire Includes 2 leggings, abdominal band, armband and a protective onesie. Home delivery throughout Italy from 15€ + 15€ for collection. Free delivery if you purchase a rental for a minimum of 60 days. No deposit required!',
      metaTitle: 'Professional pressotherapy hire for use at home',
      metaDescription: 'Professional pressotherapy at unbeatable prices. Ideal for treating cellulite. Hire it — call +39 392 650 9237',
      description: [
        '<p>The <strong>professional pressotherapy hire</strong> it is the ideal solution for those who want to improve circulation, reduce swelling and fatigue, and look after their well-being comfortably at home. Pressotherapy is particularly suitable for relieving <strong>disorders related to poor circulation</strong>, such as cold hands and feet, heavy legs, joint pain and muscle fatigue, even in the presence of post-accident trauma or reduced physical activity.</p>',
        '<h2>Benefits of pressure therapy</h2>',
        '<p>Pressotherapy promotes the <strong>lymphatic drainage</strong> and the reactivation of the <strong>venous circulation</strong>, contributing to:</p>',
        '<ul><li>Reduce swelling and fluid retention</li><li>Relieving muscle and joint pain</li><li>Counteracting limb fatigue</li><li>Improving the general wellbeing of legs and arms</li></ul>',
        '<p>The treatment acts naturally and non-invasively, making it suitable even for frequent cycles of use.</p>',
        '<h2>Pressotherapy FREE: professional digital device</h2>',
        '<p>La <strong>FREE PRESSOTHERAPY</strong> it\'s a piece of machinery <strong>state-of-the-art professional</strong>, fully digital, also designed for a <strong>simple and safe home use</strong>.<br />It features <strong>remote control</strong> for the management of treatments and is <strong>light, compact and easily transportable</strong>, offering an experience of <strong>professional massage directly at home</strong>.</p>',
        '<p>The device features <strong>4 inflation programmes</strong>, designed to adapt to different therapeutic and comfort needs.</p>',
        '<h2>How pressotherapy works</h2>',
        '<p>The <strong>accessories</strong> main are the <strong>leggings with inflatable chambers</strong>, within which the device introduces air according to <strong>well-defined and sequential pressures</strong>.<br />Inflation proceeds from the <strong>limb periphery towards the root</strong>, creating a’<strong>peristaltic wave</strong> which promotes the movement of interstitial fluid in lymphatic and venous vessels, progressively stimulating their circulation.</p>',
        '<h2>What does pressotherapy hire include</h2>',
        '<p>The <strong>pressotherapy hire</strong> includes:</p>',
        '<ul><li><strong>2 leggings</strong></li><li><strong>Abdominal band</strong></li><li><strong>Bracelet</strong></li><li><strong>Protective overalls</strong></li></ul>',
        '<p>A complete and professional solution for effective treatments, both for personal use and as support for physiotherapy and rehabilitation courses.</p>',
      ].join(''),
    },
  },

  specs: {
    channels: { it: '2 gambali, fascia addominale, bracciale e tutina protettiva', en: 'Two leg sleeves, an abdominal belt, an arm sleeve and a protective suit' },
    programmes: { it: '4 programmi di trattamento', en: 'Four treatment programmes' },
  },

  media: {
    thumbnail: 'powerpress-4-alt-1.jpg',
    gallery: [
      'powerpress-4-alt-2.jpg',
    ],
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
