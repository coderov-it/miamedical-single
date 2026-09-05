/**
 * Magnetoterapia — product_cat 224, `affitto-noleggio-magnetoterapia-cemp`,
 * 5 products.
 *
 * Four CEMP (pulsed electromagnetic field) devices plus the combined
 * magnetotherapy-and-wheelchair package, which the site lists here and under
 * Carrozzine; it is filed here because the therapy device is the first thing
 * its own title names.
 *
 * These pages state almost nothing measurable — no dimensions, no field
 * strength, no frequency range. What every one of them DOES state is what
 * comes in the box, so `included-accessories` is the spec that carries the
 * category, and it is the honest one: a magnetotherapy unit without its
 * solenoids or its therapeutic band cannot treat anything.
 *
 * No deposit on any of the five. Delivery is 15 € out and 15 € back anywhere
 * in Italy on the four devices, free from 45 days.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer } from '../shared/specs.ts';
import { includedAccessories, programmes } from '../shared/specs-therapy.ts';

export const magnetotherapyHire = defineCategory({
  code: 'magnetotherapy-hire',
  position: 7,
  translations: {
    it: {
      name: 'Magnetoterapia',
      slug: 'affitto-noleggio-magnetoterapia-cemp',
      description:
        'Noleggio Magnetoterapia CEMP professionale a domicilio, a partire da 2,90 € al giorno, per trattare dolori muscolo-scheletrici e sostenere la riabilitazione post-traumatica. Consegna in tutta Italia.',
      metaTitle: 'Magnetoterapia Archives - Mia Medical Italia',
      metaDescription:
        'Noleggio Magnetoterapia CEMP Professionale a domicilio per trattare dolori muscolo-scheletrici e riabilitrazione post-traumatic. Consegna in tutta Italia!',
    },
    en: {
      name: 'Magnetotherapy',
      slug: 'affitto-noleggio-magnetoterapia-cemp',
      description:
        'Professional PEMF magnetotherapy for hire and use at home, from €2.90 a day, for musculoskeletal pain and recovery after an injury. Delivered anywhere in Italy.',
      metaTitle: 'PEMF magnetotherapy hire | Mia Medical Italia',
      metaDescription:
        'Professional PEMF magnetotherapy hire for use at home, for musculoskeletal pain and post-traumatic rehabilitation. Delivery across Italy.',
    },
  },

  specs: { ...includedAccessories, ...programmes, ...treatmentTimer, ...powerSupply },
});
