/**
 * The extras the live catalogue actually offers, and their real prices.
 *
 * An add-on is ALWAYS optional — there is no `isRequired`, on purpose. One that
 * cannot be declined is part of the product's price, not an extra. Delivery
 * qualifies: every product page pairs a delivery charge with "il ritiro in
 * magazzino è gratuito", so the customer can always decline it and collect.
 *
 * `homeDelivery` is a function rather than a constant because the charge is not
 * one number across the catalogue — it is 30 € on the chairs, 35 € on the
 * electric seggiolone and 40 € on the manual one, and each page states its own.
 * Passing the price at the call site keeps the figure next to the product it
 * was read from.
 *
 * A `fixed` add-on bills once and may go on any product. A `rental` one bills
 * per `rentalUnit`, and only a rental product may carry it — the type of a
 * fixed product's `addons` field is what enforces `product_addons_mode_check`.
 */
import type { Amount, FixedAddon } from '../../lib/types.ts';

/**
 * "Consegna e ritiro a domicilio a Roma e Firenze da 30€." One charge covering
 * both legs, which is how the chairs, the ramps and the seggioloni word it.
 */
export const homeDelivery = (price: Amount): FixedAddon => ({
  pricingMode: 'fixed',
  name: {
    it: 'Consegna e ritiro a domicilio',
    en: 'Home delivery and collection',
  },
  description: {
    it: 'Roma e Firenze e relative province. Il ritiro in magazzino è gratuito.',
    en: 'Rome and Florence and their provinces. Collection at the warehouse is free.',
  },
  price,
  maxQuantity: 1,
});

/**
 * The electric chairs price the two legs separately — "Consegna a domicilio:
 * 30€ + 30€ per il ritiro" — so they take this pair instead of `homeDelivery`.
 */
export const homeDeliveryOnly = (price: Amount): FixedAddon => ({
  pricingMode: 'fixed',
  name: { it: 'Consegna a domicilio', en: 'Home delivery' },
  description: { it: 'Roma e Firenze.', en: 'Rome and Florence.' },
  price,
  maxQuantity: 1,
});

export const homeCollection = (price: Amount): FixedAddon => ({
  pricingMode: 'fixed',
  name: { it: 'Ritiro a domicilio', en: 'Collection from home' },
  description: { it: 'Roma e Firenze.', en: 'Rome and Florence.' },
  price,
  maxQuantity: 1,
});

/**
 * Priced at zero because the catalogue says so in as many words — "Alzata gamba
 * gratuita: se il paziente ha un gesso o deve tenere la gamba sollevata, basta
 * comunicarcelo", and on the self-propelled folding chair "Il noleggio
 * dell'alzata è GRATUITO!". It is an add-on and not a spec because the customer
 * has to ask for it.
 */
export const legRaiser: FixedAddon = {
  pricingMode: 'fixed',
  name: { it: 'Alzagambe', en: 'Leg raiser' },
  description: {
    it: 'Gratuito, per chi ha un gesso o deve tenere la gamba sollevata.',
    en: 'Free of charge, for a leg in plaster or one that has to stay raised.',
  },
  price: 0,
  maxQuantity: 1,
};

/**
 * The electrode packs the two TENS products sell alongside the hire.
 *
 * On the live site these are not add-ons at all: WooCommerce carries them as a
 * SECOND variation axis ("Acquista gli elettrodi"), which makes choosing one
 * compulsory — a 10-day hire of product 9455 is listed at 110 € and charges
 * 118 € or 123 € depending on which pack is picked. The packages here hold the
 * hire price the label states, and these two carry the difference, so the total
 * a customer pays matches the site exactly.
 *
 * They are add-ons and not part of the price because the shop words them as a
 * purchase — "Ricordati di acquistare anche gli elettrodi" — and because the
 * two are alternatives at different prices, which no single price can hold.
 * That the site makes the choice compulsory is recorded in
 * docs/catalog/README.md.
 */
export const electrodes = (size: string, price: Amount): FixedAddon => ({
  pricingMode: 'fixed',
  name: {
    it: `Elettrodi, conf. 4 pz ${size}`,
    en: `Electrodes, pack of 4, ${size}`,
  },
  description: {
    it: 'Necessari per usare l’elettrostimolatore.',
    en: 'Needed to use the stimulator.',
  },
  price,
  maxQuantity: 1,
});
