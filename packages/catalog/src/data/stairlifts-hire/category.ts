/**
 * Montascale — product_cat 227, `affitto-noleggio-montascale`, 5 products.
 *
 * Three tracked or wheeled stair climbers, a wheelchair stair climber, and the
 * short ramp — which the site lists under both Carrozzine and Montascale, and
 * which is filed HERE because the site's own Yoast primary term for it is
 * Montascale. Its long twin (8988) went the other way for exactly the same
 * reason. Both choices are the site's, not ours: see
 * docs/catalog/source/placement.json.
 *
 * ⚠️ Three of the five products (8999, 9707, 12152) are priced identically and
 * described almost identically. They are three different machines — a motorised
 * chair, a tracked T09 and a wheeled T10 — and the pages say so, but only the T10
 * states a load limit.
 */
import { defineCategory } from '../../lib/define.ts';
import { colour, frameMaterial, loadAndWeight } from '../shared/specs.ts';
import { foldable, foldedSize, overallDimensions } from '../shared/specs-chassis.ts';
import { battery, batteryRange, maxSpeed, motor } from '../shared/specs-drive.ts';
import { seatWidth } from '../shared/specs-seating.ts';

export const stairliftsHire = defineCategory({
  code: 'stairlifts-hire',
  position: 9,
  translations: {
    it: {
      name: 'Montascale',
      slug: 'affitto-noleggio-montascale',
      description:
        'Il noleggio di montascale è una soluzione pratica e flessibile per superare le barriere architettoniche in modo sicuro, senza interventi strutturali e senza l’acquisto di un ausilio permanente.',
      metaTitle: 'Montascale Archives - Mia Medical Italia',
      metaDescription:
        'Offriamo un servizio di noleggio di montascale a Roma e Firenze, con consegna rapida, forfait flessibili e assistenza gratuita.',
    },
    en: {
      name: 'Stairlift',
      slug: 'affitto-noleggio-montascale',
      description:
        'Hiring a stair climber is the practical, flexible way to get past a flight of stairs safely — no building work, and no buying a permanent installation.',
      metaTitle: 'Stair climber hire | Mia Medical Italia',
      metaDescription:
        'Stair climber hire in Rome and Florence, with quick delivery, flexible packages and free support.',
    },
  },

  specs: { ...loadAndWeight, ...maxSpeed, ...batteryRange, ...motor, ...battery, ...overallDimensions, ...foldedSize, ...seatWidth, ...frameMaterial, ...colour, ...foldable },
});
