/**
 * Materassi antidecubito ad alto rischio — product_cat 25,
 * `noleggio-materassi-antidecubito-terapeutico-ad-alto-rischio`, 2 products.
 *
 * Two mattresses, a 90 cm and a 120 cm, both rated to stage 4 pressure ulcers.
 * Their pages state a therapeutic load rather than a size — 300 kg and 340 kg
 * — and no dimensions at all, so `max-load` and the stage are what is recorded.
 *
 * Both pages require the mattress protector to be bought for hygiene, at 150 €.
 * That is not optional, so it is not an add-on: it stays in the copy, and
 * docs/catalog/README.md carries it as something the schema cannot express.
 */
import { defineCategory } from '../../lib/define.ts';
import { loadAndWeight } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { hasCompressor, pressureUlcerStage } from '../shared/specs-bed.ts';

export const pressureReliefMattressesHire = defineCategory({
  code: 'pressure-relief-mattresses-hire',
  position: 8,
  translations: {
    it: {
      name: 'Materassi antidecubito ad alto rischio',
      slug: 'noleggio-materassi-antidecubito-terapeutico-ad-alto-rischio',
      description:
        'Hai appena subito un intervento chirurgico e sei costretto a letto? Assisti un genitore anziano o un familiare con mobilità ridotta? Il noleggio del materasso antidecubito ad alto rischio previene e cura le piaghe da decubito fino al 4° stadio, con consegna a domicilio e installazione incluse.',
      metaTitle: 'Materassi antidecubito ad alto rischio ad Alto Rischio',
      metaDescription:
        'Noleggio materasso antidecubito ad alto rischio con consegna a domicilio. Prezzi più bassi del web. Anche lungo periodo. Didponibilità immediata.',
    },
    en: {
      name: 'High-risk pressure-relief mattresses',
      slug: 'noleggio-materassi-antidecubito-terapeutico-ad-alto-rischio',
      description:
        'Just had an operation and confined to bed? Caring for an elderly parent or a relative who can barely move? Hiring a high-risk pressure-relief mattress prevents and treats pressure sores up to stage 4, delivered and installed.',
      metaTitle: 'High-risk pressure-relief mattress hire',
      metaDescription:
        'High-risk pressure-relief mattress hire with home delivery. Lowest prices on the web, long periods too, available immediately.',
    },
  },

  specs: {
    ...loadAndWeight,
    ...pressureUlcerStage,
    ...overallDimensions,
    ...hasCompressor,
  },
});
