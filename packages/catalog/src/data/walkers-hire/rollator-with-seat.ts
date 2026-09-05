/**
 * Noleggio deambulatore rollatore con seduta
 *
 * /prodotto/noleggio-deambulatore-rollatore-in-alluminio-2/
 * WooCommerce product 12308. Its title is its specification — a rollator with a
 * seat — and the page prints no figures, so `has-seat` is all that is recorded.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { walkersHire } from './category.ts';

export const rollatorWithSeat = walkersHire.rental({
  code: 'rollator-with-seat',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 100),
  ],

  translations: {
    it: {
      title: 'Noleggio deambulatore rollatore con seduta',
      slug: 'noleggio-deambulatore-rollatore-in-alluminio-2',
      shortDescription: 'Consegna a Roma e Firenze a partire da 30€. Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Noleggio Deambulatore Rollator Pieghevole a Roma e Firenze',
      metaDescription: 'Noleggio e vendita Deambulatore Rollator pieghevole leggero, freni e seduta. Migliore Prezzo Garantito. Fidati di noi. Siamo esperti nel noleggio.',
      description: [
        '<p><strong>Noleggio</strong><strong>Deambulatore adatto per uso interno ed esterno, piegevole, regolabile in altezza a Roma e Firenze.</strong></p>',
        '<p>Scopri il nostro&nbsp;<strong>rollator 4 ruote con seduta in alluminio</strong>, l’ausilio ideale per garantire sicurezza e autonomia nella deambulazione. Progettato per supportare le persone con difficoltà motorie, questo dispositivo è perfetto per l’uso quotidiano in ambienti interni ed esterni ed è disponibile per il noleggio nelle aree di&nbsp;<strong>Roma</strong>&nbsp;e&nbsp;<strong>Firenze</strong>.</p>',
        '<h4>Caratteristiche Tecniche e Funzionalità </h4>',
        '<ul><li><strong>Struttura Robusta e Leggera</strong></li><li>Realizzato in <strong>alluminio verniciato</strong>, combina resistenza e leggerezza per un utilizzo pratico e duraturo.</li><li><strong>Design Pieghevole</strong></li><li>Si chiude facilmente con un solo gesto, occupando poco spazio per il trasporto e lo stoccaggio.</li><li><strong>4 Ruote in EVA Ø 20 cm</strong></li><li><strong>Frontali piroettanti con forca completa e catarifrangente</strong> → garantiscono maneggevolezza e sicurezza.</li><li><strong>Posteriori fisse con freni a doppia funzione</strong> → permettono di frenare in movimento o di bloccare il rollator da fermo.</li><li><strong>Impugnature Anatomiche Regolabili</strong></li><li>Comode e adattabili all’altezza dell’utente, complete di <strong>catarifrangente</strong> per una maggiore sicurezza.</li><li><strong>Seduta Imbottita e Schienale in EVA</strong></li><li><strong>Seduta 38×34 cm imbottita e rivestita in PVC</strong>: ideale per concedersi un momento di riposo durante la deambulazione.</li><li><strong>Schienale imbottito in EVA</strong>: supporto ergonomico per il massimo comfort.</li><li><strong>Cestino Porta Oggetti</strong> incluso, perfetto per il trasporto di piccoli effetti personali.</li></ul>',
        '<p><h4><strong>Innovazione e Design: Un Alleato per il Benessere Quotidiano</strong></h4>',
        '<p>Il nostro rollator pieghevole a 4 ruote in alluminio unisce <strong>funzionalità e design ergonomico per rendere ogni spostamento più sicuro e confortevole.</strong></p>',
        '<p><strong>Curiosità:</strong>&nbsp;Studi ergonomici dimostrano che utilizzare ausili progettati per mantenere una postura corretta può ridurre significativamente l’affaticamento muscolare. Le <strong>impugnature anatomiche</strong> e la <strong>seduta regolabile</strong> non solo <strong>supportano la deambulazione</strong>, ma <strong>contribuiscono anche a migliorare la qualità della vita</strong>, trasformando ogni passo in un gesto di benessere.</p>',
        '<p>Inoltre, se sei il caregiver di una persona anziana o di una persona non autosufficiente e hai bisogno di un aiuto, il nostro <strong>infermiere</strong> di fiducia <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> è specializzato nel campo <strong>dell’assistenza domiciliare</strong>, ed è pronto ad affiancarti per portare avanti le cure dal comfort della tua abitazione.&nbsp;</p>',
        '<h4>Noleggio Deambulatore rollator pieghevole in alluminio a Roma e Firenze: I Benefici</h4>',
        '<ul><li><strong>Flessibilità e Convenienza:</strong>&nbsp;Noleggia il rollator per il periodo di cui hai realmente bisogno, evitando l’investimento di un acquisto a lungo termine.</li><li><strong>Servizio Completo:</strong>&nbsp;Il dispositivo viene fornito igienizzato, con manutenzione inclusa e pronto all’uso.</li><li><strong>Assistenza Personalizzata:</strong>&nbsp;Offriamo una consulenza dedicata e una consegna rapida, ideali per le richieste di&nbsp;<strong>noleggio rollator ultraleggero a Roma</strong>&nbsp;e <strong>Firenze</strong>.</li></ul>',
        '<p><strong><a href="/catalogo-noleggio/">Scegli tra la vasta gamma di deambulatori e Rollator Mia Medical</a></strong> e scopri <a href="/come-si-scegli-il-deambulatore-giusto/">l’articolo-guida </a>per una scelta consapevole e personalizzata in base alle tue esigenze. Non sei ancora convinto? <strong><a href="https://wa.me/393926509237">Chiamaci per ricevere una consulenza gratuita su misura per te senza impegno! </a></strong></p>',
        '<p>Sia che tu sia a&nbsp;<strong>Roma</strong>,&nbsp;<strong>Firenze</strong>&nbsp;o in altre città, il nostro servizio di <strong>noleggio rollator</strong> è studiato per offrire una <strong>consulenza personalizzata</strong>. <strong>Consegna rapida</strong>, <strong>assistenza qualificata </strong>e la certezza di un <strong>prodotto di alta qualità </strong>ti aspettano. Scegli Mia Medical: <a href="https://wa.me/393926509237">contattaci ora</a>!</p>',
        '<p>Disponibile anche per la vendita.</p>',
        '<p>Scopri la nostra pagine&nbsp;<a href="https://facebook.com/MIAMedicalitalia/">Facebook&nbsp;</a></p>',
      ].join(''),
    },
    en: {
      title: 'Rollator with a seat, for hire',
      slug: 'noleggio-deambulatore-rollatore-in-alluminio-2',
      shortDescription: 'Delivery in Rome and Florence from 30€. No deposit required. Delivery and collection from the warehouse are FREE!',
      metaTitle: 'Folding rollator hire | Rome and Florence',
      metaDescription: 'Hire a light folding rollator with brakes and a seat. Best price guaranteed — we know hire inside out.',
      description: [
        '<p><strong>Hire</strong><strong>Walker suitable for indoor and outdoor use, foldable, height adjustable in Rome and Florence.</strong></p>',
        '<p>Discover our&nbsp;<strong>4-wheel rollator with aluminium seat</strong>, the ideal aid for safe and independent walking. Designed to support people with mobility impairments, this device is perfect for everyday indoor and outdoor use and is available for rental in the areas of&nbsp;<strong>Rome</strong>&nbsp;e&nbsp;<strong>Florence</strong>.</p>',
        '<h4>Technical Features and Functionality </h4>',
        '<ul><li><strong>Robust and Lightweight Structure</strong></li><li>Made of <strong>painted aluminium</strong>It combines strength and lightness for practical and durable use.</li><li><strong>Foldable design</strong></li><li>It closes easily with a single gesture, taking up little space for transport and storage.</li><li><strong>4 EVA wheels Ø 20 cm</strong></li><li><strong>Swivelling fronts with full fork and reflector</strong> → they guarantee handling and safety.</li><li><strong>Rear fixed with dual-function brakes</strong> → allow the rollator to be braked in motion or to be locked from a standstill.</li><li><strong>Anatomically adjustable handles</strong></li><li>Comfortable and adaptable to the user\'s height, complete with <strong>reflector</strong> for greater security.</li><li><strong>Padded seat and EVA backrest</strong></li><li><strong>Seat 38×34 cm upholstered and covered in PVC</strong>ideal for a moment\'s rest while walking.</li><li><strong>Padded EVA backrest</strong>ergonomic support for maximum comfort.</li><li><strong>Basket for Objects</strong> included, perfect for carrying small personal effects.</li></ul>',
        '<p><h4><strong>Innovation and Design: An Ally for Everyday Well-being</strong></h4>',
        '<p>Our folding 4-wheel aluminium rollator combines <strong>functionality and ergonomic design to make every move safer and more comfortable.</strong></p>',
        '<p><strong>Curiosity:</strong>&nbsp;Ergonomic studies show that using aids designed to maintain correct posture can significantly reduce muscle fatigue. The <strong>anatomical handles</strong> and the <strong>adjustable seat</strong> not only <strong>support walking</strong>but <strong>also contribute to improving the quality of life</strong>turning every step into a gesture of well-being.</p>',
        '<p>Furthermore, if you are the caregiver of an elderly or dependent person and need help, our <strong>nurse</strong> trustworthy <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> specialises in the field <strong>home care</strong>and is ready to support you in taking care of the comfort of your home.&nbsp;</p>',
        '<h4>Folding aluminium rollator walker rental in Rome and Florence: The Benefits</h4>',
        '<ul><li><strong>Flexibility and Convenience:</strong>&nbsp;Rent the rollator for the period you really need it, avoiding the investment of a long-term purchase.</li><li><strong>Full service:</strong>&nbsp;The device is delivered sanitised, maintenance included and ready to use.</li><li><strong>Personalised Assistance:</strong>&nbsp;We offer dedicated consultancy and fast delivery, ideal for requests from&nbsp;<strong>ultralight rollator hire in Rome</strong>&nbsp;e <strong>Florence</strong>.</li></ul>',
        '<p><strong><a href="/en/rental-catalog/">Choose from Mia Medical\'s wide range of walkers and rollators</a></strong> and discover <a href="/en/come-si-scegli-il-deambulatore-giusto/">the guiding article </a>for an informed choice customised to your needs. Still not convinced? <strong><a href="https://wa.me/393926509237">Call us for a free consultation tailored to your needs with no obligation! </a></strong></p>',
        '<p>Whether you are at&nbsp;<strong>Rome</strong>,&nbsp;<strong>Florence</strong>&nbsp;or in other cities, our <strong>rollator hire</strong> is designed to offer a <strong>personalised consultancy</strong>. <strong>Quick delivery</strong>, <strong>qualified assistance </strong>and the certainty of a <strong>high-quality product </strong>are waiting for you. Choose Mia Medical: <a href="https://wa.me/393926509237">contact us now</a>!</p>',
        '<p>Also available for sale.</p>',
        '<p>Discover our pages&nbsp;<a href="https://facebook.com/MIAMedicalitalia/">Facebook&nbsp;</a></p>',
      ].join(''),
    },
  },

  specs: {
    'has-seat': true,
    foldable: true,
  },

  media: {
    thumbnail: 'rollator-with-seat-1.png',
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
