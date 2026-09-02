/**
 * Add-ons offered on more than one product.
 *
 * An add-on is ALWAYS optional — there is no `isRequired`, on purpose. One that
 * cannot be declined is part of the product's price, not an extra.
 *
 * A `fixed` add-on bills once and may go on any product. A `rental` one bills
 * per `rentalUnit`, and only a rental product may carry it — the type of a
 * fixed product's `addons` field is what enforces `product_addons_mode_check`.
 */
import type { FixedAddon, RentalAddon } from '../../lib/types.ts';

export const homeDelivery: FixedAddon = {
  pricingMode: 'fixed',
  name: { it: 'Consegna e ritiro a domicilio', en: 'Home delivery and collection' },
  description: { it: 'Roma e Firenze e relative province.' },
  price: '35.00',
  maxQuantity: 1,
};

export const packaging: FixedAddon = {
  pricingMode: 'fixed',
  name: { it: 'Imballaggio per spedizione', en: 'Shipping packaging' },
  price: '10.00',
  maxQuantity: 1,
};

export const pressureReliefCushion: RentalAddon = {
  pricingMode: 'rental',
  name: { it: 'Cuscino antidecubito', en: 'Pressure-relief cushion' },
  description: { it: 'Memory foam, sfoderabile.' },
  price: '1.50',
  rentalUnit: 'day',
  maxQuantity: 1,
};
