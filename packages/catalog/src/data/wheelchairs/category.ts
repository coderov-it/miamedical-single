/**
 * The wheelchair category: its own row, its translations, and the specs every
 * product in it may set.
 *
 * Specs are declared HERE and nowhere else. A product in a sibling file can
 * only set a key that appears below, with the value type the spec declares —
 * that is the whole point of defining the category first and adding products
 * second.
 *
 * Adding a spec is safe. Removing one breaks every product still setting it,
 * which is the error you want: a spec value with no spec is a row the database
 * would refuse.
 */
import { defineCategory } from '../../lib/define.ts';
import { spec } from '../../lib/spec.ts';
import { foldable, mobilityBasics } from '../shared/specs.ts';

export const wheelchairs = defineCategory({
  code: 'wheelchairs',
  position: 0,
  translations: {
    it: {
      name: 'Carrozzine',
      slug: 'carrozzine',
      description: 'Carrozzine pieghevoli, da transito ed elettriche, a noleggio in tutta Italia.',
      metaTitle: 'Noleggio carrozzine | Mia Medical',
      metaDescription:
        'Noleggia una carrozzina pieghevole, da transito o elettrica. Consegna in tutta Italia.',
    },
    en: { name: 'Wheelchairs', slug: 'wheelchairs' },
  },
  icon: 'wheelchair.svg',

  specs: {
    // Four shared specs, spread in as one group.
    ...mobilityBasics,
    // One more shared spec, on its own.
    ...foldable,
    // And two this category alone cares about, declared inline.
    propulsion: spec.select({
      label: { it: 'Tipo di spinta', en: 'Propulsion' },
      isFilterable: true,
      isComparable: true,
      options: {
        'self-propelled': { it: 'Autospinta', en: 'Self-propelled' },
        transit: { it: 'Da transito', en: 'Transit' },
        electric: { it: 'Elettrica', en: 'Electric' },
      },
    }),
    closedWidth: spec.number({
      label: { it: 'Ingombro da chiusa', en: 'Folded width' },
      unit: 'cm',
      isComparable: true,
    }),
  },
});
