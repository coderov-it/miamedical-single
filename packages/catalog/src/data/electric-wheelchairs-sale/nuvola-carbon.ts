/**
 * Vendita Carrozzina Elettrica In Carbonio Nuvola
 *
 * /prodotto/vendita-carrozzina-elettrica-nuvola-in-carbonio/
 * WooCommerce product 15677, 1.889,00 € — the fullest specification block in the
 * catalogue:
 *
 *   Velocità massima  6 km/h        Autonomia  fino a 24 km
 *   Portata massima  136 kg         Peso struttura  13,6 kg (senza batteria)
 *   Peso batteria  1,8 kg           Motori  2 x 200W
 *   Dimensioni aperta  97 × 62,5 × 87 cm
 *   Dimensioni chiusa  97 × 75 × 31 cm
 *   Seduta  46 × 37 cm              Raggio di sterzata  ≤ 120 cm
 *   Pendenza massima  9°            Altezza ostacolo superabile  fino a 4 cm
 *
 * `weight` is the frame at 13,6 kg; the 1,8 kg battery is stated separately on
 * the page and is not folded into it.
 */

import { generalTerms } from '../shared/terms.ts';
import { electricWheelchairsSale } from './category.ts';

export const nuvolaCarbon = electricWheelchairsSale.fixed({
  code: 'nuvola-carbon',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 1889,

  translations: {
    it: {
      title: 'Vendita Carrozzina Elettrica In Carbonio Nuvola',
      slug: 'vendita-carrozzina-elettrica-nuvola-in-carbonio',
      shortDescription: 'Leggerezza e libertà Acquista la carrozzina elettrica Nuvola in Carbonio e muoviti ogni giorno senza fatica! Carrozzina Elettrica Pieghevole UltraLeggera Doppia batteria per più autonomia Pieghevole e trasportabile in auto Massima libertà di movimento, ogni giorno Prenota subito online! Oppure Contattaci ora per info e disponibilità Spedizione gratuita in tutta Italia.',
      metaTitle: 'Vendita Carrozzina Elettrica Nuvola in Carbonio',
      metaDescription: 'Vendita Carrozzina Elettrica Nuvola in Carbonio ultra leggera e pieghevole. Autonomia fino a 24 km, ideale per uso interno ed esterno. Contattaci ora!',
      description: [
        '<h2>Vendita Carrozzina Elettrica in Carbonio Nuvola </h2>',
        '<p><strong>Vendita Carrozzina Elettrica Nuvola in Carbonio:</strong> scopri la leggerezza della libertà con la carrozzina elettrica Nuvola in Carbonio, dotata di tecnologia avanzata, design ultraleggero e massima praticità per muoverti ogni giorno senza limiti.</p>',
        '<p>Pensata per anziani e persone con mobilità ridotta, è la soluzione ideale per chi cerca indipendenza, comfort e facilità di trasporto. Perfetta sia per l’uso interno che esterno, ti accompagna nelle attività quotidiane con sicurezza e semplicità.</p>',
        '<h2>Perché scegliere la Vendita Carrozzina Elettrica Nuvola in Carbonio?</h2>',
        '<p><strong>Ultra leggera e resistente</strong><br />Struttura in carbonio con peso di <strong>soli 13,6 kg (senza batteria)</strong>: facilissima da sollevare, trasportare e gestire anche in autonomia.</p>',
        '<p><strong>Massima portabilità</strong><br />Completamente <strong>pieghevole e compatta</strong> (solo 31 cm di profondità da chiusa), perfetta per il bagagliaio dell’auto e per viaggi senza stress.</p>',
        '<p><strong>Autonomia ideale per ogni giornata</strong><br />Fino a <strong>24 km con una sola carica</strong>, perfetta per commissioni, passeggiate e spostamenti quotidiani.</p>',
        '<p><strong>Guida semplice e intuitiva</strong><br />Joystick ergonomico con controllo totale di direzione e velocità (5 livelli fino a 6 km/h), adatto anche a chi non ha esperienza.</p>',
        '<p><strong>Comfort studiato nei dettagli</strong><br />Seduta ampia (46 cm), cuscino ergonomico, braccioli comodi e struttura stabile per garantire una postura corretta e rilassata. La vendita carrozzina elettrica Nuvola è pensata per offrire massimo comfort anche durante un utilizzo prolungato.</p>',
        '<p><strong>Sicurezza e stabilità</strong><br />Dotata di ruotine anti-ribaltamento, freni affidabili e ottima stabilità anche su leggere pendenze fino al 9°.</p>',
        '<h2>Caratteristiche tecniche principali</h2>',
        '<ul><li><strong>Velocità massima:</strong> 6 km/h</li><li><strong>Autonomia:</strong> fino a 24 km</li><li><strong>Portata massima:</strong> 136 kg</li><li><strong>Peso struttura:</strong> 13,6 kg (senza batteria)</li><li><strong>Peso batteria:</strong> 1,8 kg</li><li><strong>Motori:</strong> 2 x 200W</li><li><strong>Dimensioni aperta:</strong> 97 × 62,5 × 87 cm</li><li><strong>Dimensioni chiusa:</strong> 97 × 75 × 31 cm</li><li><strong>Seduta:</strong> 46 × 37 cm</li><li><strong>Raggio di sterzata:</strong> ≤ 120 cm</li><li><strong>Pendenza massima:</strong> 9°</li><li><strong>Altezza ostacolo superabile:</strong> fino a 4 cm</li><li><strong>Protezione:</strong> IP24 (resistente a spruzzi d’acqua)</li></ul>',
        '<h2>Ideale per:</h2>',
        '<p>La vendita carrozzina elettrica Nuvola in carbonio è pensata per chi desidera autonomia, leggerezza e praticità negli spostamenti quotidiani.</p>',
        '<ul><li>Uso quotidiano in casa e fuori</li><li>Spostamenti urbani e centri commerciali</li><li>Viaggi grazie alla struttura compatta</li><li>Persone che cercano leggerezza e facilità di trasporto</li></ul>',
        '<h2>Acquista ora la tua Carrozzina Elettrica in Carbonio Nuvola </h2>',
        '<p>Con <strong>Mia Medical Italia</strong> scegli qualità, sicurezza e assistenza professionale. Ti guidiamo nella scelta del modello più adatto alle tue esigenze, con supporto completo prima e dopo l’acquisto.</p>',
        '<p>Per vedere le carrozzine elettriche in vendita clicca <a href="/catalogo-vendita/">qui</a>. </p>',
        '<p>📞 Contattaci ora per una consulenza gratuita e senza impegno<br />📱 Disponibili anche su WhatsApp</p>',
        '<p><p><p>Per maggiori informazioni sulla mobilità assistita puoi consultare anche il <a href="https://www.salute.gov.it">sito del Ministero della Salute.</a></p>',
      ].join(''),
    },
    en: {
      title: 'Nuvola carbon fibre electric wheelchair, for sale',
      slug: 'vendita-carrozzina-elettrica-nuvola-in-carbonio',
      shortDescription: 'Lightness and freedom Buy the Nuvola electric wheelchair in Carbon and move around every day effortlessly! Ultra-Lightweight Folding Electric Wheelchair Dual battery for greater autonomy Foldable and transportable in a car Maximum freedom of movement, every day Book online now! Or Contact us now for info and availability Shipping free of charge throughout Italy.',
      metaTitle: 'Nuvola carbon fibre electric wheelchair for sale',
      metaDescription: 'Nuvola carbon fibre electric wheelchair for sale: ultralight and folding, up to 24 km on a charge, right for indoors and out.',
      description: [
        '<h2>Nuvola Carbon Fibre Electric Wheelchair for Sale </h2>',
        '<p><strong>For Sale: Nuvola Electric Carbon Fibre Wheelchair</strong> Discover the lightness of freedom with the Nuvola Carbon Electric Wheelchair, featuring advanced technology, ultralight design and maximum practicality to move around every day without limits.</p>',
        '<p>Designed for older people and those with reduced mobility, it is the ideal solution for anyone looking for independence, comfort and ease of transport. Perfect for both indoor and outdoor use, it supports you in your daily activities with safety and simplicity.</p>',
        '<h2>Why choose the Nuvola Carbon Electric Wheelchair for sale?</h2>',
        '<p><strong>Ultra-lightweight and durable</strong><br />Carbon frame with a weight of <strong>soli 13,6 kg (senza batteria)</strong>very easy to lift, transport and manage even on your own.</p>',
        '<p><strong>Maximum portability</strong><br />Completely <strong>Foldable and compact</strong> (only 31 cm deep when closed), perfect for the car boot and for stress-free travel.</p>',
        '<p><strong>Ideal autonomy for each day</strong><br />Until <strong>24 km on a single charge</strong>, perfect for errands, walks and daily commutes.</p>',
        '<p><strong>Simple and intuitive guide</strong><br />Ergonomic joystick with total direction and speed control (5 levels up to 6 km/h), also suitable for beginners.</p>',
        '<p><strong>Comfort studied in detail</strong><br />Wide seat (46 cm), ergonomic cushion, comfortable armrests and a stable frame to ensure a correct and relaxed posture. The sale of the Nuvola electric wheelchair is designed to offer maximum comfort even during prolonged use.</p>',
        '<p><strong>Security and stability</strong><br />Equipped with anti-tip small wheels, reliable brakes and excellent stability even on slight gradients of up to 9°.</p>',
        '<h2>Main technical features</h2>',
        '<ul><li><strong>Maximum speed:</strong> 6 km/h</li><li><strong>Autonomy:</strong> up to 24 km</li><li><strong>Maximum capacity:</strong> 136 kg</li><li><strong>Structure weight</strong> 13.6 kg (excluding battery)</li><li><strong>Battery weight:</strong> 1.8 kg</li><li><strong>Engines:</strong> 2 x 200W</li><li><strong>Dimensions open:</strong> 97 × 62,5 × 87 cm</li><li><strong>Closed dimensions:</strong> 97 × 75 × 31 cm</li><li><strong>Seated</strong> 46 × 37 cm</li><li><strong>Turning circle:</strong> ≤ 120 cm</li><li><strong>Maximum gradient</strong> 9°</li><li><strong>Maximum obstacle height:</strong> up to 4 cm</li><li><strong>Protection</strong> IP24 (splash-proof)</li></ul>',
        '<h2>Ideal for:</h2>',
        '<p>The sale of the Nuvola carbon fibre electric wheelchair is designed for those who want autonomy, lightness and practicality in their daily travel.</p>',
        '<ul><li>Everyday use in and out of the house</li><li>Urban travel and shopping centres</li><li>Travel thanks to the compact structure</li><li>People looking for lightness and ease of transport</li></ul>',
        '<h2>Buy your Nuvola Carbon Electric Wheelchair now </h2>',
        '<p>With <strong>Mia Medical Italia</strong> Choose quality, safety and professional assistance. We guide you in choosing the most suitable model for your needs, with complete support before and after purchase.</p>',
        '<p>To see electric wheelchairs for sale, click <a href="/en/sale-catalog/">here</a>. </p>',
        '<p>📞 Contact us now for a free, no-obligation consultation<br />📱 Also available on WhatsApp</p>',
        '<p><p><p>For further information on assisted mobility, you can also consult the <a href="https://www.salute.gov.it">Ministry of Health website.</a></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'indoor-outdoor': 'both',
    'max-load': 136,
    weight: { min: 13.6, max: 13.6 },
    'max-speed': 6,
    'battery-range': { min: 24, max: 24 },
    'max-gradient': 9,
    'obstacle-height': 4,
    'turning-radius': 120,
    motor: { it: '2 x 200 W', en: '2 × 200 W' },
    battery: { it: 'Litio, peso 1,8 kg', en: 'Lithium, 1.8 kg' },
    'total-length': { min: 97, max: 97 },
    'total-width': { min: 62.5, max: 62.5 },
    'total-height': { min: 87, max: 87 },
    'folded-size': { it: '97 × 75 × 31 cm', en: '97 × 75 × 31 cm' },
    'seat-width': { min: 46, max: 46 },
    'frame-material': 'carbon',
    'wheel-type': 'pneumatic',
    foldable: true,
  },

  media: {
    thumbnail: { file: 'nuvola-carbon-1.png', alt: { it: 'Vendita Carrozzina Elettrica Nuvola in Carbonio' } },
    gallery: [
      { file: 'nuvola-carbon-2.png', alt: { it: 'Vendita Carrozzina Elettrica Nuvola in Carbonio' } },
      'nuvola-carbon-3.png',
      'nuvola-carbon-4.png',
      { file: 'nuvola-carbon-5.png', alt: { it: 'Vendita Carrozzina Elettrica Nuvola in Carbonio' } },
      { file: 'nuvola-carbon-6.png', alt: { it: 'Vendita Carrozzina Elettrica Nuvola in Carbonio' } },
    ],
  },
  terms: [generalTerms],
});
