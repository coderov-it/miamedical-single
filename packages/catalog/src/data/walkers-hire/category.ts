/**
 * Deambulatori e Rollatori — product_cat 130,
 * `affitto-e-noleggio-deambulatori`, 6 products.
 *
 * Two of the six carry real WooCommerce attribute tables — the underarm walker
 * (9073) and the aluminium rollator (9085) — and those tables are where every
 * measurement below comes from. The other four state nothing measurable at all
 * beyond what their titles say, and nothing has been borrowed from a sibling to
 * fill the gap.
 *
 * `has-seat` is the line the catalogue itself draws between a `deambulatore`
 * and a `rollator con seduta`, so it is filterable.
 *
 * No deposit: all six pages say "Nessun deposito richiesto".
 */
import { defineCategory } from '../../lib/define.ts';
import { colour, frameMaterial, loadAndWeight } from '../shared/specs.ts';
import {
  adjustableHeight,
  brakes,
  foldable,
  foldedLength,
  foldedSize,
  foldedWidth,
  handleHeight,
  overallDimensions,
  wheelDiameter,
} from '../shared/specs-chassis.ts';
import { dismountable, hasSeat, seatHeight } from '../shared/specs-seating.ts';

export const walkersHire = defineCategory({
  code: 'walkers-hire',
  position: 2,
  translations: {
    it: {
      name: 'Deambulatori e Rollatori',
      slug: 'affitto-e-noleggio-deambulatori',
      description:
        'Il noleggio di deambulatori e rollatori MIA Medical Italia sostiene chi deve tornare a camminare in sicurezza — dopo un intervento, durante la riabilitazione o quando l’equilibrio non è più quello di prima. Il noleggio consente di adattare l’ausilio all’evoluzione delle condizioni del paziente.',
      metaTitle: 'Deambulatori e Rollatori Archives - Mia Medical Italia',
      metaDescription:
        'Noleggio di deambulatori e rollatori a Roma e Firenze: ausili certificati e sanificati, consegna a domicilio e nessun deposito richiesto.',
    },
    en: {
      name: 'Walkers and Rollators',
      slug: 'affitto-e-noleggio-deambulatori',
      description:
        'Hiring a walking frame or a rollator from MIA Medical Italia supports someone learning to walk safely again — after an operation, through rehabilitation, or once balance is no longer what it was. Hiring means the aid can change as the person does.',
      metaTitle: 'Walker and rollator hire | Mia Medical Italia',
      metaDescription:
        'Walking frame and rollator hire in Rome and Florence: certified, sanitised aids, delivered to the door, with no deposit to pay.',
    },
  },

  specs: {
    ...loadAndWeight,
    ...adjustableHeight,
    ...handleHeight,
    ...overallDimensions,
    ...foldedWidth,
    ...foldedLength,
    ...foldedSize,
    ...hasSeat,
    ...seatHeight,
    ...dismountable,
    ...wheelDiameter,
    ...brakes,
    ...frameMaterial,
    ...colour,
    ...foldable,
  },
});
