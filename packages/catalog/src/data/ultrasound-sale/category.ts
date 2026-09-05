/**
 * Vendita Ultrasuono — product_cat 544, `vendita-ultrasuono`, 1 product.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer, warranty, weight, colour } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { includedAccessories, channels, programmes, treatmentPressure, treatmentTemperature } from '../shared/specs-therapy.ts';

export const ultrasoundSale = defineCategory({
  code: 'ultrasound-sale',
  position: 32,
  translations: {
    it: {
      name: 'Vendita Ultrasuono',
      slug: 'vendita-ultrasuono',
      description:
        'Vendita ultrasuono professionale con Mia Medical. Consegna a domicilio in tutta Italia inclusa nel prezzo.',
      metaTitle: 'Vendita Ultrasuono Professionale GLOBUS Medisound 3000',
      metaDescription:
        'Acquista il GLOBUS Medisound 3000, dispositivo ultrasuono professionale per fisioterapia e riabilitazione. Consegna rapida in tutta Italia.',
    },
    en: {
      name: 'Sale Ultrasound',
      slug: 'vendita-ultrasuono',
      description:
        'Professional ultrasound therapy for sale from Mia Medical, with delivery anywhere in Italy included in the price.',
      metaTitle: 'Professional GLOBUS Medisound 3000 ultrasound for sale',
      metaDescription:
        'Buy the GLOBUS Medisound 3000, a professional ultrasound device for physiotherapy and rehabilitation. Fast delivery across Italy.',
    },
  },

  specs: { ...includedAccessories, ...channels, ...programmes, ...treatmentPressure, ...treatmentTemperature, ...treatmentTimer, ...powerSupply, ...overallDimensions, ...weight, ...warranty, ...colour },
});
