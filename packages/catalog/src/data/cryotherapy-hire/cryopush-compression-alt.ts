/**
 * Noleggio crioterapia a compressione cryopush
 *
 * /prodotto/noleggio-crioterapia-a-compressione-cryopush/
 * WooCommerce product 13274.
 *
 * ⚠️ This is a SECOND listing of the Cryopush, alongside 12465, with different
 * packages: 10/20/30 days at 160/280/360 € here against 15/20/30 days at
 * 150/190/260 € there. Both are live and both are carried; the duplication is
 * recorded in docs/catalog/README.md for the shop to resolve.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { cryotherapyHire } from './category.ts';

export const cryopushCompressionAlt = cryotherapyHire.rental({
  code: 'cryopush-compression-alt',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(10, 160),
    days(20, 280),
    days(30, 360),
  ],

  translations: {
    it: {
      title: 'Noleggio crioterapia a compressione cryopush',
      slug: 'noleggio-crioterapia-a-compressione-cryopush',
      shortDescription: 'Noleggio Crioterapia (terapia del freddo) professionale con compressione Facilissimo da usare, con altissimi risultati in pochissimi giorni. Cryopush è l’evoluzione nella terapia post traumatica. Consegna gratis se acquisti un noleggio per un minimo di 20 giorni. Per noleggi di durata minore consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio crioterapia a compressione Cryopush',
      metaDescription: 'Noleggio crioterapia compressiva o Cryopush con compressione . Trasporto gratuito. Nessun Deposito. disponibilità immediata. Prenota online ora !',
      description: [
        '<p>Noleggio Cryopush: crioterapia con compressione che contribuisce al recupero di pazienti e atleti, velocizzando e migliorando il processo. Riduce il dolore senza farmaci, controlla edema e gonfiore. A sua volta, stimola il flusso sanguigno arterioso, migliora la gamma di movimento, riduce l&#8217;acido lattico e accelera i meccanismi di guarigione naturali del corpo. <ins>Noleggio crioterapia compressiva cryopush può essere utile per tutti.</ins></p>',
        '<h3>I benefici del noleggio della crioterapia compressiva : </h3>',
        '<p>Il noleggio della terapia del freddo con compressione o crioterapia compressiva offre maggiori benefici terapeutici, è migliore dei protocolli di tipo RISO (Riposo, ghiaccio, compressione, elevazione), stimolando la guarigione naturale dei tessuti e migliorando i risultati fisioterapici. <ins>Usare il noleggio della crioterapia compressiva cryopush può ottimizzare i tempi di recupero.</ins></p>',
        '<p>Il noleggio Cryopush a compressione è semplice,&nbsp;<strong>leggero</strong>&nbsp;e&nbsp;<strong>facile da usare</strong>, Impacchi freddi&nbsp;<strong>rimovibili</strong>&nbsp;e&nbsp;<strong>riutilizzabili</strong>. Regolazione del tempo di utilizzo e&nbsp;<strong>del livello di compressione</strong>, <strong>Trasportabile</strong>&nbsp;e&nbsp;<strong>autonomo</strong>&nbsp;, consegnato con batterie ricaricabile. Il noleggio crioterapia compressiva permette praticità e mobilità.</p>',
        '<h3><a href="/noleggio-criocompressione-riabilitazione-e-recupero-muscolare/">Come funziona la terapia del freddo ? </a></h3>',
        '<p>Con cryopush, puoi trattare <strong>due zone</strong> contemporaneamente. Ecco perche il Noleggio della crioterapia compressiva è ideale per il trattamento simultaneo. <ins>Il noleggio è ideale per tutti i trattamenti ed è una soluzione versatile per diverse esigenze terapeutiche.</ins></p>',
        '<p>Leggi anche questo articolo : <a href="https://blog.fisioterapistaa.it/la-crioterapia-per-il-recupero-muscolare/">https://blog.fisioterapistaa.it/la-crioterapia-per-il-recupero-muscolare/</a></p>',
        '<p>Vai sul nostro blog e leggi anche : <a href="/infortuni-calcio-ausili-sanitari/">/infortuni-calcio-ausili-sanitari/</a></p>',
        '<h2>Cos&#8217;è cryopush ? </h2>',
        '<p>Il noleggio del sistema per crioterapia con compressione Cryopush offre un’apparecchiatura versatile e facile da utilizzare, che combina la terapia criogenica e la pressoterapia. È ideale nel trattamento di lesioni, traumi e protocolli riabilitativi post operatori e patologie croniche. Facilita l’assorbimento degli edemi. Il sistema&nbsp;<strong>Cryopush</strong>&nbsp;a freddo e compressione contribuisce al recupero di pazienti e atleti, velocizzando e migliorando il processo di guarigione. Riduce il dolore senza farmaci, controlla edema e gonfiore. A sua volta, stimola il flusso sanguigno arterioso, migliora la gamma di movimento, riduce l’acido lattico e accelera i meccanismi di guarigione naturali del corpo. Cryopush offre tanti benefici terapeutici, stimolando la guarigione naturale dei tessuti e migliorando i risultati fisioterapici.</p>',
      ].join(''),
    },
    en: {
      title: 'Cryopush compression cryotherapy, for hire',
      slug: 'noleggio-crioterapia-a-compressione-cryopush',
      shortDescription: 'Hire Professional Cryotherapy (cold therapy) with compression Very easy to use, with very high results in just a few days. Cryopush is the evolution in post-trauma therapy. Free delivery if you purchase a rental for a minimum of 20 days. For shorter rentals home delivery throughout Italy from 15€ + 15€ for collection. No deposit required!',
      metaTitle: 'Cryopush compression cryotherapy hire',
      metaDescription: 'Compression cryotherapy hire with the Cryopush. Free transport, no deposit, available immediately.',
      description: [
        '<p>Cryopush rental: compression cryotherapy that aids in the recovery of patients and athletes, speeding up and improving the process. It reduces pain without medication and controls oedema and swelling. In turn, it stimulates arterial blood flow, improves range of motion, reduces lactic acid and accelerates the body\'s natural healing mechanisms. <ins>Cryopush compressive cryotherapy rental can be beneficial for everyone.</ins></p>',
        '<h3>The benefits of hiring cryotherapy compression : </h3>',
        '<p>Cold therapy rental with compression or compressive cryotherapy offers greater therapeutic benefits and is superior to RICE (Rest, Ice, Compression, Elevation) protocols, stimulating natural tissue healing and improving physiotherapy results. <ins>Using cryopush compressive cryotherapy rental can optimise recovery times.</ins></p>',
        '<p>Cryopush compression rental is simple,&nbsp;<strong>light</strong>&nbsp;e&nbsp;<strong>easy to use</strong>, Cold compresses&nbsp;<strong>removable</strong>&nbsp;e&nbsp;<strong>reusable</strong>. Adjusting the time of use and&nbsp;<strong>of the compression level</strong>, <strong>Transportable</strong>&nbsp;e&nbsp;<strong>autonomous</strong>&nbsp;, supplied with rechargeable batteries. Compressive cryotherapy rental offers convenience and mobility.</p>',
        '<h3><a href="/en/noleggio-criocompressione-riabilitazione-e-recupero-muscolare/">How does cold therapy work? </a></h3>',
        '<p>With cryopush, you can treat <strong>two zones</strong> simultaneously. That is why compressive cryotherapy rental is ideal for simultaneous treatment. <ins>Rental is ideal for all treatments and is a versatile solution for a variety of therapeutic needs.</ins></p>',
        '<p>Read also this article : <a href="https://blog.fisioterapistaa.it/la-crioterapia-per-il-recupero-muscolare/">https://blog.fisioterapistaa.it/la-crioterapia-per-il-recupero-muscolare/</a></p>',
        '<p>Go to our blog and also read : <a href="/en/infortuni-calcio-ausili-sanitari/">/infortuni-calcio-ausili-sanitari/</a></p>',
        '<h2>What is cryopush? </h2>',
        '<p>The Cryopush compression cryotherapy system rental offers versatile, easy-to-use equipment that combines cryogenic therapy and pressotherapy. It is ideal for treating injuries, trauma, post-operative rehabilitation protocols and chronic conditions. It facilitates the absorption of oedema. The system&nbsp;<strong>Cryopush</strong>&nbsp;Cold and compression contribute to the recovery of patients and athletes, speeding up and improving the healing process. It reduces pain without medication and controls oedema and swelling. In turn, it stimulates arterial blood flow, improves range of motion, reduces lactic acid and accelerates the body\'s natural healing mechanisms. Cryopush offers many therapeutic benefits, stimulating natural tissue healing and improving physiotherapy results.</p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: { file: 'cryopush-compression-alt-1.png', alt: { it: 'terapia del freddo con compressione' } },
    gallery: [
      'cryopush-compression-alt-2.jpeg',
      { file: 'cryopush-compression-alt-3.jpeg', alt: { it: 'CRYOPUSH MIA MEDICAL' } },
      'cryopush-compression-alt-4.jpeg',
      { file: 'cryopush-compression-alt-5.png', alt: { it: 'terapia del freddo con compressione' } },
    ],
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
