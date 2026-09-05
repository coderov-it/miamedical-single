/**
 * Affitto carrozzina di piccole dimensioni ad autospinta – SLIM
 *
 * /prodotto/affitto-carrozzina-per-disabili-di-piccole-dimensioni-autospinta-slim/
 * WooCommerce product 8947, a variable product with seven "Quanto costa?"
 * variations.
 *
 * ⚠️ The 90-day variation (13614) is priced at 0 € on the live site. Its own
 * label says 100 €, and every sibling chair in the category prices 90 days at
 * 100 €, so 100 € is what is written here. The live variation needs fixing.
 *
 * The page also advertises "Noleggio per 1 giorno: 15€ con ritiro solamente in
 * sede", which is NOT one of the seven variations — it cannot be ordered online.
 * It stays in the short description, where the shop puts it, rather than becoming
 * a package the order form never offered.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const slimSelfPropelled = wheelchairsHire.rental({
  code: 'slim-self-propelled',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(3, 25),
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 100),  // 90 giorni - 100 € — label — THE VARIATION PRICE IS 0 ON THE LIVE SITE
  ],

  translations: {
    it: {
      title: 'Affitto carrozzina di piccole dimensioni ad autospinta – SLIM',
      slug: 'affitto-carrozzina-per-disabili-di-piccole-dimensioni-autospinta-slim',
      shortDescription: 'Noleggio Sedia a Rotelle Piccola Adatta per chi ha poco spazio. Il ritiro e la riconsegna delle carrozzine in magazzino è gratuito! Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Consegna e ritiro a domicilio a Roma e Firenze da 30€. Prenota online o contattaci tramite WhatsApp!',
      metaTitle: 'Affitto carrozzina per disabili piccola ad autospinta',
      metaDescription: 'Affitto carrozzina per disabili di piccole dimensioni autospinta - SLIM. Disponibilità immediata. Consegna a domicilio! Chiamaci al +393926509237',
      description: [
        '<p>L’affitto carrozzina per disabili piccola ad autospinta è la soluzione ideale per chi necessita di un ausilio pratico, compatto e facilmente manovrabile in ambienti con spazi ridotti. Questo tipo di carrozzina è progettato per garantire comfort, sicurezza e autonomia sia in casa che in strutture sanitarie o ambienti esterni.</p>',
        '<p>La carrozzina SLIM è uno dei modelli più richiesti per il noleggio grazie alle sue dimensioni ridotte e alla struttura leggera ma resistente, perfetta per chi ha bisogno di muoversi con facilità anche in corridoi stretti, ascensori piccoli o bagni angusti.</p>',
        '<h2>Carrozzina per disabili piccola ad autospinta SLIM: la soluzione per spazi ridotti</h2>',
        '<p>La carrozzina SLIM nasce per rispondere alle esigenze di chi ha problemi di mobilità ma deve affrontare ambienti poco spaziosi. La sua struttura compatta permette di passare facilmente in:</p>',
        '<ul><li>bagni stretti di abitazioni private</li><li>corridoi ridotti</li><li>ascensori condominiali o ospedalieri</li><li>porte con larghezza limitata</li></ul>',
        '<p>Grazie a queste caratteristiche, l’affitto carrozzina per disabili piccola ad autospinta SLIM è una scelta sempre più diffusa sia per utilizzi temporanei che prolungati.</p>',
        '<h2>A chi è consigliato il noleggio della carrozzina SLIM</h2>',
        '<p>Il servizio di affitto carrozzina per disabili piccola ad autospinta è indicato per diverse tipologie di utenti, tra cui:</p>',
        '<ul><li>persone anziane con difficoltà motorie</li><li>pazienti in riabilitazione post-operatoria</li><li>persone con disabilità temporanee o permanenti</li><li>utenti con infortuni agli arti inferiori</li></ul>',
        '<p>La possibilità di scegliere tra versione ad autospinta e da <strong><a href="/prodotto/noleggio-sedia-a-rotelle-stretta-carrozzina-slim-di-transito/">transito</a></strong> rende questo modello estremamente versatile e adatto anche quando è presente un accompagnatore.</p>',
        '<h2>Caratteristiche della carrozzina per disabili piccola ad autospinta SLIM</h2>',
        '<p>La carrozzina SLIM a noleggio è progettata per offrire praticità e sicurezza in ogni situazione. Tra le principali caratteristiche troviamo:</p>',
        '<ul><li>struttura pieghevole e compatta</li><li>telaio leggero ma robusto</li><li>braccioli removibili per facilitare il trasferimento</li><li>pedane poggiapiedi estraibili</li><li>freni di stazionamento su entrambe le ruote posteriori</li></ul>',
        '<p>Al momento della consegna, viene fornita una spiegazione completa sul corretto utilizzo della carrozzina, inclusi i sistemi di apertura, chiusura e sicurezza.</p>',
        '<h2>Dimensioni della carrozzina SLIM ad autospinta</h2>',
        '<p>Uno dei principali vantaggi della carrozzina per disabili piccola ad autospinta SLIM è la sua larghezza ridotta.</p>',
        '<p>Le misure della seduta disponibili sono:</p>',
        '<ul><li><strong>40</strong> cm</li><li><strong>43 </strong>cm</li></ul>',
        '<p>Queste dimensioni la rendono una delle carrozzine più strette della categoria, ideale per ambienti dove lo spazio è limitato.</p>',
        '<p>È importante considerare che questo modello è indicato per utenti con peso generalmente fino a circa 80 kg, per garantire il massimo della sicurezza e stabilità, per persone con pesi superiori vi invitiamo a guardare <strong><a href="/catalogo-noleggio/">tutte le carrozzine disponibili</a></strong> per il noleggio. </p>',
        '<h2>Vantaggi dell’affitto carrozzina per disabili piccola ad autospinta</h2>',
        '<p>Scegliere il noleggio invece dell’acquisto offre numerosi vantaggi, soprattutto per utilizzi temporanei.</p>',
        '<p>Tra i principali benefici troviamo:</p>',
        '<ul><li>risparmio economico rispetto all’acquisto</li><li>disponibilità immediata del dispositivo</li><li>nessuna manutenzione a carico dell’utente</li><li>possibilità di utilizzo solo per il periodo necessario</li><li>assistenza e supporto inclusi</li></ul>',
        '<p>Questo rende l’affitto carrozzina per disabili piccola ad autospinta una soluzione ideale in caso di interventi chirurgici, riabilitazione o necessità temporanee.</p>',
        '<h2>Differenza tra carrozzina standard e carrozzina SLIM</h2>',
        '<p>Rispetto ai modelli standard, la carrozzina SLIM si distingue per le dimensioni ridotte e la maggiore manovrabilità.</p>',
        '<p>Le carrozzine tradizionali risultano spesso ingombranti in ambienti domestici stretti, mentre il modello SLIM è progettato proprio per superare queste limitazioni.</p>',
        '<p>Questo la rende particolarmente utile in abitazioni private, strutture sanitarie e ambienti con passaggi ridotti.</p>',
        '<h2>Sicurezza e igiene garantite</h2>',
        '<p>Tutte le carrozzine a noleggio vengono:</p>',
        '<ul><li>accuratamente pulite</li><li>completamente sanificate</li><li>controllate tecnicamente prima della consegna</li></ul>',
        '<p>L’igiene è un aspetto fondamentale, soprattutto quando si tratta di dispositivi medici utilizzati da persone fragili o in fase di recupero.</p>',
        '<h2>Utilizzo pratico della carrozzina SLIM in ambienti quotidiani</h2>',
        '<p>La carrozzina per disabili piccola ad autospinta SLIM è particolarmente indicata per l’utilizzo quotidiano in contesti domestici e sanitari dove lo spazio rappresenta una limitazione importante. Grazie alla sua struttura compatta, permette di muoversi agevolmente anche in abitazioni non adattate ai disabili.</p>',
        '<p>In molte case, infatti, porte e corridoi non sono progettati per carrozzine di dimensioni standard. In questi casi, il modello SLIM rappresenta una soluzione efficace perché riduce al minimo gli ingombri e facilita gli spostamenti tra le diverse stanze.Perché scegliere un noleggio invece dell’acquisto</p>',
        '<p>Il noleggio della carrozzina SLIM è una scelta sempre più diffusa perché permette di avere un dispositivo professionale senza dover sostenere un investimento elevato.</p>',
        '<p>In molti casi, infatti, la necessità di una carrozzina è temporanea, come nel periodo post-operatorio o durante la riabilitazione. In queste situazioni, l’affitto carrozzina per disabili piccola ad autospinta è la soluzione più conveniente e pratica.</p>',
        '<p>Inoltre, il servizio di noleggio evita problemi legati alla manutenzione, alla pulizia e alla gestione del dispositivo nel tempo.</p>',
        '<h2>Disponibilità immediata e flessibilità del servizio</h2>',
        '<p>Uno dei vantaggi principali del servizio è la disponibilità immediata della carrozzina SLIM. Questo significa che, in caso di necessità urgente, è possibile ricevere il dispositivo in tempi molto rapidi.</p>',
        '<p>Il servizio è inoltre flessibile: la durata del noleggio può essere adattata in base alle reali esigenze dell’utente, sia per periodi brevi che prolungati.</p>',
        '<h2>Prenota il tuo affitto carrozzina per disabili piccola ad autospinta</h2>',
        '<p>Prenotare la carrozzina SLIM è semplice e veloce. Il nostro servizio di noleggio garantisce assistenza completa dalla scelta del modello fino alla consegna.</p>',
        '<ul><li>📞 <strong>Telefono / WhatsApp:</strong> +39 392 650 9237</li><li>✉ <strong>Email:</strong> amministrazione@miamedicalitalia.it</li></ul>',
        '<p>Il nostro staff è a disposizione per aiutarti a scegliere la soluzione più adatta alle tue esigenze. Il noleggio della carrozzina per disabili di piccole dimensioni ad autospinta è essenziale per chi ha problematiche di spazio.</p>',
        '<p>Scopri la nostra pagina <a href="http://facebook.com/MIAMedicalitalia/">Facebook </a></p>',
      ].join(''),
    },
    en: {
      title: 'Small self-propelled wheelchair for hire – SLIM',
      slug: 'affitto-carrozzina-per-disabili-di-piccole-dimensioni-autospinta-slim',
      shortDescription: 'Small Wheelchair Hire. Suitable for those with limited space. Collection and return of wheelchairs to the warehouse is free of charge! Hire for 1 day: 15€ with pick-up on site only. Home delivery and pick-up in Rome and Florence from 30€. Book online or contact us via WhatsApp!',
      metaTitle: 'Small self-propelled wheelchair hire',
      metaDescription: 'Hire a small self-propelled wheelchair for disabled users — SLIM. Available immediately. Delivered to your door. Call us on +393926509237',
      description: [
        '<p>Renting a small, self-propelled wheelchair for people with disabilities is the ideal solution for those who need a practical, compact and easily manoeuvrable aid in confined spaces. This type of wheelchair is designed to ensure comfort, safety and independence both at home and in healthcare facilities or outdoor settings.</p>',
        '<p>The SLIM wheelchair is one of the most popular models for hire thanks to its compact size and lightweight yet sturdy frame, making it perfect for anyone who needs to move around easily, even in narrow corridors, small lifts or cramped bathrooms.</p>',
        '<h2>SLIM compact self-propelled wheelchair: the solution for confined spaces</h2>',
        '<p>The SLIM wheelchair has been designed to meet the needs of people with mobility issues who have to navigate confined spaces. Its compact design allows it to manoeuvre easily through:</p>',
        '<ul><li>narrow bathrooms in private homes</li><li>narrow corridors</li><li>lifts in blocks of flats or hospitals</li><li>doors with limited width</li></ul>',
        '<p>Thanks to these features, the SLIM small self-propelled wheelchair for people with disabilities is an increasingly popular choice for both temporary and long-term use.</p>',
        '<h2>Who is the SLIM wheelchair hire recommended for?</h2>',
        '<p>The self-propelled small wheelchair hire service is suitable for various types of users, including:</p>',
        '<ul><li>older people with mobility difficulties</li><li>post-operative rehabilitation patients</li><li>people with temporary or permanent disabilities</li><li>users with lower-limb injuries</li></ul>',
        '<p>The option to choose between a self-propelled version and a <strong><a href="/en/product/noleggio-sedia-a-rotelle-stretta-carrozzina-slim-di-transito/">transit</a></strong> This makes this model extremely versatile and suitable even when a companion is present.</p>',
        '<h2>Features of the SLIM small self-propelled wheelchair for people with disabilities</h2>',
        '<p>The SLIM hire wheelchair is designed to offer convenience and safety in every situation. Its main features include:</p>',
        '<ul><li>folding and compact design</li><li>lightweight yet sturdy frame</li><li>removable armrests to make transferring easier</li><li>removable footrests</li><li>parking brakes on both rear wheels</li></ul>',
        '<p>Upon delivery, a full explanation is provided on how to use the wheelchair correctly, including the opening, closing and safety mechanisms.</p>',
        '<h2>Dimensions of the SLIM self-propelled wheelchair</h2>',
        '<p>One of the main advantages of the SLIM compact self-propelled wheelchair is its narrow width.</p>',
        '<p>The available seat sizes are:</p>',
        '<ul><li><strong>40</strong> cm</li><li><strong>43 </strong>cm</li></ul>',
        '<p>These dimensions make it one of the narrowest wheelchairs in its class, ideal for environments where space is limited.</p>',
        '<p>It is important to bear in mind that this model is suitable for users weighing generally up to around 80 kg, to ensure maximum safety and stability; for those weighing more than this, please see <strong><a href="/en/rental-catalog/">all available wheelchairs</a></strong> for hire. </p>',
        '<h2>Benefits of hiring a small self-propelled wheelchair for people with disabilities</h2>',
        '<p>Choosing to hire rather than buy offers numerous advantages, particularly for temporary use.</p>',
        '<p>The main benefits include:</p>',
        '<ul><li>cost savings compared with buying</li><li>immediate availability of the device</li><li>no maintenance required on the part of the user</li><li>may only be used for as long as necessary</li><li>service and support included</li></ul>',
        '<p>This makes hiring a small, self-propelled wheelchair for people with disabilities an ideal solution in the event of surgery, rehabilitation or temporary needs.</p>',
        '<h2>The difference between a standard wheelchair and a SLIM wheelchair</h2>',
        '<p>Compared with standard models, the SLIM wheelchair stands out for its compact size and greater manoeuvrability.</p>',
        '<p>Traditional wheelchairs are often bulky in cramped domestic environments, whereas the SLIM model is specifically designed to overcome these limitations.</p>',
        '<p>This makes it particularly useful in private homes, healthcare facilities and spaces with limited access.</p>',
        '<h2>Safety and hygiene guaranteed</h2>',
        '<p>All hire wheelchairs are:</p>',
        '<ul><li>thoroughly cleaned</li><li>fully sanitised</li><li>inspected for technical compliance prior to delivery</li></ul>',
        '<p>Hygiene is a key consideration, particularly when it comes to medical devices used by frail people or those recovering from illness.</p>',
        '<h2>Practical use of the SLIM wheelchair in everyday settings</h2>',
        '<p>The SLIM compact self-propelled wheelchair is particularly suitable for everyday use in domestic and healthcare settings where space is a major constraint. Thanks to its compact design, it allows users to move around easily even in homes that are not adapted for disabled people.</p>',
        '<p>In many homes, in fact, doors and corridors are not designed to accommodate standard-sized wheelchairs. In such cases, the SLIM model offers an effective solution as it takes up minimal space and makes it easier to move between different rooms. Why choose to hire rather than buy</p>',
        '<p>Renting the SLIM wheelchair is becoming an increasingly popular choice because it allows you to have a professional-grade device without having to make a significant financial outlay.</p>',
        '<p>In many cases, in fact, the need for a wheelchair is temporary, such as during the post-operative period or whilst undergoing rehabilitation. In these situations, hiring a small, self-propelled wheelchair is the most cost-effective and practical solution.</p>',
        '<p>Furthermore, the hire service avoids problems relating to maintenance, cleaning and the day-to-day management of the device.</p>',
        '<h2>Immediate availability and flexibility of the service</h2>',
        '<p>One of the main advantages of the service is the immediate availability of the SLIM wheelchair. This means that, in the event of an urgent need, you can receive the device very quickly.</p>',
        '<p>The service is also flexible: the hire period can be tailored to the user’s actual needs, whether for short or long periods.</p>',
        '<h2>Book your small self-propelled wheelchair hire</h2>',
        '<p>Booking the SLIM wheelchair is quick and easy. Our hire service provides comprehensive support, from choosing the model right through to delivery.</p>',
        '<ul><li>📞 <strong>Phone / WhatsApp:</strong> +39 392 650 9237</li><li>✉ <strong>Email:</strong> amministrazione@miamedicalitalia.it</li></ul>',
        '<p>Our staff are on hand to help you choose the solution best suited to your needs. Hiring a compact self-propelled wheelchair is essential for those with space constraints.</p>',
        '<p>Discover our page <a href="http://facebook.com/MIAMedicalitalia/">Facebook </a></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'self-propelled',
    'age-group': 'adult',
    'max-load': 80,
    'seat-width': { min: 40, max: 43 },
    foldable: true,
    'removable-armrests': true,
    'removable-footrests': true,
    brakes: 'parking',
  },

  media: {
    thumbnail: { file: 'slim-self-propelled-1.jpg', alt: { it: 'carrozzina per disabili piccola ad autospinta SLIM' } },
    gallery: [
      'slim-self-propelled-2.jpg',
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
