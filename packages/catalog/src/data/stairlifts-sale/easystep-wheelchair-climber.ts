/**
 * Vendita Montascale per carrozzina Easystep
 *
 * /prodotto/vendita-montascale-per-carrozzine-easystep/
 * WooCommerce product 15569, 1.843,00 €.
 *
 * Three facts on the page: the smallest wheelchair seat it takes is 44 cm, a
 * rating of 200 kg, and "per pesi superiori ai 100 kg consigliamo due
 * operatori" — a staffing caution, not a load limit, so that one stays in the
 * copy rather than becoming a spec.
 *
 * ⚠️ The 200 kg here is the page's own figure. Its HIRE twin (15557) states
 * 160 kg and calls it "una delle più alte della categoria". Each product
 * carries what its own page says; the disagreement is in
 * docs/catalog/README.md.
 */

import { generalTerms } from '../shared/terms.ts';
import { stairliftsSale } from './category.ts';

export const easystepWheelchairClimber = stairliftsSale.fixed({
  code: 'easystep-wheelchair-climber',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 1843,

  translations: {
    it: {
      title: 'Vendita Montascale per carrozzina Easystep',
      slug: 'vendita-montascale-per-carrozzine-easystep',
      shortDescription: 'Vendita Montascale per Carrozzine EasyStep. Seduta minima della carrozzina: 44cm. Adatto sia a carrozzine con ruote grandi che con ruote piccole. EasyStep è un montascale mobile motorizzato a cingoli per carrozzine, ideale per abitazioni private, condomini, strutture sanitarie e edifici pubblici. Non richiede installazione né lavori murari ed è pronto all’uso fin da subito. Portata fino a 200 kg.',
      metaTitle: 'Vendita Montascale per Carrozzina EasyStep',
      metaDescription: 'Acquista il Montascale EasyStep per carrozzine: sicurezza, autonomia e zero sforzo per salire e scendere scale. Consegna a domicilio.',
      description: [
        '<h2>Supera le scale senza sforzo con EasyStep – Montascale Mobile Universale in vendita</h2>',
        '<p>Non lasciare che le scale limitino la tua autonomia. Con la <strong>vendita montascale per carrozzine EasyStep</strong> di M.I.A. Medical Italia puoi salire e scendere scale in totale sicurezza, senza sforzo fisico e senza continui trasferimenti dalla tua carrozzina.</p>',
        '<h2>Perché scegliere EasyStep</h2>',
        '<ul><li><strong>Sistema motorizzato a cingoli</strong>: stabile e sicuro anche su scale ripide.</li><li><strong>Compatibile con la maggior parte delle carrozzine manuali</strong> grazie alla piattaforma regolabile.</li><li><strong>Portata fino a 200 kg</strong>: ideale anche per trasporto merci o carichi pesanti.</li><li><strong>Facile da usare</strong>: basta posizionare la carrozzina, agganciarla e premere il pulsante per salire o scendere.</li><li><strong>Sicurezza garantita</strong>: freni elettromagnetici e cingoli ad alta aderenza.</li></ul>',
        '<h2>Chi può beneficiare di EasyStep</h2>',
        '<ul><li>Utenti in carrozzina che vogliono muoversi senza continui trasferimenti.</li><li>Famiglie che desiderano rendere la casa completamente accessibile.</li><li>Condomini, scuole, hotel, musei o strutture pubbliche che vogliono abbattere le barriere architettoniche senza lavori strutturali.</li></ul>',
        '<h2>Acquisto facile e conveniente</h2>',
        '<ul><li>Consegna rapida a Roma e Firenze.</li><li>Formazione pratica inclusa: un nostro tecnico ti mostrerà come usare il dispositivo in sicurezza.</li><li>Assistenza e manutenzione garantite.</li><li>Investimento unico per la tua autonomia: senza noleggi continui e con un prodotto pronto all’uso.</li></ul>',
        '<p><strong>Nota:</strong> per pesi superiori ai 100 kg consigliamo due operatori.</p>',
        '<p><strong>Contattaci subito</strong></p>',
        '<p>Non lasciare che le scale siano un ostacolo. Acquista il tuo EasyStep oggi stesso!</p>',
        '<ul><li>Telefono: +39 392 65 09 237</li><li>WhatsApp: Scrivici subito</li><li>Email: info@miamedicalitalia.it</li></ul>',
        '<p>Scopri anche il nostro servizio di <strong><a href="/catalogo-noleggio/">noleggio montascale per carrozzine</a></strong></p>',
        '<p><strong>Affronta le barriere architettoniche con EasyStep: sicurezza, autonomia e zero sforzo.</strong></p>',
      ].join(''),
    },
    en: {
      title: 'Easystep wheelchair stair climber, for sale',
      slug: 'vendita-montascale-per-carrozzine-easystep',
      shortDescription: 'EasyStep wheelchair stair climber for sale. Smallest wheelchair seat it takes: 44 cm. Suits wheelchairs with large wheels and small ones alike. EasyStep is a motorised mobile tracked stair climber for wheelchairs, made for private homes, blocks of flats, care settings and public buildings. It needs no installation and no building work, and it is ready to use straight away. Rated to 200 kg.',
      metaTitle: 'EasyStep wheelchair stair climber for sale',
      metaDescription: 'Buy the EasyStep wheelchair stair climber: safe, independent, effortless stairs. Delivered to your door.',
      description: [
        '<h2>Glide up the stairs effortlessly with EasyStep – Universal Mobile Stairlift for sale</h2>',
        '<p>Don\'t let the stairs limit your autonomy. With the <strong>EasyStep wheelchair lift for sale</strong> of M.I.A. Medical Italia you can ascend and descend stairs in total safety, without physical effort and without constant transferring from your wheelchair.</p>',
        '<h2>Why choose EasyStep</h2>',
        '<ul><li><strong>Motorised track system</strong>stable and safe even on steep stairs.</li><li><strong>Compatible with most manual wheelchairs</strong> thanks to the adjustable platform.</li><li><strong>Load capacity up to 200 kg</strong>also ideal for transporting goods or heavy loads.</li><li><strong>Easy to use</strong>Simply position the wheelchair, dock it and press the button to get in or out.</li><li><strong>Guaranteed security</strong>electromagnetic brakes and high-grip tracks.</li></ul>',
        '<h2>Who can benefit from EasyStep</h2>',
        '<ul><li>Wheelchair users who want to get around without constant transfers.</li><li>Families wishing to make their homes fully accessible.</li><li>Condominiums, schools, hotels, museums or public facilities that want to remove architectural barriers without structural work.</li></ul>',
        '<h2>Easy and convenient purchasing</h2>',
        '<ul><li>Quick delivery to Rome and Florence.</li><li>Practical training included: one of our technicians will show you how to use the device safely.</li><li>Guaranteed service and maintenance.</li><li>A one-off investment for your independence: no ongoing rentals and a ready-to-use product.</li></ul>',
        '<p><strong>Note:</strong> for weights above 100 kg we recommend two operators.</p>',
        '<p><strong>Contact us now</strong></p>',
        '<p>Don\'t let the stairs be an obstacle. Buy your EasyStep today!</p>',
        '<ul><li>Telephone: +39 392 65 09 237</li><li>WhatsApp: Write to us now</li><li>Email: info@miamedicalitalia.it</li></ul>',
        '<p>Also discover our <strong><a href="/en/rental-catalog/">rental of wheelchair lifts</a></strong></p>',
        '<p><strong>Tackle architectural barriers with EasyStep: safety, autonomy and zero effort.</strong></p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 200,
    'seat-width': { min: 44, max: 44 },
  },

  media: {
    thumbnail: 'easystep-wheelchair-climber-1.png',
    gallery: [
      'easystep-wheelchair-climber-2.png',
      'easystep-wheelchair-climber-3.png',
      'easystep-wheelchair-climber-4.png',
    ],
  },
  terms: [generalTerms],
});
