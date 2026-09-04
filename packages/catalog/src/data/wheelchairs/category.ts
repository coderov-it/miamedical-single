/**
 * Wheelchair specs, chosen from the 15 WordPress products: the migration's
 * spec rows are Italian free text and formulae, so only the measurable facts
 * below survived. `foldable` is required — chairs and ramps fold, both
 * seggioloni state they do not, and each combo ships a folding chair.
 */
import { defineCategory } from '../../lib/define.ts';
import { spec } from '../../lib/spec.ts';
import { foldable, mobilityBasics, recliningBackrest } from '../shared/specs.ts';

export const wheelchairs = defineCategory({
  code: 'wheelchairs',
  position: 0,
  translations: {
    it: {
      name: 'Carrozzine',
      slug: 'carrozzine',
      description:
        'Noleggio carrozzine ad autospinta, da transito, reclinabili, bariatriche e pediatriche. Certificate, sanificate e pronte all\u2019uso, con ritiro gratuito in sede o consegna a domicilio a Roma e Firenze.',
      metaTitle: 'Noleggio carrozzine | Mia Medical',
      metaDescription:
        'Noleggia una carrozzina pieghevole, da transito o elettrica. Consegna in tutta Italia.',
    },
    en: {
      name: 'Wheelchairs',
      slug: 'wheelchairs',
      description:
        'Wheelchair hire — self-propelled, transit, reclining, bariatric and pediatric. Certified, sanitized and ready to use, with free warehouse collection or home delivery in Rome and Florence.',
      metaTitle: 'Wheelchair hire | Mia Medical',
      metaDescription: 'Hire a folding, transit or electric wheelchair. Delivery across Italy.',
    },
  },
  icon: 'wheelchairs.png',

  specs: {
    ...mobilityBasics,
    foldable: { ...foldable.foldable, isRequired: true },
    ...recliningBackrest,
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
    'closed-width': spec.number({
      label: { it: 'Ingombro da chiusa', en: 'Folded width' },
      unit: 'cm',
      isComparable: true,
    }),
  },
});
