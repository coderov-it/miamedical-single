/**
 * Vendita carrozzina pieghevole ad autospinta
 *
 * /prodotto/vendita-carrozzina-pieghevole-ad-autospinta/
 * WooCommerce product 15841, 280,00 €. Three seat sizes on this page — 40, 45 and
 * 50 cm — and a weight that follows the size, "da circa 14 kg" to "fino a circa
 * 18 kg".
 */

import { generalTerms } from '../shared/terms.ts';
import { wheelchairsSale } from './category.ts';

export const selfPropelledFoldingSale = wheelchairsSale.fixed({
  code: 'self-propelled-folding-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 280,

  translations: {
    it: {
      title: 'Vendita carrozzina pieghevole ad autospinta',
      slug: 'vendita-carrozzina-pieghevole-ad-autospinta',
      shortDescription: 'Sedia a rotelle ad autospinta Comoda e leggera, facile da caricare in macchina. Carrozzina con seduta e telaio pieghevole per massima praticità. Consegna gratuita in tutta Italia',
      metaTitle: 'Carrozzina Pieghevole ad Autospinta in vendita | Fino a 130kg',
      metaDescription: 'Acquista la carrozzina pieghevole ad autospinta con portata fino a 130 kg, ruote grandi e struttura leggera. Ideale per anziani e disabili.',
      description: [
        '<p>La carrozzina pieghevole ad autospinta è la soluzione ideale per persone anziane, disabili o con ridotta capacità di deambulazione che necessitano di un ausilio pratico, sicuro e confortevole per gli spostamenti quotidiani.</p>',
        '<p>Grazie alle grandi ruote posteriori, l’utilizzatore può muoversi in autonomia senza la necessità di un accompagnatore. La struttura è leggera ma estremamente robusta, progettata per garantire affidabilità e durata nel tempo.</p>',
        '<h2>Caratteristiche principali</h2>',
        '<p>Questa carrozzina pieghevole ad autospinta è progettata per garantire autonomia e comfort nell’utilizzo quotidiano.</p>',
        '<ul><li>Carrozzina ad autospinta con grandi ruote posteriori</li><li>Struttura pieghevole per ridurre l’ingombro</li><li>Pedane poggiapiedi removibili</li><li>Braccioli estraibili facilmente</li><li>Due freni manuali per il bloccaggio delle ruote</li><li>Telaio resistente e leggero</li><li>Disponibile con sedute da 40 cm a 50 cm</li><li>Portata massima fino a 130 kg</li></ul>',
        '<h2>Comfort e praticità</h2>',
        '<p>La carrozzina pieghevole ad autospinta è progettata per offrire il massimo comfort durante l’utilizzo quotidiano. La chiusura rapida consente di trasportarla facilmente in automobile e di riporla senza occupare troppo spazio.</p>',
        '<p>Le pedane e i braccioli removibili facilitano i trasferimenti e permettono di adattare la carrozzina alle diverse esigenze dell’utilizzatore.</p>',
        '<p>Per chi trascorre molte ore seduto, è possibile abbinare un cuscino antidecubito per migliorare il comfort e ridurre i punti di pressione.</p>',
        '<h2>Dimensioni e peso</h2>',
        '<p>La <strong>carrozzina pieghevole ad autospinta</strong> è disponibile in diverse configurazioni di seduta:</p>',
        '<ul><li>Seduta da 40 cm</li><li>Seduta da 45 cm</li><li>Seduta da 50 cm</li></ul>',
        '<p>Il peso varia in base alla configurazione scelta:</p>',
        '<ul><li>Da circa 14 kg per le versioni più compatte</li><li>Fino a circa 18 kg per le versioni con seduta più ampia</li></ul>',
        '<h2>Perché scegliere una carrozzina ad autospinta?</h2>',
        '<p>A differenza delle <strong><a href="/prodotto/noleggio-carrozzina-pieghevole-da-transito/">carrozzine da transito</a></strong>, la carrozzina ad autospinta è dotata di ruote posteriori di grande diametro che consentono all’utilizzatore di muoversi in completa autonomia. Questa caratteristica la rende particolarmente indicata per chi desidera mantenere indipendenza e libertà di movimento sia in casa che all&#8217;esterno.</p>',
        '<h2>Acquista la tua carrozzina pieghevole ad autospinta</h2>',
        '<p>La carrozzina pieghevole ad autospinta rappresenta una soluzione affidabile, resistente e facile da utilizzare. Grazie alla struttura richiudibile, al peso contenuto e alla portata fino a 130 kg, è uno degli ausili più apprezzati per la mobilità quotidiana.</p>',
        '<p>Contattaci per ricevere maggiori informazioni o per scegliere la misura più adatta alle tue esigenze: <br />telefonicamente / via WhatsApp al <strong>+393926509237 </strong>o tramite email: <strong>amministrazione@miamedicalitalia.it</strong></p>',
        '<p><a href="https://www.facebook.com/MIAMedicalitalia/"><em>Clicca qui e copri la nostra pagina FACEBOOK</em></a></p>',
      ].join(''),
    },
    en: {
      title: 'Folding self-propelled wheelchair for sale',
      slug: 'vendita-carrozzina-pieghevole-ad-autospinta',
      shortDescription: 'Self-propelled wheelchair Comfortable and light, easy to load in the car. Wheelchair with folding seat and frame for maximum convenience. Delivery free of charge throughout Italy',
      metaTitle: 'Folding self-propelled wheelchair for sale | Up to 130 kg',
      metaDescription: 'Buy a folding self-propelled wheelchair rated to 130 kg: large rear wheels, seats of 40, 45 or 50 cm, removable armrests and footrests.',
      description: [
        '<p>The self-propelled foldable wheelchair is the ideal solution for elderly people, disabled individuals or those with reduced mobility who require a practical, safe and comfortable aid for daily journeys.</p>',
        '<p>Thanks to the large rear wheels, the user can move around independently without the need of an attendant. The frame is lightweight yet extremely robust, designed to guarantee reliability and durability over time.</p>',
        '<h2>Main features</h2>',
        '<p>This self-propelled folding wheelchair is designed to guarantee independence and comfort for daily use.</p>',
        '<ul><li>Self-propelled wheelchair with large rear wheels</li><li>Foldable structure to reduce space requirement</li><li>Removable foot pegs</li><li>Removable armrests</li><li>Two handbrakes for wheel locking</li><li>Strong and lightweight frame</li><li>Available with seat heights ranging from 40 cm to 50 cm</li><li>Maximum load up to 130 kg</li></ul>',
        '<h2>Comfort and practicality</h2>',
        '<p>The self-propelled foldable wheelchair is designed to offer maximum comfort during daily use. The quick-folding mechanism makes it easy to transport in a car and store without taking up too much space.</p>',
        '<p>The removable footrests and armrests facilitate transfers and allow the wheelchair to be adapted to the different needs of the user.</p>',
        '<p>For those who spend many hours sitting, it is possible to combine an anti-decubitus cushion to improve comfort and reduce pressure points.</p>',
        '<h2>Dimensions and weight</h2>',
        '<p>La <strong>folding self-propelled wheelchair</strong> it is available in various seating configurations:</p>',
        '<ul><li>40 cm seat</li><li>45 cm seat</li><li>50 cm seat</li></ul>',
        '<p>The weight varies depending on the chosen configuration:</p>',
        '<ul><li>From around 14 kg for the more compact versions</li><li>Up to about 18 kg for the versions with a wider seat</li></ul>',
        '<h2>Why choose a self-propelled wheelchair?</h2>',
        '<p>Unlike the <strong><a href="/en/product/noleggio-carrozzina-pieghevole-da-transito/">Transit wheelchairs</a></strong>, the self-propelled wheelchair is equipped with large-diameter rear wheels that allow the user to move around in complete autonomy. This feature makes it particularly suitable for those who wish to maintain independence and freedom of movement both indoors and outdoors.</p>',
        '<h2>Buy your folding self-propelled wheelchair</h2>',
        '<p>The self-propelled foldable wheelchair is a reliable, durable and easy-to-use solution. Thanks to its foldable frame, low weight and a load capacity of up to 130 kg, it is one of the most popular aids for daily mobility.</p>',
        '<p>Contact us for further information or to choose the size that best suits your needs: <br />by telephone / via WhatsApp at <strong>+393926509237 </strong>or by email: <strong>amministrazione@miamedicalitalia.it</strong></p>',
        '<p><a href="https://www.facebook.com/MIAMedicalitalia/"><em>Click here and cover our FACEBOOK page</em></a></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'self-propelled',
    'max-load': 130,
    weight: { min: 14, max: 18 },
    'seat-width': { min: 40, max: 50 },
    foldable: true,
    'removable-armrests': true,
    'removable-footrests': true,
    brakes: 'parking',
  },

  media: {
    thumbnail: { file: 'self-propelled-folding-1.jpg', alt: { it: 'Affitto carrozzina pieghevole ad autospinta' } },
    gallery: [
      'self-propelled-folding-2.jpg',
    ],
  },
  terms: [generalTerms],
});
