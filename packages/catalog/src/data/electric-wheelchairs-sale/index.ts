/**
 * Vendita carrozzine elettriche, assembled — one line per product file.
 */

import { electricWheelchairsSale } from './category.ts';
import { fantasticaPowerSmart } from './fantastica-power-smart.ts';
import { starlightUltralight } from './starlight-ultralight.ts';
import { superwheelElectricSale } from './superwheel-electric-sale.ts';
import { nuvolaCarbon } from './nuvola-carbon.ts';
import { passepartoutMagnesium } from './passepartout-magnesium.ts';

export default electricWheelchairsSale.withProducts([
  fantasticaPowerSmart,
  starlightUltralight,
  superwheelElectricSale,
  nuvolaCarbon,
  passepartoutMagnesium,
]);
