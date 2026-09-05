/**
 * Vendita Scooter Elettrico Maximo
 *
 * /prodotto/vendita-scooter-elettrico-maximo/
 * WooCommerce product 15650, 2.800,00 € — the sale twin of the hire Maximo.
 *
 * ⚠️ No product_cat term on the live site. Filed here from its own title.
 */

import { generalTerms } from '../shared/terms.ts';
import { mobilityScootersSale } from './category.ts';

export const maximoScooterSale = mobilityScootersSale.fixed({
  code: 'maximo-scooter-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 2800,

  translations: {
    it: {
      title: 'Vendita Scooter Elettrico Maximo',
      slug: 'vendita-scooter-elettrico-maximo',
      shortDescription: 'Libertà e movimento Acquista il tuo scooter e riscopri la tua indipendenza! Consulenza personalizzata gratuita. Siamo a Roma e Firenze. Spedizione gratuita in tutta Italia!',
      metaTitle: 'Vendita Scooter Elettrico Maximo per Anziani e Disabili',
      metaDescription: 'Vendita scooter elettrico Maximo per anziani e disabili: comodo, sicuro e con autonomia fino a 35 km. Scopri offerte e consulenza dedicata.',
      description: [
        '<h2>Scooter Elettrico MAXIMO per anziani e disabili: acquista la tua libertà di movimento</h2>',
        '<p>La vendita scooter elettrico Maximo è pensata per chi desidera muoversi in totale autonomia, con comfort, sicurezza e prestazioni elevate. Ideale per passeggiate quotidiane e spostamenti più lunghi, MAXIMO ti aiuta a ritrovare indipendenza e serenità ogni giorno.</p>',
        '<h3>Perché acquistare lo Scooter Elettrico MAXIMO?</h3>',
        '<p><strong>Comfort superiore</strong><br />Ruote pneumatiche da 14” con battistrada largo e sospensioni avanzate assicurano una guida fluida anche su superfici irregolari come pavé e marciapiedi.</p>',
        '<p><strong>Seduta ergonomica e regolabile</strong><br />Sedile confortevole con schienale pieghevole e ruotabile, poggiatesta e braccioli regolabili per adattarsi perfettamente alle tue esigenze.</p>',
        '<p><strong>Autonomia elevata</strong><br />Fino a <strong>35 km di percorrenza</strong> con batterie potenziate: ideale per affrontare l’intera giornata senza pensieri.</p>',
        '<p><strong>Massima sicurezza</strong><br />Dotato di luci LED, specchietto retrovisore, clacson, freno di stazionamento e segnale acustico in retromarcia.</p>',
        '<p><strong>Tecnologia semplice e intuitiva</strong><br />Display chiaro con indicatore di carica e manubrio abbattibile per facilitare il trasporto e lo stoccaggio.</p>',
        '<p><strong>Design robusto e versatile</strong><br />Perfetto per ogni età, affronta salite fino a 8° e supera ostacoli fino a 7 cm con facilità.</p>',
        '<p>La vendita scooter elettrico Maximo di Mia Medical Italia include supporto professionale, consulenza personalizzata e assistenza dedicata.</p>',
        '<h2>Caratteristiche tecniche principali</h2>',
        '<ul><li><strong>Velocità massima:</strong> 12,8 km/h</li><li><strong>Autonomia:</strong> 25 km (standard) – 35 km (potenziata)</li><li><strong>Capacità di carico:</strong> fino a 160 kg</li><li><strong>Dimensioni:</strong> 120 × 58 cm</li><li><strong>Peso:</strong> 89 kg con batterie – 65 kg senza</li><li><strong>Batterie:</strong> 2 x 12V 36 Ah / 50 Ah (potenziate)</li><li><strong>Motore:</strong> 470W</li><li><strong>Sistema frenante e sospensioni:</strong> avanzato per stabilità e sicurezza</li></ul>',
        '<h2>Il tuo alleato quotidiano per una vita senza limiti</h2>',
        '<p>Lo scooter elettrico MAXIMO è ideale per:</p>',
        '<ul><li>Persone anziane</li><li>Persone con mobilità ridotta</li><li>Chi desidera maggiore autonomia negli spostamenti</li><li>Donne in gravidanza</li><li>Chi cerca comfort e sicurezza negli spostamenti quotidiani</li></ul>',
        '<h2>Perché acquistarlo da Mia Medical Italia?</h2>',
        '<p>Con <strong>Mia Medical Italia</strong> non acquisti solo uno scooter, ma una soluzione completa per la tua mobilità:</p>',
        '<ul><li>Consulenza personalizzata gratuita</li><li>Supporto nella scelta del modello</li><li>Assistenza dedicata post-vendita</li><li>Possibilità di accessori e configurazioni su misura</li></ul>',
        '<h2>Acquista ora il tuo scooter MAXIMO</h2>',
        '<p>Riscopri il piacere di muoverti liberamente, in totale sicurezza e comfort.<br />Lo scooter elettrico MAXIMO è la tua chiave per l’indipendenza.</p>',
        '<p>📞 <a href="https://wa.me/393926509237">Contattaci</a> per informazioni, prezzi e disponibilità<br />💬 Scrivici su WhatsApp o chiamaci per una consulenza senza impegno</p>',
        '<p><strong>Semplice. Sicuro. Affidabile.</strong><br />Con MAXIMO, la libertà è sempre a portata di mano.</p>',
        '<p><strong><a href="https://wa.me/393926509237">Chiamaci ora al +39 392 65 09 237</a></strong> o visita il nostro <strong><a href="/catalogo-noleggio/">sito web</a></strong>.</p>',
      ].join(''),
    },
    en: {
      title: 'Maximo electric scooter for sale',
      slug: 'vendita-scooter-elettrico-maximo',
      shortDescription: 'Freedom and movement Buy your scooter and rediscover your independence! Personalised advice free. We are in Rome and Florence. Free shipping across Italy!',
      metaTitle: 'Maximo electric scooter for sale, for older and disabled users',
      metaDescription: 'Maximo mobility scooter for sale: comfortable, safe, and up to 35 km on a charge. Ask about offers and advice.',
      description: [
        '<h2>MAXIMO Electric Mobility Scooter for the elderly and disabled: buy your freedom of movement</h2>',
        '<p>The Maximo electric scooter sale is designed for those who want to get around with total independence, comfort, safety, and high performance. Ideal for daily walks and longer journeys, MAXIMO helps you rediscover your independence and peace of mind every day.</p>',
        '<h3>Why buy the MAXIMO Electric Scooter?</h3>',
        '<p><strong>Superior comfort</strong><br />14-inch pneumatic tyres with a wide tread and advanced suspension ensure a smooth ride even on uneven surfaces such as cobblestones and pavements.</p>',
        '<p><strong>Ergonomic and adjustable seat</strong><br />Comfortable seat with a foldable and rotatable backrest, adjustable headrest and armrests to perfectly suit your needs.</p>',
        '<p><strong>High autonomy</strong><br />Until <strong>35 km travel distance</strong> with upgraded batteries: ideal for getting through the whole day without a care.</p>',
        '<p><strong>Maximum security</strong><br />Equipped with LED lights, a rear-view mirror, a horn, a parking brake, and a reversing alarm.</p>',
        '<p><strong>Simple and intuitive technology</strong><br />Clear display with charge indicator and foldable handlebar for easy transport and storage.</p>',
        '<p><strong>Robust and versatile design</strong><br />Perfect for all ages, it tackles inclines of up to 8° and overcomes obstacles up to 7 cm with ease.</p>',
        '<p>The sale of the Maximo electric scooter by Mia Medical Italia includes professional support, personalised advice, and dedicated assistance.</p>',
        '<h2>Main technical features</h2>',
        '<ul><li><strong>Maximum speed:</strong> 12.8 km/h</li><li><strong>Autonomy:</strong> 25 km (standard) – 35 km (extended range)</li><li><strong>Load capacity:</strong> up to 160 kg</li><li><strong>Dimensions:</strong> 120 × 58 cm</li><li><strong>Weight:</strong> 89 kg with batteries – 65 kg without</li><li><strong>Batteries:</strong> 2 x 12V 36 Ah / 50 Ah (upgraded)</li><li><strong>Motor:</strong> 470W</li><li><strong>Braking system and suspension:</strong> advanced for stability and security</li></ul>',
        '<h2>Your daily ally for a life without limits</h2>',
        '<p>The MAXIMO electric scooter is ideal for:</p>',
        '<ul><li>Elderly people</li><li>Persons with reduced mobility</li><li>Who desires more independence in their travel</li><li>Pregnant women</li><li>Someone looking for comfort and safety in their daily commute</li></ul>',
        '<h2>Why buy it from Mia Medical Italia?</h2>',
        '<p>With <strong>Mia Medical Italia</strong> you aren\'t just buying a scooter, but a complete mobility solution:</p>',
        '<ul><li>Free personalised counselling</li><li>Model selection support</li><li>Dedicated after-sales support</li><li>Possibility of bespoke accessories and configurations</li></ul>',
        '<h2>Buy your MAXIMO scooter now</h2>',
        '<p>Rediscover the pleasure of moving freely, in complete safety and comfort.<br />The MAXIMO electric scooter is your key to independence.</p>',
        '<p>📞 <a href="https://wa.me/393926509237">Contact us</a> for information, prices and availability<br />Message us on WhatsApp or call us for a no-obligation consultation</p>',
        '<p><strong>Simple. Secure. Reliable.</strong><br />With MAXIMO, freedom is always close at hand.</p>',
        '<p><strong><a href="https://wa.me/393926509237">Call us now on +39 392 65 09 237</a></strong> or visit our <strong><a href="/en/rental-catalog/">website</a></strong>.</p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'max-load': 160,
    weight: { min: 65, max: 89 },
    'max-speed': 12.8,
    'battery-range': { min: 25, max: 35 },
    motor: { it: '470 W', en: '470 W' },
    battery: { it: '2 x 12 V 36 Ah, potenziate 2 x 12 V 50 Ah', en: '2 × 12 V 36 Ah, or 2 × 12 V 50 Ah upgraded' },
    'total-length': { min: 120, max: 120 },
    'total-width': { min: 58, max: 58 },
  },

  media: {
    thumbnail: { file: 'maximo-scooter-1.png', alt: { it: 'Vendita Scooter Elettrico Maximo' } },
  },
  terms: [generalTerms],
});
