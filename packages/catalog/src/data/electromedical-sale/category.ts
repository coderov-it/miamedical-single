/**
 * Vendita elettromedicali — product_cat 273, `vendita-elettromedicali`, and
 * EMPTY on the live site too.
 *
 * The site's own product count for this term is 0. It is a container the shop
 * created and never filled — the electromedical devices it would hold are all
 * filed under their own categories (Vendita Magnetoterapia, Vendita
 * Crioterapia, Vendita Ultrasuono, Vendita TENS/Elettrostimolatore).
 *
 * It is carried so the taxonomy matches the site one term for one term, and
 * because its URL is indexed. Nothing is invented to fill it.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, warranty } from '../shared/specs.ts';

export const electromedicalSale = defineCategory({
  code: 'electromedical-sale',
  position: 21,
  translations: {
    it: {
      name: 'Vendita elettromedicali',
      slug: 'vendita-elettromedicali',
      metaTitle: 'Vendita elettromedicali Archives - Mia Medical Italia',
    },
    en: {
      name: 'Electromedical equipment for sale',
      slug: 'vendita-elettromedicali',
      metaTitle: 'Electromedical equipment for sale | Mia Medical Italia',
    },
  },

  specs: { ...powerSupply, ...warranty },
});
