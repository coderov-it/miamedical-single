/**
 * Carrozzine elettriche e scooter, assembled — one line per product file.
 */

import { electricWheelchairsAndScootersHire } from './category.ts';
import { foldingScooterS19 } from './folding-scooter-s19.ts';
import { maximoScooter } from './maximo-scooter.ts';
import { deluxeFoldingScooter } from './deluxe-folding-scooter.ts';
import { oneScooter } from './one-scooter.ts';
import { superwheelElectric } from './superwheel-electric.ts';
import { fantasticaElectric } from './fantastica-electric.ts';

export default electricWheelchairsAndScootersHire.withProducts([
  foldingScooterS19,
  maximoScooter,
  deluxeFoldingScooter,
  oneScooter,
  superwheelElectric,
  fantasticaElectric,
]);
