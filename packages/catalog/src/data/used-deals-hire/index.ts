/**
 * Occasione usato, assembled — with no products.
 *
 * See `category.ts`: the six items the site files here are the same six it
 * files under `usato-in-promozione`, and all six are sold rather than hired,
 * so they live in `used-deals-sale`.
 */
import { usedDealsHire } from './category.ts';

export default usedDealsHire.withProducts([]);
