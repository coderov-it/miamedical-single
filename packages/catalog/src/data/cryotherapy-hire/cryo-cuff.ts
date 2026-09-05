/**
 * Noleggio Cryo Cuff
 *
 * /prodotto/noleggio-cryo-cuff/  ·  WooCommerce product 15167.
 *
 * Passive compression rather than a pump — the page is explicit: "utilizza la
 * terapia del freddo con compressione passiva". The cheapest cryotherapy hire in
 * the catalogue.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { cryotherapyHire } from './category.ts';

export const cryoCuff = cryotherapyHire.rental({
  code: 'cryo-cuff',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 120),
    days(20, 150),
    days(30, 180),
  ],

  translations: {
    it: {
      title: 'Noleggio Cryo Cuff: crioterapia con compressione per recupero post-operatorio e riabilitativo',
      slug: 'noleggio-cryo-cuff',
      shortDescription: 'Noleggio Cryo Cuff – crioterapia professionale post operatoria Facilissima da usare, ideale per il trattamento domiciliare. La Cryo Cuff utilizza la terapia del freddo con compressione passiva per ridurre dolore, gonfiore ed edema. Consegna gratis se acquisti un noleggio per un minimo di 20 giorni. Per noleggi di durata minore consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio Cryo Cuff per crioterapia post operatoria e riabilitazione',
      metaDescription: 'Noleggio Cryo Cuff per crioterapia post operatoria e post traumatica. Riduce dolore ed edema. Consegna rapida in tutta Italia.',
      description: [
        '<p>Il <strong>noleggio Cryo Cuff</strong> è una soluzione efficace di <strong>crioterapia con compressione</strong> che contribuisce al recupero post-operatorio, post-traumatico e riabilitativo.<br />La terapia del freddo associata alla compressione aiuta a <strong>ridurre il dolore</strong>, <strong>contenere edema e gonfiore</strong> e a <strong>limitare il ricorso a farmaci analgesici</strong>, favorendo una guarigione più rapida e naturale.</p>',
        '<p>Il noleggio della crioterapia compressiva <strong>Cryo Cuff</strong> è indicato per pazienti e sportivi che necessitano di un trattamento sicuro, semplice da utilizzare e adatto anche all’uso domiciliare.</p>',
        '<h2>I benefici del noleggio della crioterapia compressiva Cryo Cuff</h2>',
        '<p>Il <strong>noleggio della terapia del freddo con compressione</strong> offre numerosi benefici terapeutici, risultando più efficace rispetto ai protocolli tradizionali come il R.I.C.E. (Riposo, Ghiaccio, Compressione, Elevazione).</p>',
        '<p><strong>Benefici principali:</strong></p>',
        '<ul><li>Azione <strong>antiedemigena</strong></li><li><strong>Riduzione del dolore</strong> e innalzamento della soglia algica</li><li>Controllo di <strong>gonfiore ed ematomi</strong></li><li>Miglioramento del recupero funzionale</li><li>Riduzione del rischio di <strong>emartro</strong> nel post-operatorio</li><li>Minore necessità di analgesici</li></ul>',
        '<p>L’uso regolare della <strong>CryoCuff a noleggio</strong> consente di ottimizzare i tempi di recupero e migliorare i risultati riabilitativi.</p>',
        '<h2>Noleggio Cryo Cuff: semplice, pratica e facile da usare</h2>',
        '<p>Il sistema <strong>Cryo/Cuff</strong> è <strong>leggero, compatto e intuitivo</strong>, progettato per garantire il massimo comfort al paziente.</p>',
        '<p><strong>Caratteristiche principali:</strong></p>',
        '<ul><li>Impacchi freddi anatomici, <strong>rimovibili e riutilizzabili</strong></li><li>Compressione uniforme sull’area trattata</li><li>Utilizzo semplice anche a domicilio</li><li>Dispositivo trasportabile</li><li>Ideale per trattamenti continui nei giorni successivi a interventi chirurgici</li><li></li></ul>',
        '<h2>Frequenza d’uso della terapia del freddo Cryo/Cuff</h2>',
        '<p>Si raccomanda un’applicazione di <strong>20–30 minuti</strong>, da ripetere <strong>più volte al giorno</strong> secondo indicazione medica o fisioterapica.</p>',
        '<p>L’utilizzo della Cryo/Cuff per <strong>diversi giorni consecutivi</strong>, soprattutto nel periodo post-operatorio, contribuisce a:</p>',
        '<ul><li>Ridurre il dolore</li><li>Minimizzare il rischio di emartro</li><li>Favorire una ripresa più rapida</li></ul>',
        '<h2>Come funziona la crioterapia con Cryo Cuff?</h2>',
        '<p>La <strong>crioterapia</strong> utilizza il freddo per abbassare la temperatura dei tessuti tramite <strong>conduzione termica</strong>.</p>',
        '<p>Gli effetti principali sull’area trattata sono:</p>',
        '<ul><li><strong>Vasocostrizione iniziale</strong>, che riduce sanguinamento e infiammazione</li><li><strong>Vasodilatazione riflessa</strong> dopo 20–30 minuti, meccanismo protettivo dell’organismo</li></ul>',
        '<p><h2>Quando è indicato il noleggio Cryo Cuff?</h2>',
        '<p>Il <strong>noleggio della crioterapia compressiva Cryo Cuff</strong> è indicato per:</p>',
        '<ul><li>Post-operatorio</li><li>Post-traumatico</li><li>Percorsi di riabilitazione</li><li>Recupero muscolare e articolare</li></ul>',
        '<h2>Controindicazioni della crioterapia</h2>',
        '<p>La crioterapia <strong>non è indicata</strong> in caso di:</p>',
        '<ul><li>Malattia di Raynaud</li><li>Vasospasmo</li><li>Ipersensibilità al freddo</li><li>Disturbi della circolazione locale</li></ul>',
        '<p>Si consiglia sempre il parere di un medico o fisioterapista prima dell’utilizzo.</p>',
        '<h2>Noleggio Cryo/Cuff in tutta Italia</h2>',
        '<p>Il <strong>noleggio Cryo/Cuff</strong> è disponibile <strong>in tutta Italia</strong>, con:</p>',
        '<ul><li>Consegna gratuita entro <strong>24/48 ore</strong></li><li>Formazione e istruzioni complete per l’utilizzo</li><li>Supporto dedicato durante tutto il periodo di noleggio</li></ul>',
        '<h2>Vuoi approfondire la crioterapia?</h2>',
        '<p>Leggi anche questi articoli:</p>',
        '<ul><li><a href="https://blog.fisioterapistaa.it/la-crioterapia-per-il-recupero-muscolare/">https://blog.fisioterapistaa.it/la-crioterapia-per-il-recupero-muscolare/</a></li><li><a href="/infortuni-calcio-ausili-sanitari/">/infortuni-calcio-ausili-sanitari/</a></li></ul>',
      ].join(''),
    },
    en: {
      title: 'Cryo Cuff: cryotherapy with compression for recovery after surgery and in rehabilitation, for hire',
      slug: 'noleggio-cryo-cuff',
      shortDescription: 'Cryo Cuff hire – professional post-operative cryotherapy Easy to use, ideal for home treatment. The Cryo Cuff uses the cold therapy with passive compression to reduce pain, swelling and oedema. Free delivery if you purchase a rental for a minimum of 20 days. For shorter rentals, home delivery throughout Italy starts from €15 + €15 for collection. No deposit required!',
      metaTitle: 'Cryo Cuff hire for post-operative cryotherapy and rehabilitation',
      metaDescription: 'Cryo Cuff hire for cryotherapy after surgery or injury. Brings down pain and oedema. Quick delivery anywhere in Italy.',
      description: [
        '<p>The <strong>Cryo Cuff hire</strong> it is an effective solution for <strong>cryotherapy with compression</strong> which contributes to post-operative, post-traumatic and rehabilitation recovery.<br />Cold therapy combined with compression helps to <strong>reduce pain</strong>, <strong>contain oedema and swelling</strong> and to <strong>limiting the use of analgesic drugs</strong>, promoting a quicker and more natural recovery.</p>',
        '<p>The rental of compression cryotherapy <strong>Cryo Cuff</strong> it is suitable for patients and athletes who require a safe, easy-to-use treatment that is also suitable for home use.</p>',
        '<h2>The benefits of Cryo Cuff compression cryotherapy rental</h2>',
        '<p>The <strong>rental of cold therapy with compression</strong> it offers numerous therapeutic benefits, proving more effective than traditional protocols such as R.I.C.E. (Rest, Ice, Compression, Elevation).</p>',
        '<p><strong>Main benefits:</strong></p>',
        '<ul><li>Action <strong>anti-edemigenous</strong></li><li><strong>Pain reduction</strong> and raising the algic threshold</li><li>Control of <strong>swelling and bruising</strong></li><li>Improved functional recovery</li><li>Reducing the risk of <strong>hemer</strong> in the post-operative period</li><li>Lower requirement for analgesics</li></ul>',
        '<p>Regular use of the <strong>CryoCuff for hire</strong> optimises recovery time and improves rehabilitation results.</p>',
        '<h2>Cryo Cuff rental: simple, practical and easy to use</h2>',
        '<p>The system <strong>Cryo/Cuff</strong> è <strong>light, compact and intuitive</strong>, designed for maximum patient comfort.</p>',
        '<p><strong>Main features:</strong></p>',
        '<ul><li>Anatomical cold compresses, <strong>removable and reusable</strong></li><li>Uniform compression on the treated area</li><li>Easy use even at home</li><li>Transportable device</li><li>Ideal for continuous treatment in the days following surgery</li><li></li></ul>',
        '<h2>Frequency of use of the Cryo/Cuff cold therapy</h2>',
        '<p>An application of is recommended <strong>20–30 minutes</strong>, to be repeated <strong>several times a day</strong> according to medical or physiotherapeutic indication.</p>',
        '<p>The use of the Cryo/Cuff for <strong>several consecutive days</strong>, especially in the post-operative period, contributes to:</p>',
        '<ul><li>Reducing pain</li><li>Minimising the risk of marginalisation</li><li>Promote a faster recovery</li></ul>',
        '<h2>How does Cryo Cuff cryotherapy work?</h2>',
        '<p>La <strong>cryotherapy</strong> uses cold to lower the temperature of fabrics through <strong>thermal conduction</strong>.</p>',
        '<p>The main effects on the treated area are:</p>',
        '<ul><li><strong>Initial vasoconstriction</strong>, which reduces bleeding and inflammation</li><li><strong>Reflex vasodilation</strong> after 20–30 minutes, the body\'s protective mechanism</li></ul>',
        '<p><h2>When is Cryo Cuff hire indicated?</h2>',
        '<p>The <strong>Cryo Cuff compression cryotherapy rental</strong> is indicated for:</p>',
        '<ul><li>Post-operative</li><li>Post-traumatic</li><li>Rehabilitation paths</li><li>Muscle and joint recovery</li></ul>',
        '<h2>Contraindications of cryotherapy</h2>',
        '<p>Cryotherapy <strong>it is not indicated</strong> in case of:</p>',
        '<ul><li>Raynaud\'s disease</li><li>Vasospasm</li><li>Cold hypersensitivity</li><li>Local circulation disorders</li></ul>',
        '<p>It is always advisable to seek the advice of a doctor or physiotherapist before use.</p>',
        '<h2>Cryo/Cuff hire throughout Italy</h2>',
        '<p>The <strong>Cryo/Cuff hire</strong> is available <strong>throughout Italy</strong>, with:</p>',
        '<ul><li>Free delivery within <strong>24/48 hours</strong></li><li>Comprehensive training and user instructions</li><li>Dedicated support throughout the rental period</li></ul>',
        '<h2>Want to learn more about cryotherapy?</h2>',
        '<p>Read also these articles:</p>',
        '<ul><li><a href="https://blog.fisioterapistaa.it/la-crioterapia-per-il-recupero-muscolare/">https://blog.fisioterapistaa.it/la-crioterapia-per-il-recupero-muscolare/</a></li><li><a href="/en/infortuni-calcio-ausili-sanitari/">/infortuni-calcio-ausili-sanitari/</a></li></ul>',
      ].join(''),
    },
  },

  media: {
    thumbnail: 'cryo-cuff-1.png',
    gallery: [
      'cryo-cuff-2.png',
      'cryo-cuff-3.png',
    ],
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
