/**
 * Kinetec — product_cat 223, `affitto-noleggio-kinetec`, 4 products.
 *
 * Continuous passive motion machines for the knee and the hip: two on their
 * own, and two paired with something else (a wheelchair, and cryotherapy). The
 * site lists both combined packages under other categories as well; they are
 * filed here because Kinetec is the first device each title names.
 *
 * The category term has NO description and NO Yoast meta description on the
 * live site — only an auto-generated archive title. Both are left as the site
 * has them: an invented category description would be exactly the kind of
 * plausible filler this migration is replacing. The English name is the site's
 * own, which is the same word.
 *
 * The Kinetec + cryotherapy package (14204) is the one product here with a real
 * specification block, and it is where `range-of-motion`, `patient-height`,
 * the timer and the dimensions come from.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer, weight } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { patientHeight, programmes, rangeOfMotion } from '../shared/specs-therapy.ts';

export const kinetecHire = defineCategory({
  code: 'kinetec-hire',
  position: 5,
  translations: {
    it: {
      name: 'Kinetec',
      slug: 'affitto-noleggio-kinetec',
      metaTitle: 'Kinetec Archives - Mia Medical Italia',
    },
    en: {
      name: 'Kinetec',
      slug: 'affitto-noleggio-kinetec',
      metaTitle: 'Kinetec hire | Mia Medical Italia',
    },
  },

  specs: {
    ...rangeOfMotion,
    ...patientHeight,
    ...treatmentTimer,
    ...programmes,
    ...overallDimensions,
    ...weight,
    ...powerSupply,
  },
});
