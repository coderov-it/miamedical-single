/**
 * Noleggio Criomagnetoterapia CRYOCEMP
 *
 * /prodotto/noleggio-criomagnetoterapia/  ·  WooCommerce product 15347.
 *
 * "Due tecnologie, un'unica terapia" — CEMP magnetotherapy and compression
 * cryotherapy in one machine. The most expensive therapy hire in the catalogue at
 * 350 € for 20 days. No specification block on the page.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { cryomagnetotherapyHire } from './category.ts';

export const cryocemp = cryomagnetotherapyHire.rental({
  code: 'cryocemp',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(20, 350),
    days(30, 465),
    days(45, 560),
  ],

  translations: {
    it: {
      title: 'Noleggio Criomagnetoterapia CRYOCEMP',
      slug: 'noleggio-criomagnetoterapia',
      shortDescription: 'Noleggio Criomagnetoterapia: Magnetoterapia CEMP + Crioterapia Compressiva : “Due tecnologie, un’unica terapia”…. ……per ridurre dolore, infiammazione ed edema e favorire un recupero più rapido, Ideale dopo interventi, traumi o attività sportiva. Consegna in tutta Italia da 15€ + 15€ Consegna Gratuita per noleggi da 30 giorni Nessuna cauzione richiesta',
      metaTitle: 'Noleggio Criomagnetoterapia – Magnetoterapia + Crioterapia',
      metaDescription: 'Noleggio criomagnetoterapia con magnetoterapia CEMP e crioterapia compressiva. Riduci dolore e infiammazione e accelera il recupero direttamente a casa.',
      description: [
        '<h2>Magnetoterapia CEMP + Crioterapia Compressiva</h2>',
        '<p>“Due tecnologie, un’unica terapia” </p>',
        '<p>Il <strong>noleggio combinato di magnetoterapia CEMP e crioterapia compressiva</strong> rappresenta una soluzione efficace e professionale per il trattamento del dolore, dell’infiammazione e per il recupero muscolo-scheletrico direttamente a domicilio. </p>',
        '<p>Questa combinazione terapeutica permette di agire su più livelli: da un lato la <strong>crioterapia compressiva</strong>, che riduce rapidamente infiammazione, edema e dolore, dall’altro la <strong>magnetoterapia CEMP</strong>, che stimola i naturali processi di rigenerazione dei tessuti e favorisce il recupero osseo e articolare.</p>',
        '<p>Il noleggio consente di effettuare <strong>terapie fisioterapiche professionali a casa</strong>, evitando l’acquisto di dispositivi costosi e utilizzandoli per il tempo realmente necessario.</p>',
        '<h2>A chi è indicata la Criomagnetoterapia</h2>',
        '<p>Il trattamento è indicato per:</p>',
        '<ul><li>dolori muscolari e articolari</li><li>infiammazioni acute o croniche</li><li>traumi sportivi</li><li>distorsioni</li><li>edemi e gonfiore</li><li>recupero post-operatorio</li><li>patologie osteo-articolari</li><li>riabilitazione dopo fratture o interventi ortopedici</li></ul>',
        '<p>È adatta sia a pazienti privati sia a fisioterapisti e professionisti della riabilitazione.</p>',
        '<h2>Magnetoterapia CEMP</h2>',
        '<p>La <strong><a href="/prodotto/noleggio-magnetocemp-elite-globus/">magnetoterapia a campi elettromagnetici pulsati (CEMP)</a></strong> stimola i naturali processi di rigenerazione dei tessuti e la formazione di nuovo tessuto osseo.</p>',
        '<p>Benefici principali:</p>',
        '<ul><li>riduzione dell’infiammazione</li><li>stimolazione della rigenerazione ossea</li><li>miglioramento del trofismo tissutale</li><li>riduzione del dolore</li><li>accelerazione dei tempi di recupero</li></ul>',
        '<p>È particolarmente indicata per fratture, artrosi, osteoporosi e infiammazioni dell’apparato muscolo-scheletrico.</p>',
        '<h2>Crioterapia compressiva</h2>',
        '<p>La <strong><a href="/prodotto/noleggio-cryoterapia-compressiva-cryopush/">crioterapia compressiva</a></strong> combina raffreddamento terapeutico e compressione pneumatica per ridurre rapidamente dolore, gonfiore e infiammazione.</p>',
        '<p>Benefici principali:</p>',
        '<ul><li>riduzione immediata del dolore</li><li>diminuzione dell’edema</li><li>effetto antinfiammatorio</li><li>miglioramento della circolazione locale</li><li>recupero più rapido dopo traumi o interventi chirurgici</li></ul>',
        '<p>È ampiamente utilizzata in riabilitazione ortopedica e medicina sportiva.</p>',
        '<h2>Perché scegliere il noleggio di Criomagnetoterapia</h2>',
        '<p>Il noleggio combinato consente di:</p>',
        '<ul><li>ridurre dolore e infiammazione in modo naturale</li><li>accelerare il recupero post-traumatico e post-operatorio</li><li>effettuare terapie professionali a domicilio</li><li>evitare l’acquisto di dispositivi costosi</li><li>adattare la durata della terapia alle proprie esigenze</li></ul>',
        '<h2>Consegna e assistenza</h2>',
        '<ul><li>consegna in tutta Italia</li><li>consegna gratuita per noleggi da 30 giorni</li><li>nessuna cauzione richiesta</li><li>assistenza tecnica durante tutto il periodo di noleggio</li></ul>',
        '<p><p>Per informazioni, disponibilità e consulenza personalizzata puoi contattarci al <strong>+39 392 6509237</strong> oppure scriverci su WhatsApp.</p>',
        '<p>Il nostro personale è sempre a disposizione per aiutarti a trovare la soluzione terapeutica più adatta alle tue esigenze.</p>',
      ].join(''),
    },
    en: {
      title: 'CRYOCEMP cryomagnetotherapy, for hire',
      slug: 'noleggio-criomagnetoterapia',
      shortDescription: 'Cryomagnetotherapy Rental: PEMF Magnetotherapy + Compressive Cryotherapy: “Two technologies, one therapy”... ...to reduce pain, inflammation and swelling and promote a faster recovery, Ideal after surgery, trauma, or sports activities. Delivery throughout Italy from €15 + €15 Free delivery for rentals from 30 days No deposit required',
      metaTitle: 'Cryomagnetotherapy hire — magnetotherapy + cryotherapy',
      metaDescription: 'Cryomagnetotherapy hire with PEMF magnetotherapy and compression cryotherapy. Cut pain and inflammation and speed up recovery.',
      description: [
        '<h2>PEMF magnetotherapy + compression cryotherapy</h2>',
        '<p>“Two technologies, one therapy” </p>',
        '<p>The <strong>combined PEMF magnetotherapy and compression cryotherapy rental</strong> It offers an effective and professional solution for pain treatment, inflammation, and musculoskeletal recovery, directly in your home. </p>',
        '<p>This therapeutic combination allows action on multiple levels: on the one hand, the <strong>compression cryotherapy</strong>, which rapidly reduces inflammation, oedema, and pain, on the other hand the <strong>PEMF magnetotherapy</strong>, which stimulates natural tissue regeneration processes and promotes bone and joint recovery.</p>',
        '<p>Rental allows <strong>professional physiotherapy therapies at home</strong>, avoiding the purchase of expensive devices and using them only for the time actually needed.</p>',
        '<h2>La criomagnetoterapia è indicata per un\'ampia gamma di affezioni, tra cui: * **Traumatologia sportiva:** Rotture muscolari, distorsioni, contusioni, tendiniti ed epicondiliti. * **Patologie articolari:** Artrosi, artriti, condropatie e riabilitazione post-operatoria delle articolazioni. * **Dolore cronico:** Lombalgie, cervicalgie, sciatalgie, dolori muscoloscheletrici. * **Edemi e infiammazioni:** Strappi muscolari, edemi post-traumatici e post-operatori. * **Problemi circolatori:** Efficace anche nelle affezioni legate alla circolazione periferica e nel trattamento di ulcere venose. * **Recupero post-operatorio:** Accelerazione dei processi riparativi e riduzione del dolore. * **Dolore e infiammazione localizzati:** In generale, è utile per trattare dolori e infiammazioni in specifiche aree del corpo.</h2>',
        '<p>The treatment is indicated for:</p>',
        '<ul><li>muscle and joint pain</li><li>acute or chronic inflammation</li><li>sports injuries</li><li>distortions</li><li>oedemas and swelling</li><li>post-operative recovery</li><li>osteo-articular pathologies</li><li>rehabilitation after fractures or orthopaedic surgery</li></ul>',
        '<p>It is suitable for both private patients and physiotherapists and rehabilitation professionals.</p>',
        '<h2>PEMF magnetotherapy</h2>',
        '<p>La <strong><a href="/en/product/noleggio-magnetocemp-elite-globus/">pulsed electromagnetic field magnetotherapy (PEMF)</a></strong> stimulates natural tissue regeneration processes and the formation of new bone tissue.</p>',
        '<p>Main benefits:</p>',
        '<ul><li>reduction of inflammation</li><li>stimulation of bone regeneration</li><li>improvement of tissue trophism</li><li>reduction of pain</li><li>acceleration of recovery times</li></ul>',
        '<p>It is particularly suitable for fractures, arthritis, osteoporosis and inflammation of the musculoskeletal system.</p>',
        '<h2>Compression cryotherapy</h2>',
        '<p>La <strong><a href="/en/product/noleggio-cryoterapia-compressiva-cryopush/">compression cryotherapy</a></strong> combines therapeutic cooling and pneumatic compression to rapidly reduce pain, swelling and inflammation.</p>',
        '<p>Main benefits:</p>',
        '<ul><li>immediate pain reduction</li><li>reduction of oedema</li><li>anti-inflammatory effect</li><li>improvement of local circulation</li><li>Faster recovery after trauma or surgery</li></ul>',
        '<p>It is widely used in orthopaedic rehabilitation and sports medicine.</p>',
        '<h2>Why choose cryomagnetotherapy rental</h2>',
        '<p>Combined rental allows</p>',
        '<ul><li>reduce pain and inflammation naturally</li><li>accelerate post-traumatic and post-operative recovery</li><li>performing professional therapies at home</li><li>avoid buying expensive devices</li><li>adapt the duration of therapy to one\'s needs</li></ul>',
        '<h2>Delivery and Service</h2>',
        '<ul><li>delivery throughout Italy</li><li>free delivery for rentals from 30 days</li><li>no deposit required</li><li>technical assistance throughout the rental period</li></ul>',
        '<p><p>For information, availability and personalised advice, you can contact us at <strong>+39 392 6509237</strong> or write to us on WhatsApp.</p>',
        '<p>Our staff are always on hand to help you find the most suitable therapeutic solution for your needs.</p>',
      ].join(''),
    },
  },

  specs: {
    channels: { it: 'Magnetoterapia CEMP e crioterapia compressiva', en: 'PEMF magnetotherapy and compression cryotherapy' },
  },

  media: {
    thumbnail: 'cryocemp-1.png',
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
