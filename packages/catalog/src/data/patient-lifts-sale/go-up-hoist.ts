/**
 * Vendita Sollevatore Elettrico GO UP
 *
 * /prodotto/vendita-sollevatore-elettrico-go-up/
 * WooCommerce product 14107, 769,00 €. The page states one figure — 150 kg.
 */

import { generalTerms } from '../shared/terms.ts';
import { patientLiftsSale } from './category.ts';

export const goUpHoist = patientLiftsSale.fixed({
  code: 'go-up-hoist',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 769,

  translations: {
    it: {
      title: 'Vendita Sollevatore Elettrico GO UP',
      slug: 'vendita-sollevatore-elettrico-go-up',
      shortDescription: 'Non perdere l’Offerta speciale! Il sollevatore elettrico GO UP è un dispositivo medicale progettato per il trasferimento sicuro e confortevole di persone con ridotta capacità motoria. Ideale per un utilizzo continuativo e quotidiano. Fino ad esaurimento scorte.',
      metaTitle: 'Vendita Sollevatore Elettrico GO UP - Mia Medical Italia',
      metaDescription: 'Sollevatore elettrico GO UP da bagno per anziani in vendita. Disponibilità immediata. Consegna rapida in 24/48h. Il miglior qualità prezzo sul mercato!',
      description: [
        '<h3>Vendita Sollevatore elettrico per anziani per uso sanitario al bagno : un supporto essenziale per la mobilità assistita.</h3>',
        '<p>Il <strong>sollevatore elettrico GO UP</strong> per anziani è un dispositivo medicale progettato per il <strong>trasferimento sicuro e confortevole di persone con ridotta capacità motoria e per l&#8217;uso in bagno.</strong> Ideale per un utilizzo continuativo e quotidiano, rappresenta una scelta strategica per chi desidera garantire assistenza costante nel tempo, in ambito domestico o professionale.</p>',
        '<p>Indicato per il passaggio dal letto alla carrozzina o della poltrona è sopratutto ideal per il bagno o in qualsiasi situazione di spostamento nei piccoli spazi , il GO UP si rivela un ausilio indispensabile per mantenere la sicurezza dell’assistito, migliorando al contempo la qualità del lavoro del caregiver.</p>',
        '<h4>Caratteristiche tecniche del modello GO UP</h4>',
        '<ul><li>Sollevamento elettrico con comando manuale</li><li>Altezza regolabile da 40 a 73 cm</li><li>Display digitale con indicatore livello batteria</li><li>Portata massima: 150 kg</li><li>Struttura robusta e telaio rinforzato</li><li>4 ruote piroettanti con freni posteriori</li><li>Seduta ergonomica imbottita impermeabile e removibile</li><li>Schienale imbottito, braccioli e poggiapiedi antiscivolo</li><li>Apertura centrale nella seduta per utilizzo sanitario (funzione toilette)</li></ul>',
        '<h3>A chi è indicato l’acquisto del sollevatore elettrico GO UP</h3>',
        '<p>Il servizio di vendita di sollevatori elettrici è stato pensato in particolare per :</p>',
        '<ul><li><strong>Famiglie</strong> che assistono quotidianamente un parente con mobilità ridotta e vogliono un valido aiuto per i spostamenti in bagno. </li><li><strong>Strutture sanitarie e case di cura</strong> che necessitano di un dispositivo proprio e permanente</li><li><strong>Operatori e caregiver domiciliari </strong>che lavorano in modo continuativo con lo stesso paziente</li><li><strong>Centri di fisioterapia o riabilitazione</strong> che desiderano dotarsi di attrezzature professionali</li></ul>',
        '<p>Investire in un sollevatore significa garantire nel tempo sicurezza e serenità a chi vive o lavora in contesti di assistenza continuativa.</p>',
        '<h3><strong>Vendita sollevatore elettrico GO UP per anziani: comfort, sicurezza e autonomia ogni giorno</strong></h3>',
        '<p>Disporre di un sollevatore personale migliora significativamente la quotidianità, sia per chi riceve assistenza sia per chi la presta. Grazie al GO UP, ogni movimento diventa più semplice, più sicuro e meno stressante. Inoltre, scegliere il GO UP significa dotarsi di un ausilio durevole, affidabile e di qualità, pensato per resistere nel tempo e garantire assistenza professionale e continua. È una soluzione ideale per chi ha bisogno di un supporto idoneo al bagno, sotto la doccia e per tutti spostamenti , fisso e sempre disponibile! </p>',
        '<p>Scopri sul nostro <strong><a href="/catalogo-noleggio/">sito tutti i modelli e gli ausili disponibili: strumenti pensati per accompagnare ogni giorno le persone verso una nuova autonomia.</a></strong></p>',
        '<p>Ogni giorno ci impegniamo per fornire ai nostri clienti tutti gli strumenti necessari per l’assistenza a domicilio, in modo che possano ricevere le cure necessarie circondati dall’affetto dei propri cari. <strong>Scegli i servizi di vendita e noleggio M.I.A. Medical Italia. </strong>I nostri ausili vengono attentamente selezionati dai migliori fornitori in modo da garantire un <strong>servizio di altissima qualità, con assistenza costante da parte dei nostri professionisti, consegna a domicilio rapida, in 24/48h.</strong></p>',
        '<h4>Contatti utili</h4>',
        '<p>Che aspetti! Chiamaci subito al +<strong>39 392 65 09 237</strong> per richiedere il tuo sollevatore oggi stesso! Inoltre, basterà mandarci un messaggio su <strong><a href="https://wa.me/393926509237">whatsapp</a></strong> per effettuare la <strong>prenotazione</strong> o per richiedere una <strong>consulenza gratuita</strong>. I nostri <strong>tecnici specializzati sono sempre pronti per eventuali chiarimenti o per guidarti, passo per passo, nella scelta del dispositivo che meglio si adatta alle tue necessità.</strong></p>',
      ].join(''),
    },
    en: {
      title: 'GO UP electric hoist for sale',
      slug: 'vendita-sollevatore-elettrico-go-up',
      shortDescription: 'Do not miss the special offer! The GO UP electric hoist is a medical device built to move someone with reduced mobility safely and comfortably. Made for daily, continuous use. While stocks last.',
      metaTitle: 'GO UP electric hoist for sale - Mia Medical Italia',
      metaDescription: 'GO UP electric bath hoist for older users, for sale. Available immediately, delivered in 24–48 hours. The best quality for the money.',
      description: [
        '<h3>For sale Electric hoist for elderly people for medical use in the bathroom: an essential support for assisted mobility.</h3>',
        '<p>The <strong>GO UP electric hoist</strong> for the elderly is a medical device designed for the <strong>safe and comfortable transfer of persons with reduced mobility and for use in the bathroom.</strong> Ideal for continuous, daily use, it is a strategic choice for those who want to ensure constant care over time, in the home or professional environment.</p>',
        '<p>Indicated for the transition from bed to wheelchair or chair, it is especially ideal for the bathroom or in any situation of movement in small spaces, the GO UP proves to be an indispensable aid for maintaining the safety of the care recipient while improving the quality of the caregiver\'s work.</p>',
        '<h4>Technical characteristics of the GO UP model</h4>',
        '<ul><li>Electric lift with manual control</li><li>Height adjustable from 40 to 73 cm</li><li>Digital display with battery level indicator</li><li>Maximum load capacity: 150 kg</li><li>Sturdy structure and reinforced frame</li><li>4 swivel castors with rear brakes</li><li>Removable, waterproof, padded ergonomic seat</li><li>Upholstered backrest, armrests and non-slip footrests</li><li>Central opening in the seat for sanitary use (toilet function)</li></ul>',
        '<h3>To whom is the purchase of the GO UP electric lift recommended?</h3>',
        '<p>The electric hoist sales service is designed in particular for :</p>',
        '<ul><li><strong>Families</strong> who care for a relative with reduced mobility on a daily basis and want help with toilet movements. </li><li><strong>Healthcare facilities and nursing homes</strong> that need their own permanent device</li><li><strong>Home care workers and caregivers </strong>working continuously with the same patient</li><li><strong>Physiotherapy or rehabilitation centres</strong> who wish to acquire professional equipment</li></ul>',
        '<p>Investing in a hoist means guaranteeing safety and peace of mind over time for those who live or work in continuous care settings.</p>',
        '<h3><strong>GO UP electric hoist for seniors for sale: comfort, safety and independence every day</strong></h3>',
        '<p>Having a personal lift significantly improves everyday life, both for the person receiving care and for the person providing it. Thanks to the GO UP, every movement becomes easier, safer and less stressful. In addition, choosing the GO UP means equipping yourself with a durable, reliable, quality aid designed to stand the test of time and guarantee professional, continuous assistance. It is an ideal solution for those who need a suitable support in the bathroom, in the shower and for all movements, fixed and always available! </p>',
        '<p>Find out about our <strong><a href="/en/rental-catalog/">site all available models and aids: tools designed to accompany people every day towards new autonomy.</a></strong></p>',
        '<p>Every day we strive to provide our customers with all the tools they need for home care, so that they can receive the care they need surrounded by the affection of their loved ones. <strong>Choose M.I.A. Medical Italia sales and rental services. </strong>Our aids are carefully selected from the best suppliers in order to guarantee a <strong>top quality service, with constant assistance from our professionals, fast home delivery in 24/48 hours.</strong></p>',
        '<h4>Useful contacts</h4>',
        '<p>What are you waiting for! Call us now at +<strong>39 392 65 09 237</strong> to request your lift today! In addition, simply send us a message on <strong><a href="https://wa.me/393926509237">whatsapp</a></strong> to carry out the <strong>booking</strong> or to request a <strong>free consultation</strong>. Our <strong>specialised technicians are always ready for clarification or to guide you, step by step, in choosing the device that best suits your needs.</strong></p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 150,
  },

  media: {
    thumbnail: { file: 'go-up-hoist-1.jpeg', alt: { it: 'Vendita e Noleggio sollevatore elettrico GO UP' } },
    gallery: [
      { file: 'go-up-hoist-2.jpeg', alt: { it: 'Vendita e noleggio sollevatore elettrico GO UP' } },
      { file: 'go-up-hoist-3.jpeg', alt: { it: 'Noleggio Sollevatore Elettrico Go Up' } },
      { file: 'go-up-hoist-4.png', alt: { it: 'Noleggio Sollevatore Elettrico GO UP' } },
    ],
  },
  terms: [generalTerms],
});
