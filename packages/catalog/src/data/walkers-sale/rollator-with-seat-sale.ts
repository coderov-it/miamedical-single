/**
 * Vendita deambulatore rollatore con seduta
 *
 * /prodotto/deambulatore-rollatore-con-seduta-in-vendita/
 * WooCommerce product 14642, 149,00 €. Two figures on the page — "solo 8,4 kg"
 * and "fino a 136 kg" — plus the seat its title promises.
 */

import { generalTerms } from '../shared/terms.ts';
import { walkersSale } from './category.ts';

export const rollatorWithSeatSale = walkersSale.fixed({
  code: 'rollator-with-seat-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 149,

  translations: {
    it: {
      title: 'Vendita deambulatore rollatore con seduta',
      slug: 'deambulatore-rollatore-con-seduta-in-vendita',
      shortDescription: 'Consegna Gratuita Ausilio ideale per garantire sicurezza e autonomia nella deambulazione! Acquistalo ora!',
      metaTitle: 'Deambulatore rollatore con seduta in vendita',
      metaDescription: 'Acquista il tuo deambulatore rollator pieghevole in alluminio: leggero, sicuro e con seduta regolabile. Consegna gratuita. Scopri ora Mia Medical!',
      description: [
        '<h3>Deambulatore Rollator Pieghevole in Alluminio</h3>',
        '<p>Scopri il nostro <strong>rollator 4 ruote con seduta in alluminio</strong>, l’ausilio ideale per garantire sicurezza e autonomia nella deambulazione. Progettato per supportare le persone con difficoltà motorie, questo dispositivo è perfetto per l’uso quotidiano in ambienti interni ed esterni ed è disponibile per l’acquisto con <strong>consegna gratuita in tutta Italia</strong>. </p>',
        '<h3>Caratteristiche Tecniche e Funzionalità</h3>',
        '<p><strong>Struttura Robusta e Leggera:</strong><br />Realizzato in tubo di alluminio verniciato, questo deambulatore combina resistenza e leggerezza per garantire una lunga durata senza appesantire il paziente. </p>',
        '<p><strong>Design Pieghevole e Smontabile:</strong><br />Facilita il trasporto e lo stoccaggio, rendendolo perfetto anche per spazi ridotti.</p>',
        '<p><strong>4 Ruote da Ø 20 cm:</strong></p>',
        '<ul><li><strong>Frontali Piroettanti:</strong> Dotate di forca completa e catarifrangente per una maggiore visibilità e manovrabilità.</li><li><strong>Posteriori Fisse con Freni a Doppia Funzione:</strong> Assicurano stabilità e sicurezza in ogni situazione.</li></ul>',
        '<p><strong>Impugnature Anatomiche Regolabili in Altezza:</strong><br />Offrono il massimo comfort, adattandosi alle esigenze individuali e garantendo una presa sicura, complete di catarifrangente per maggiore sicurezza.</p>',
        '<p><strong>Design Ultraleggero:</strong> solo 8,4 kg<br /><strong>Portata Massima:</strong> fino a 136 kg</p>',
        '<p><strong>Accessori Integrati:</strong></p>',
        '<ul><li><strong>Seduta Inclusa regolabile in altezza:</strong> con rivestimento morbido asportabile, ideale per una pausa durante la deambulazione.</li><li><strong>Cestino in tessuto:</strong> per il trasporto di piccoli oggetti.</li></ul>',
        '<h3>Innovazione e Design: Un Alleato per il Benessere Quotidiano</h3>',
        '<p>Il nostro <strong>rollator pieghevole a 4 ruote in alluminio</strong> unisce funzionalità e design ergonomico per rendere ogni spostamento più sicuro e confortevole.</p>',
        '<p><strong>Curiosità:</strong> studi ergonomici dimostrano che utilizzare ausili progettati per mantenere una postura corretta può ridurre significativamente l’affaticamento muscolare. Le impugnature anatomiche e la seduta regolabile supportano la deambulazione e contribuiscono a migliorare la qualità della vita, trasformando ogni passo in un gesto di benessere.</p>',
        '<p>Inoltre, se sei il caregiver di una persona anziana o di una persona non autosufficiente e hai bisogno di un aiuto, il nostro&nbsp;<strong>infermiere</strong>&nbsp;di fiducia&nbsp;<strong><a href="http://www.arnaldiandrea.com/">Andrea Arnaldi</a></strong>&nbsp;è specializzato nel campo&nbsp;<strong>dell’assistenza domiciliare</strong>, ed è pronto ad affiancarti per portare avanti le cure dal comfort della tua abitazione.&nbsp;</p>',
        '<h3>Acquista il tuo Rollator Pieghevole in tutta Italia: I Benefici</h3>',
        '<ul><li><strong>Autonomia e Sicurezza:</strong> Possedere il tuo rollator significa avere sempre a disposizione un ausilio affidabile, pronto all’uso.</li><li><strong>Comodità e Praticità:</strong> Facile da trasportare, piegare e riporre, ideale sia per la casa che per gli spostamenti all’aperto.</li><li><strong>Supporto e Assistenza:</strong> Offriamo consulenza dedicata e assistenza post-vendita, per garantirti la massima tranquillità nell’acquisto.</li></ul>',
        '<p><strong><a href="/catalogo-noleggio/">Scegli tra la vasta gamma di deambulatori e Rollator Mia Medical</a></strong>&nbsp;e scopri&nbsp;<a href="/come-si-scegli-il-deambulatore-giusto/">l’articolo-guida</a>per una scelta consapevole e personalizzata in base alle tue esigenze. Non sei ancora convinto?&nbsp;<strong><a href="https://wa.me/393926509237">Chiamaci per ricevere una consulenza gratuita su misura per te senza impegno!</a></strong></p>',
      ].join(''),
    },
    en: {
      title: 'Rollator with a seat, for sale',
      slug: 'deambulatore-rollatore-con-seduta-in-vendita',
      shortDescription: 'Free delivery. The aid to make walking safe and independent again — buy it now!',
      metaTitle: 'Rollator with a seat for sale',
      metaDescription: 'Buy a folding aluminium rollator: light, safe, with an adjustable seat. Free delivery from Mia Medical.',
      description: [
        '<h3>Aluminium Folding Rollator Walker</h3>',
        '<p>Discover our <strong>4-wheel rollator with aluminium seat</strong>, the ideal aid for safe and independent walking. Designed to support people with mobility impairments, this device is perfect for everyday indoor and outdoor use and is available for purchase with <strong>free delivery throughout Italy</strong>. </p>',
        '<h3>Technical Features and Functionality</h3>',
        '<p><strong>Robust and Lightweight Structure:</strong><br />Made of painted aluminium tubing, this walker combines strength and lightness to ensure durability without weighing the patient down. </p>',
        '<p><strong>Foldable and Demountable Design:</strong><br />It facilitates transport and storage, making it perfect even for small spaces.</p>',
        '<p><strong>4 Ø 20 cm wheels:</strong></p>',
        '<ul><li><strong>Pivoting fronts:</strong> Equipped with full fork and reflectors for increased visibility and manoeuvrability.</li><li><strong>Rear Fixed with Dual Function Brakes:</strong> They ensure stability and safety in every situation.</li></ul>',
        '<p><strong>Height-adjustable anatomic handles:</strong><br />They offer maximum comfort, adapting to individual needs and ensuring a secure grip, complete with reflector for added safety.</p>',
        '<p><strong>Ultralight design:</strong> only 8.4 kg<br /><strong>Maximum capacity:</strong> up to 136 kg</p>',
        '<p><strong>Integrated Accessories:</strong></p>',
        '<ul><li><strong>Height-adjustable seat included:</strong> with removable soft cover, ideal for a break while walking.</li><li><strong>Fabric basket:</strong> for transporting small objects.</li></ul>',
        '<h3>Innovation and Design: An Ally for Everyday Well-being</h3>',
        '<p>Our <strong>4-wheel folding rollator in aluminium</strong> combines functionality and ergonomic design to make every move safer and more comfortable.</p>',
        '<p><strong>Curiosity:</strong> Ergonomic studies show that using aids designed to maintain correct posture can significantly reduce muscle fatigue. The anatomically shaped handles and adjustable seat support walking and help improve quality of life, turning every step into a gesture of well-being.</p>',
        '<p>Furthermore, if you are the caregiver of an elderly or dependent person and need help, our&nbsp;<strong>nurse</strong>&nbsp;trustworthy&nbsp;<strong><a href="http://www.arnaldiandrea.com/">Andrea Arnaldi</a></strong>&nbsp;specialises in the field&nbsp;<strong>home care</strong>and is ready to support you in taking care of the comfort of your home.&nbsp;</p>',
        '<h3>Buy your Folding Rollator throughout Italy: The Benefits</h3>',
        '<ul><li><strong>Autonomy and Security:</strong> Owning your own rollator means always having a reliable, ready-to-use aid.</li><li><strong>Comfort and Practicality:</strong> Easy to transport, fold and store, ideal for both home and outdoor use.</li><li><strong>Support and Assistance:</strong> We offer dedicated advice and after-sales support to give you peace of mind when purchasing.</li></ul>',
        '<p><strong><a href="/en/rental-catalog/">Choose from Mia Medical\'s wide range of walkers and rollators</a></strong>&nbsp;and discover&nbsp;<a href="/en/come-si-scegli-il-deambulatore-giusto/">the guiding article</a>for an informed choice customised to your needs. Still not convinced?&nbsp;<strong><a href="https://wa.me/393926509237">Call us for a free consultation tailored to your needs with no obligation!</a></strong></p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 136,
    weight: { min: 8.4, max: 8.4 },
    'has-seat': true,
    'frame-material': 'aluminium',
    foldable: true,
  },

  media: {
    thumbnail: 'rollator-with-seat-1.png',
  },
  terms: [generalTerms],
});
