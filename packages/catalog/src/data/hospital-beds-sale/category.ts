/**
 * Vendita Letti ortopedici ospedalieri — product_cat 537,
 * `vendita-letti-ortopedici-ospedalieri`, 1 product.
 *
 * One bed, the three-joint electric. Its page sells on features rather than
 * figures: the only measurable thing it states is that the headrest tilts to
 * 75°, so `articulation` carries that and the rest is left unset — the hire
 * beds' specification blocks belong to the hire beds.
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

export const hospitalBedsSale = defineCategory({
  code: 'hospital-beds-sale',
  position: 23,
  translations: {
    it: {
      name: 'Vendita Letti ortopedici ospedalieri',
      slug: 'vendita-letti-ortopedici-ospedalieri',
      description:
        'La vendita letti ortopedici ospedalieri di MIA Medical Italia offre soluzioni professionali per garantire comfort, sicurezza e supporto nella mobilità e nella degenza, sia per anziani che per persone con disabilità. Disponiamo del Letto Elettrico Ospedaliero 3 snodi, certificato, sanificato e pronto all’uso, con consegna a domicilio rapida a Roma, Firenze e province limitrofe.',
      metaTitle: 'Vendita Letti Ortopedici Ospedalieri | Comfort e Sicurezza',
      metaDescription:
        'Acquista il letto elettrico ospedaliero 3 snodi per anziani e disabili. Vendita letti ortopedici ospedalieri con materasso antidecubito e consegna rapida.',
    },
    en: {
      name: 'Orthopaedic hospital beds for sale',
      slug: 'vendita-letti-ortopedici-ospedalieri',
      description:
        'MIA Medical Italia sells orthopaedic hospital beds for comfort, safety and support during a period of care, for older people and for people with disabilities alike. We stock the three-joint electric hospital bed, certified, sanitised and ready to use, delivered quickly in Rome, Florence and the neighbouring provinces.',
      metaTitle: 'Orthopaedic hospital beds for sale | Comfort and safety',
      metaDescription:
        'Buy a three-joint electric hospital bed for older or disabled users, with a pressure-relief mattress and quick delivery.',
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
