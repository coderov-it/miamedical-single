/**
 * Which words a product page says about delivery, hygiene and terms — chosen by
 * the product's pricing mode, because a purchase is never collected again and a
 * new device is not "sanitised" (PUB-015):
 *
 *   mode 'rental' → includes  delivery · collection at the end · assembly · phone
 *                   hygiene   sanitised · checked · accessories
 *   mode 'fixed'  → includes  delivery · assembly · phone
 *                   hygiene   CE-certified · checked · accessories
 *
 * Keys only — the caller translates. Any mode that is not 'rental' is a sale.
 */
export interface ProductModeCopy {
  tab: string;
  includedHeading: string;
  includes: readonly string[];
  hygieneHeading: string;
  hygiene: readonly string[];
  termsIntro: string;
}

const RENTAL: ProductModeCopy = {
  tab: 'pdp.tab.delivery',
  includedHeading: 'pdp.includedRental',
  includes: [
    'pdp.includes.delivery',
    'pdp.includes.collection',
    'pdp.includes.assembly',
    'pdp.includes.phone',
  ],
  hygieneHeading: 'pdp.hygieneHeading',
  hygiene: ['pdp.hygiene.sanitised', 'pdp.hygiene.checked', 'pdp.hygiene.accessories'],
  termsIntro: 'pdp.termsIntro',
};

const SALE: ProductModeCopy = {
  tab: 'pdp.tab.deliverySale',
  includedHeading: 'pdp.includedSale',
  includes: ['pdp.includes.delivery', 'pdp.includes.assembly', 'pdp.includes.phone'],
  hygieneHeading: 'pdp.hygieneHeadingSale',
  hygiene: ['pdp.hygiene.certified', 'pdp.hygiene.checked', 'pdp.hygiene.accessories'],
  termsIntro: 'pdp.termsIntroSale',
};

export function productModeCopy(mode: string): ProductModeCopy {
  if (mode === 'rental') return RENTAL;
  return SALE;
}
