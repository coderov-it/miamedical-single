/**
 * Verticalizzatori — product_cat 480, `affitto-noleggio-verticalizzatori`,
 * 2 products.
 *
 * Two standing hoists: the plain electric one, whose attribute table is the
 * most detailed in the catalogue, and the active Albatros 2.
 *
 * ⚠️ The electric standing frame (8853) states its load limit TWICE and
 * differently: the attribute table says `Maximum capacity 180 Kg`, the prose
 * says "Portata massima di carico: 200 kg". 180 kg is recorded — the lower of
 * the two, because a load limit is a safety figure and the attribute table is
 * the structured one. The conflict is in docs/catalog/README.md.
 *
 * ⚠️ Its 90-day variation is labelled "90 giorni 360 €" and charges 390 €. The
 * charged figure is written.
 *
 * These are the two hire products in the catalogue with NO intake question at
 * all — the site asks neither of them for a start date — so neither carries
 * `hireIntake`.
 */
import { defineCategory } from '../../lib/define.ts';
import { loadAndWeight } from '../shared/specs.ts';
import { adjustableHeight, foldable, overallDimensions, wheelDiameter } from '../shared/specs-chassis.ts';
import { armLength, includesSling, liftsPerCharge } from '../shared/specs-bed.ts';

export const standingFramesHire = defineCategory({
  code: 'standing-frames-hire',
  position: 15,
  translations: {
    it: {
      name: 'Verticalizzatori',
      slug: 'affitto-noleggio-verticalizzatori',
      description:
        'Il noleggio di verticalizzatori elettrici MIA Medical Italia è una soluzione professionale e sicura per assistere persone con ridotta mobilità nel passaggio dalla posizione seduta a quella eretta, senza sforzo e in totale sicurezza.',
      metaTitle: 'Verticalizzatori Archives - Mia Medical Italia',
      metaDescription:
        'Offriamo un servizio di noleggio di Verticalizzatori per anziani e persone con disabilità, consegna rapida, forfeit flessibili e assistenza gratuita.',
    },
    en: {
      name: 'Standing hoists',
      slug: 'affitto-noleggio-verticalizzatori',
      description:
        'Hiring an electric standing hoist from MIA Medical Italia is the safe, professional way to bring someone with reduced mobility from sitting to standing — no strain on them, and none on whoever is helping.',
      metaTitle: 'Standing hoist hire | Mia Medical Italia',
      metaDescription:
        'Standing hoist hire for older and disabled people: quick delivery, flexible packages and free support.',
    },
  },

  specs: {
    ...loadAndWeight,
    ...overallDimensions,
    ...adjustableHeight,
    ...armLength,
    ...wheelDiameter,
    ...includesSling,
    ...liftsPerCharge,
    ...foldable,
  },
});
