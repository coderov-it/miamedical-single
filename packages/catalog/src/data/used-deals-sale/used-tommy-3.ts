/**
 * Vendita Scooter Usato Tommy 3
 *
 * /prodotto/vendita-scooter-usato-tommy-3/
 * WooCommerce product 14410, 390,00 € — the only one of the three Tommys still
 * in stock.
 */

import { generalTerms } from '../shared/terms.ts';
import { usedDealsSale } from './category.ts';

export const usedTommy3 = usedDealsSale.fixed({
  code: 'used-tommy-3',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 390,

  translations: {
    it: {
      title: 'Vendita Scooter Usato Tommy 3',
      slug: 'vendita-scooter-usato-tommy-3',
      shortDescription: 'Scooter elettrico Tommy Design compatto e leggero. Batteria rimovibile da 12 Ah. Manubrio e piantone regolabili. Velocità massima di 8km/h. Affronta pendenze fino a 10°',
      metaTitle: 'Vendita Scooter Usato Tommy 3',
      metaDescription: 'Vendita Scooter Elettrico per la Mobilità Tommy usato, prezzi imbattibili con Mia Medical Italia. Chiama subito al +39 3926509237 .',
      description: [
        '<p><strong>Compatto, leggero e maneggevole: lo scooter elettrico perfetto per muoversi senza limiti, in sicurezza e con stile!</strong></p>',
        '<ul><li><strong>Facile da guidare</strong>&nbsp;grazie al design ergonomico e alle regolazioni personalizzabili</li><li><strong>Autonomia fino a 18 km</strong>&nbsp;per una libertà di movimento senza pensieri</li><li><strong>Ruote antiforatura e struttura stabile</strong>&nbsp;per una guida sicura su ogni tipo di terreno</li><li><strong>Perfetto per turisti, anziani e persone con ridotta mobilità</strong></li><li><strong>Batteria rimovibile</strong>&nbsp;per una ricarica semplice ovunque</li></ul>',
        '<p><strong>Compatto, leggero e maneggevole: lo scooter elettrico perfetto per muoversi senza limiti, in sicurezza e con stile!</strong></p>',
        '<ul><li><strong>Facile da guidare</strong>&nbsp;grazie al design ergonomico e alle regolazioni personalizzabili</li><li><strong>Autonomia fino a 18 km</strong>&nbsp;per una libertà di movimento senza pensieri</li><li><strong>Ruote antiforatura e struttura stabile</strong>&nbsp;per una guida sicura su ogni tipo di terreno</li><li><strong>Perfetto per turisti, anziani e persone con ridotta mobilità</strong></li><li><strong>Batteria rimovibile</strong>&nbsp;per una ricarica semplice ovunque</li></ul>',
        '<p>Scopri di più sui nostri ausili usati nel nostro <a href="/vendita-ausili-rigenerati-carrozzine-elettriche-rollator-scooter-per-mobilita/">articolo</a>!</p>',
      ].join(''),
    },
    en: {
      title: 'Used Tommy scooter 3, for sale',
      slug: 'vendita-scooter-usato-tommy-3',
      shortDescription: 'Electric scooter Tommy Compact and lightweight design. Removable 12 Ah battery. Adjustable handlebar and column. Maximum speed of 8km/h. Tackles slopes of up to 10°',
      metaTitle: 'Used Tommy scooter 3 for sale',
      metaDescription: 'Used Tommy mobility scooter for sale at unbeatable prices from Mia Medical Italia. Call +39 392 650 9237',
      description: [
        '<p><strong>Compact, light and manoeuvrable: the perfect electric scooter for getting around without limits, safely and in style!</strong></p>',
        '<ul><li><strong>Easy to drive</strong>&nbsp;thanks to ergonomic design and customisable adjustments</li><li><strong>Autonomy of up to 18 km</strong>&nbsp;for carefree freedom of movement</li><li><strong>Puncture-proof wheels and stable structure</strong>&nbsp;for safe driving on all types of terrain</li><li><strong>Perfect for tourists, the elderly and people with reduced mobility</strong></li><li><strong>Removable battery</strong>&nbsp;for easy recharging anywhere</li></ul>',
        '<p><strong>Compact, light and manoeuvrable: the perfect electric scooter for getting around without limits, safely and in style!</strong></p>',
        '<ul><li><strong>Easy to drive</strong>&nbsp;thanks to ergonomic design and customisable adjustments</li><li><strong>Autonomy of up to 18 km</strong>&nbsp;for carefree freedom of movement</li><li><strong>Puncture-proof wheels and stable structure</strong>&nbsp;for safe driving on all types of terrain</li><li><strong>Perfect for tourists, the elderly and people with reduced mobility</strong></li><li><strong>Removable battery</strong>&nbsp;for easy recharging anywhere</li></ul>',
        '<p>Find out more about our used aids in our <a href="/en/vendita-ausili-rigenerati-carrozzine-elettriche-rollator-scooter-per-mobilita/">article</a>!</p>',
      ].join(''),
    },
  },

  specs: {
    condition: 'used',
    propulsion: 'electric',
    'max-speed': 8,
    'max-gradient': 10,
    battery: { it: 'Rimovibile, 12 Ah', en: 'Removable, 12 Ah' },
  },

  media: {
    thumbnail: 'used-tommy-3-1.jpg',
    gallery: [
      'used-tommy-3-2.jpg',
      'used-tommy-3-3.jpg',
      'used-tommy-3-4.jpg',
      'used-tommy-3-5.jpg',
    ],
  },
  terms: [generalTerms],
});
