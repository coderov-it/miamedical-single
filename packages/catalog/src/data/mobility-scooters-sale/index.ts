/**
 * Vendita Scooter Elettrici, assembled — one line per product file.
 */

import { mobilityScootersSale } from './category.ts';
import { kuarzScooter } from './kuarz-scooter.ts';
import { foldingScooterS19Sale } from './folding-scooter-s19-sale.ts';
import { deluxeFoldingScooterSale } from './deluxe-folding-scooter-sale.ts';
import { oneScooterSale } from './one-scooter-sale.ts';
import { maximoScooterSale } from './maximo-scooter-sale.ts';

export default mobilityScootersSale.withProducts([
  kuarzScooter,
  foldingScooterS19Sale,
  deluxeFoldingScooterSale,
  oneScooterSale,
  maximoScooterSale,
]);
