/**
 * Letti ortopedici ospedalieri — product_cat 94,
 * `noleggio-letti-ortopedici-ospedalieri`, 4 products.
 *
 * Three electric beds and one combined package (walker + wheelchair + single
 * bed), which the site files here and nowhere else.
 *
 * The three beds each print a full specification block, and they distinguish
 * two load figures the rest of the catalogue never separates — the patient's
 * weight and the bed's safe working load. Both are kept; see
 * `shared/specs-bed.ts` for why.
 *
 * ⚠️ Bed 8842's `Maximum capacity` attribute carries EIGHT values at once
 * (100, 115, 120, 130, 150, 180, 200, 250 Kg). That is the shop's global
 * attribute term list showing through rather than eight capacities for one bed,
 * so the figures used are the ones the page's own prose states — 130 kg patient,
 * 180 kg safe working load. Noted in docs/catalog/README.md.
 *
 * No deposit on any of the four: every page says "Nessun deposito!".
 */
import { defineCategory } from '../../lib/define.ts';
import { loadAndWeight } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import {
  articulation,
  heightAdjustment,
  includesMattress,
  mattressSurface,
  safeWorkingLoad,
  sideRails,
} from '../shared/specs-bed.ts';

export const hospitalBedsHire = defineCategory({
  code: 'hospital-beds-hire',
  position: 6,
  translations: {
    it: {
      name: 'Letti ortopedici ospedalieri',
      slug: 'noleggio-letti-ortopedici-ospedalieri',
      description:
        'Il noleggio dei letti ortopedici ospedalieri MIA Medical Italia è un servizio professionale pensato per garantire comfort, sicurezza e supporto nella mobilità e nella degenza, sia temporanea che continuativa. I nostri letti sono certificati, sanificati e pronti all’uso, disponibili a Roma, Firenze e relative province, con consegna a domicilio rapida e assistenza completa durante tutto il periodo di noleggio.',
      metaTitle: 'Letti ortopedici ospedalieri Archives - Mia Medical Italia',
      metaDescription:
        'Noleggio letti ortopedici ospedalieri a Roma e Firenze. Letti elettrici, bariatrici e materassi antidecubito, consegna rapida, sanificazione e assistenza inclusa.',
    },
    en: {
      name: 'Orthopaedic hospital beds',
      slug: 'noleggio-letti-ortopedici-ospedalieri',
      description:
        'MIA Medical Italia hires out orthopaedic hospital beds to make a period of care at home comfortable and safe, whether it lasts weeks or indefinitely. Every bed is certified, sanitised and ready to use, available in Rome, Florence and their provinces, delivered quickly and supported for as long as it is on hire.',
      metaTitle: 'Orthopaedic hospital bed hire | Mia Medical Italia',
      metaDescription:
        'Orthopaedic hospital bed hire in Rome and Florence: electric and bariatric beds with pressure-relief mattresses, quick delivery, sanitising and support included.',
    },
  },

  specs: {
    ...loadAndWeight,
    ...safeWorkingLoad,
    ...mattressSurface,
    ...overallDimensions,
    ...heightAdjustment,
    ...articulation,
    ...sideRails,
    ...includesMattress,
  },
});
