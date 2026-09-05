/**
 * Noleggio Carrozzina Pediatrica Pieghevole
 *
 * /prodotto/noleggio-carrozzina-pediatrica-pieghevole-per-bambini-con-alzata-per-il-gesso/
 * WooCommerce product 12321 — the only product in the catalogue whose page names
 * the manufacturer and model: a Vermeiren Jazz S50 Kids. The page links the
 * maker's own datasheet, so `brand` is recorded rather than inferred.
 *
 * ⚠️ One variation (12329) is labelled "45 giorni 65 - €" — the euro sign has
 * slipped past the number. It charges 65 €, which fits the ladder, so only the
 * label text is wrong.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const pediatricWheelchair = wheelchairsHire.rental({
  code: 'pediatric-wheelchair',
  status: 'active',
  brand: 'Vermeiren',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 100),
  ],

  translations: {
    it: {
      title: 'Noleggio Carrozzina Pediatrica Pieghevole',
      slug: 'noleggio-carrozzina-pediatrica-pieghevole-per-bambini-con-alzata-per-il-gesso',
      shortDescription: 'Noleggio Carrozzina Il ritiro e la riconsegna delle carrozzine in magazzino è gratuito! Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Disponibilità immediata. Prenota online o contattaci tramite WhatsApp! Consegna e ritiro a domicilio a Roma e Firenze da 30€.',
      metaTitle: 'Noleggio Carrozzina Pediatrica Pieghevole',
      metaDescription: 'Noleggio carrozzina pediatrica pieghevole Jazz S50 Kids, dai 2 anni in su, con alzata per il gesso. Disponibilità immediata. Contattaci al +393926509237',
      description: [
        '<h4>Noleggio Carrozzina Manuale Pieghevole Pediatrica Jazz S50 Kids: Comfort, Sicurezza e Libertà per i Più Piccoli</h4>',
        '<p>Una <strong>carrozzina pediatrica</strong> è un <strong>ausilio per la mobilità</strong> progettato specificatamente per bambini con <strong>disabilità motorie temporanee o permanenti</strong>. A differenza delle carrozzine per adulti, quelle pediatriche offrono un maggiore supporto posturale, misure ridotte e materiale leggeri, pensati per garantire comfort e sicurezza ai più piccoli.</p>',
        '<h4>A chi è utile il Noleggio della Carrozzina Manuale Pieghevole Pediatrica Jazz S50 Kids?</h4>',
        '<p>La <strong><a href="https://www.vermeiren.it/web/web.nsf/detailproduct.xsp?CountryRTITProductGroupBAMBINO%20ED%20ADOLESCENTESubGroupCARROZZINE%20STANDARD%20E%20LEGGERESelectedJazz%20S50%20Kids">Jazz S50 Kids</a></strong> è ideale per bambini che necessitano di supporto alla mobilità a causa di:</p>',
        '<ul><li>Disabilità motorie congenite o acquisite </li><li>Infortuni temporanei</li><li> Post- operatorio ortopedico </li><li>Malattie neurologiche</li></ul>',
        '<p>Questa carrozzina pediatrica è pensata per offrire autonomia e comfort sia in casa che in ambienti esterni. </p>',
        '<h4><a href="https://www.vermeiren.it/product/brochure.nsf/O/7EE28C784EECBE9DC1258B87002D8EE2/%24FILE/Jazz%20S50%20Kids%20-%20IT.pdf">Specifiche Tecniche della Jazz S50 Kids</a></h4>',
        '<ul><li><strong>Telaio pieghevole</strong> in alluminio leggero</li><li>Portata massima: <strong>60 kg</strong></li><li>Peso della carrozzina: <strong>16,9 kg</strong></li><li>Seduta <strong>regolabile</strong> in larghezza e profondità</li><li>Ruote posteriori da 22” con sgancio rapido </li><li>Ruote anteriori da 6” in PU nere </li><li><strong>Pedane regolabili ed estraibili</strong></li><li>Braccioli ribaltabili </li></ul>',
        '<p>Ideale per trasporto in auto e ambienti pubblici! Clicca <a href="https://domino01.vermeiren.be/web/datasheet.nsf/O/0B0D17B944FD0E8AC1258997002FAA21/%24FILE/Jazz%20S50%20Kids.pdf">qui</a> per scaricare la scheda tecnica completa!</p>',
        '<h4>Perché scegliere Mia Medical per il noleggio?</h4>',
        '<p>Mia Medical è un’azienda specializzata nel <strong>noleggio e nella fornitura di ausili medicali certificati provenienti dai <a href="https://www.vermeiren.it/web/web.nsf/home.xsp?CountryRTITProductGroup">migliori fornitori sul mercato</a>, con un servizio su misura per ogni esigenza:</strong></p>',
        '<ul><li><strong>Spedizione rapida in 24/48h </strong>dalla prenotazione</li><li><strong>Assistenza tecnica </strong>inclusa</li><li>Dispositivi igienizzati e revisionati </li><li><strong>Personale qualificato</strong> per <strong>consulenze gratuite</strong> senza impegno</li><li>Dispositivi di altissima qualità provenienti dai migliori fornitori del settore </li></ul>',
        '<h4>Informazioni utili </h4>',
        '<p>Consulta le nostre <strong><a href="/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/">condizioni di noleggio</a></strong>! Se hai qualche dubbio il team di <em>Mia Medical Italia</em> è ad una sola telefonata di distanza, sempre disponibile a rendere la tua <strong>esperienza di noleggio trasparente e personalizzata. Che aspetti, contattaci ora!</strong></p>',
        '<ul><li><strong>Numero di Telefono: +30 392 65 09 237</strong></li><li><a href="https://wa.me/393926509237">Whatsapp</a></li><li><a href="/">Sito web</a></li><li><a href="https://www.instagram.com/miamedical_italia/">Instagram</a></li><li><a href="https://www.facebook.com/MIAMedicalitalia/">Facebook</a></li></ul>',
      ].join(''),
    },
    en: {
      title: 'Paediatric folding wheelchair for hire',
      slug: 'noleggio-carrozzina-pediatrica-pieghevole-per-bambini-con-alzata-per-il-gesso',
      shortDescription: 'Wheelchair Hire The collection and return of wheelchairs to the warehouse is free of charge! Hire for 1 day: 15€ with pick-up on site only. Immediate availability. Book online or contact us via WhatsApp! Home delivery and pick-up in Rome and Florence from 30€.',
      metaTitle: 'Paediatric folding wheelchair hire | Jazz S50 Kids',
      metaDescription: 'Hire a Vermeiren Jazz S50 Kids paediatric wheelchair: light aluminium frame, 60 kg limit, seat adjustable in width and depth.',
      description: [
        '<h4>Hire Pediatric Manual Folding Wheelchair Jazz S50 Kids: Comfort, Safety and Freedom for Little Ones</h4>',
        '<p>A <strong>paediatric wheelchair</strong> is a <strong>mobility aid</strong> designed specifically for children with <strong>temporary or permanent motor disabilities</strong>. Unlike wheelchairs for adults, paediatric wheelchairs offer greater postural support, smaller sizes and lightweight materials designed to ensure comfort and safety for the little ones.</p>',
        '<h4>To whom is the Hire of the Manual Folding Pediatric Wheelchair Jazz S50 Kids useful?</h4>',
        '<p>La <strong><a href="https://www.vermeiren.it/web/web.nsf/detailproduct.xsp?CountryRTITProductGroupBAMBINO%20ED%20ADOLESCENTESubGroupCARROZZINE%20STANDARD%20E%20LEGGERESelectedJazz%20S50%20Kids">Jazz S50 Kids</a></strong> is ideal for children who need mobility support due to:</p>',
        '<ul><li>Congenital or acquired motor disabilities </li><li>Temporary injuries</li><li> Orthopaedic post-operative </li><li>Neurological diseases</li></ul>',
        '<p>This paediatric wheelchair is designed to offer autonomy and comfort both indoors and outdoors. </p>',
        '<h4><a href="https://www.vermeiren.it/product/brochure.nsf/O/7EE28C784EECBE9DC1258B87002D8EE2/%24FILE/Jazz%20S50%20Kids%20-%20IT.pdf">Technical specifications of the Jazz S50 Kids</a></h4>',
        '<ul><li><strong>Folding frame</strong> in lightweight aluminium</li><li>Maximum capacity: <strong>60 kg</strong></li><li>Weight of the wheelchair: <strong>16.9 kg</strong></li><li>Seating <strong>adjustable</strong> in width and depth</li><li>22" rear wheels with quick release </li><li>6" black PU front wheels </li><li><strong>Adjustable and removable footrests</strong></li><li>Folding armrests </li></ul>',
        '<p>Ideal for transport in cars and public environments! Click <a href="https://domino01.vermeiren.be/web/datasheet.nsf/O/0B0D17B944FD0E8AC1258997002FAA21/%24FILE/Jazz%20S50%20Kids.pdf">here</a> to download the complete data sheet!</p>',
        '<h4>Why choose Mia Medical for hire?</h4>',
        '<p>Mia Medical is a company specialising in <strong>rental and supply of certified medical aids from the <a href="https://www.vermeiren.it/web/web.nsf/home.xsp?CountryRTITProductGroup">best suppliers on the market</a>with a tailor-made service for every need:</strong></p>',
        '<ul><li><strong>Rapid dispatch in 24/48h </strong>from booking</li><li><strong>Technical Assistance </strong>including</li><li>Sanitised and overhauled devices </li><li><strong>Qualified personnel</strong> for <strong>free consultations</strong> without commitment</li><li>Top quality devices from the best suppliers in the industry </li></ul>',
        '<h4>Useful information </h4>',
        '<p>See our <strong><a href="/en/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/">rental conditions</a></strong>! If you have any doubts the <em>Mia Medical Italia</em> is just a phone call away, always available to make your <strong>transparent and customised rental experience. What are you waiting for, contact us now!</strong></p>',
        '<ul><li><strong>Telephone number: +30 392 65 09 237</strong></li><li><a href="https://wa.me/393926509237">Whatsapp</a></li><li><a href="/en/">Website</a></li><li><a href="https://www.instagram.com/miamedical_italia/">Instagram</a></li><li><a href="https://www.facebook.com/MIAMedicalitalia/">Facebook</a></li></ul>',
      ].join(''),
    },
  },

  specs: {
    'age-group': 'child',
    'max-load': 60,
    weight: { min: 16.9, max: 16.9 },
    'frame-material': 'aluminium',
    foldable: true,
    'rear-wheels': { it: '22" con sgancio rapido', en: '22" quick-release' },
    'front-wheels': { it: '6" in PU nere', en: '6" black PU' },
    'adjustable-seat': true,
    'removable-armrests': true,
    'removable-footrests': true,
  },

  media: {
    thumbnail: 'pediatric-wheelchair-1.jpg',
    gallery: [
      'pediatric-wheelchair-2.jpg',
      'pediatric-wheelchair-3.jpg',
      'pediatric-wheelchair-4.jpg',
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
