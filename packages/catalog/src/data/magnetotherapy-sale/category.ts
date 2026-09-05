/**
 * Vendita Magnetoterapia — product_cat 541, `vendita-magnetoterapia`,
 * 2 products.
 *
 * The Magnum 2500 and the Therapist® 150 Plus, the two CEMP devices the shop
 * both hires and sells. Their pages state what is in the box and nothing
 * numeric, so the spec set matches the hire category's.
 *
 * ⚠️ The category's own description reads "Acquista subito i dispositivi a
 * partire da € 1.490" while the two products are priced at 499,00 € and
 * 650,00 €. The category copy is carried as written; the mismatch is in
 * docs/catalog/README.md.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer } from '../shared/specs.ts';
import { includedAccessories, programmes } from '../shared/specs-therapy.ts';

export const magnetotherapySale = defineCategory({
  code: 'magnetotherapy-sale',
  position: 24,
  translations: {
    it: {
      name: 'Vendita Magnetoterapia',
      slug: 'vendita-magnetoterapia',
      description:
        'Vendita Magnetoterapia CEMP professionale. Acquista subito i dispositivi a partire da € 1.490.',
      metaTitle: 'Vendita Magnetoterapia Professionale | Mia Medical Italia',
      metaDescription:
        'Acquista dispositivi di magnetoterapia professionale MAGNUM 2500 e THERAPIST® 150 Plus. Spedizione rapida in tutta Italia e assistenza dedicata.',
    },
    en: {
      name: 'Magnetotherapy for sale',
      slug: 'vendita-magnetoterapia',
      description:
        'Professional PEMF magnetotherapy devices for sale, from €1,490.',
      metaTitle: 'Professional magnetotherapy for sale | Mia Medical Italia',
      metaDescription:
        'Buy the MAGNUM 2500 and THERAPIST® 150 Plus professional magnetotherapy devices. Fast shipping across Italy and dedicated support.',
    },
  },

  specs: { ...includedAccessories, ...programmes, ...treatmentTimer, ...powerSupply },
});
