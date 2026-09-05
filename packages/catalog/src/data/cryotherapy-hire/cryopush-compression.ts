/**
 * Noleggio Crioterapia compressiva Cryopush
 *
 * /prodotto/noleggio-cryoterapia-compressiva-cryopush/
 * WooCommerce product 12465. Delivery and collection anywhere in Italy; no
 * figures on the page.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { cryotherapyHire } from './category.ts';

export const cryopushCompression = cryotherapyHire.rental({
  code: 'cryopush-compression',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 150),
    days(20, 190),
    days(30, 260),
  ],

  translations: {
    it: {
      title: 'Noleggio Crioterapia compressiva Cryopush',
      slug: 'noleggio-cryoterapia-compressiva-cryopush',
      shortDescription: 'Noleggio Crioterapia (terapia del freddo) professionale con compressione Facilissimo da usare, con altissimi risultati in pochissimi giorni. Cryopush è l’evoluzione nella terapia post traumatica. Consegna e ritiro a domicilio in tutta Italia a partire da 15€ +15€. Gratuito per i noleggi a partire da 30 giorni. Consegna gratis se acquisti un noleggio per un minimo di 20 giorni. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio crioterapia compressiva CRYOPUSH',
      metaDescription: 'CRYOPUSH: il nostro macchinario terapeutico di crioterapia compressiva a noleggio. Disponibilità immediata. Prenota ora, chiamaci al +39 392 65 09 237 !',
      description: [
        '<p>Noleggia CRYOPUSH, il sistema per <strong><a href="https://www.my-personaltrainer.it/benessere/crioterapia.html">crioterapia compressiva</a></strong>, una terapia che combina il <strong>freddo controllato</strong> con la <strong>compressione pneumatica intermittente</strong> per ridurre dolore, infiammazione e gonfiore, accelerando i tempi di recupero muscolare e post-operatorio.</p>',
        '<p><strong>CRYOPUSH</strong> è uno dei dispositivi medicali più avanzati in questo ambito, utilizzato anche da fisioterapisti, sportivi professionisti e centri di riabilitazione. </p>',
        '<h4>A chi può essere utile il servizio di noleggio di crioterapia compressiva </h4>',
        '<p>Il sistema <strong>CRYOPUSH</strong> è ideale per:</p>',
        '<ul><li>Pazienti in fase post-operatoria da interventi a spalla, gamba, ginocchio, anca, caviglia</li><li>Sportivi che vogliono accelerare il recupero muscolare </li><li>Persone che soffrono di traumi, distorsioni, infiammazioni croniche (come tendiniti)</li><li>Fisioterapisti che cercano un dispositivo versatile per la terapia domiciliare </li></ul>',
        '<p>Visita il nostro <a href="/blog/">blog</a> e leggi <a href="/noleggio-criocompressione-riabilitazione-e-recupero-muscolare/">l’articolo</a> dedicato! </p>',
        '<h4>Specifiche Tecniche CryoPush </h4>',
        '<ul><li><strong>Sistema portatile</strong>&nbsp;con compressione pneumatica regolabile</li><li><strong>Funzionamento silenzioso</strong>&nbsp;e intuitivo</li><li><strong>Temperatura del freddo costante e controllata</strong></li><li><strong>Timer integrato</strong>&nbsp;per gestire la durata delle sessioni</li><li><strong>Applicatori anatomici</strong>&nbsp;per ginocchio, spalla, caviglia, anca e zona lombare</li><li><strong>Serbatoio refrigerante</strong>&nbsp;con capacità elevata per un uso prolungato</li><li><strong>Display digitale</strong>&nbsp;per il controllo di temperatura, tempo e livello di compressione</li></ul>',
        '<h4>Perché scegliere il noleggio </h4>',
        '<p>Il noleggio della crioterapia compressiva CRYOPUSH è perfetto per:</p>',
        '<ul><li>Trattamenti post-operatori di breve durata</li><li>Evitare l’acquisto di un dispositivo costoso per un uso limitato</li><li>Avere un supporto professionale direttamente a casa</li><li>Massima flessibilità: puoi noleggiarlo per pochi giorni o settimane</li></ul>',
        '<h4>Perché scegliere il servizio di noleggio Mia Medical</h4>',
        '<p>Con&nbsp;<strong>MIA Medical</strong>&nbsp;hai:</p>',
        '<ul><li><strong>Consegna e ritiro rapidi</strong>&nbsp;a domicilio in tutta Italia</li><li><strong>Assistenza tecnica dedicata</strong>&nbsp;6 giorni su 7</li><li><strong>Igienizzazione e controllo qualità</strong>&nbsp;ad ogni rientro del dispositivo</li><li><strong>Formazione all’uso</strong>&nbsp;e supporto all’attivazione</li><li>Tariffe competitive e trasparenti</li><li>Possibilità di&nbsp;<strong>noleggio con applicatore specifico</strong>&nbsp;per la zona da trattare</li></ul>',
        '<h4><strong>Noleggia ora la crioterapia compressiva CRYOPUSH</strong></h4>',
        '<p>Recupera più velocemente, riduci il dolore e migliora la qualità della tua riabilitazione.&nbsp;<strong>Contattaci subito</strong>&nbsp;per ricevere un preventivo personalizzato e scoprire la disponibilità di CRYOPUSH in base alla tua esigenza.</p>',
      ].join(''),
    },
    en: {
      title: 'Cryopush compression cryotherapy, for hire',
      slug: 'noleggio-cryoterapia-compressiva-cryopush',
      shortDescription: 'Hire Professional Cryotherapy (cold therapy) with compression Very easy to use, with very high results in just a few days. Cryopush is the evolution in post-trauma therapy. Home delivery and collection throughout Italy starting from €15 + €15. Free for rentals of 30 days or more. Free delivery if you purchase a rental for a minimum of 20 days. No deposit required!',
      metaTitle: 'CRYOPUSH compression cryotherapy hire',
      metaDescription: 'CRYOPUSH: our compression cryotherapy machine, for hire. Available immediately — book now or call us.',
      description: [
        '<p>Rent CRYOPUSH, the system for <strong><a href="https://www.my-personaltrainer.it/benessere/crioterapia.html">compression cryotherapy</a></strong>a therapy that combines the <strong>controlled cold</strong> with the <strong>intermittent pneumatic compression</strong> to reduce pain, inflammation and swelling, accelerating muscle and post-operative recovery times.</p>',
        '<p><strong>CRYOPUSH</strong> is one of the most advanced medical devices in this field, also used by physiotherapists, professional athletes and rehabilitation centres. </p>',
        '<h4>To whom the cryotherapy compression rental service may be useful </h4>',
        '<p>The system <strong>CRYOPUSH</strong> is ideal for:</p>',
        '<ul><li>Post-operative patients from shoulder, leg, knee, hip, ankle surgery</li><li>Athletes who want to accelerate muscle recovery </li><li>People suffering from trauma, sprains, chronic inflammation (such as tendonitis)</li><li>Physiotherapists looking for a versatile device for home therapy </li></ul>',
        '<p>Visit our <a href="/en/blog/">blog</a> and read <a href="/en/noleggio-criocompressione-riabilitazione-e-recupero-muscolare/">the article</a> dedicated! </p>',
        '<h4>CryoPush Technical Specifications </h4>',
        '<ul><li><strong>Portable system</strong>&nbsp;with adjustable pneumatic compression</li><li><strong>Silent operation</strong>&nbsp;and intuitive</li><li><strong>Constant and controlled cold temperature</strong></li><li><strong>Integrated timer</strong>&nbsp;to manage session duration</li><li><strong>Anatomical applicators</strong>&nbsp;for knee, shoulder, ankle, hip and lumbar region</li><li><strong>Coolant tank</strong>&nbsp;with high capacity for extended use</li><li><strong>Digital display</strong>&nbsp;for controlling temperature, time and compression level</li></ul>',
        '<h4>Why hire </h4>',
        '<p>The CRYOPUSH compression cryotherapy rental is perfect for:</p>',
        '<ul><li>Short-term post-operative treatments</li><li>Avoiding the purchase of an expensive device for limited use</li><li>Having professional support directly at home</li><li>Maximum flexibility: you can rent it for a few days or weeks</li></ul>',
        '<h4>Why choose the Mia Medical rental service</h4>',
        '<p>With&nbsp;<strong>MIA Medical</strong>&nbsp;you have:</p>',
        '<ul><li><strong>Fast delivery and collection</strong>&nbsp;at home throughout Italy</li><li><strong>Dedicated technical assistance</strong>&nbsp;6 days a week</li><li><strong>Sanitisation and quality control</strong>&nbsp;each time the device is returned</li><li><strong>Usage training</strong>&nbsp;and activation support</li><li>Competitive and transparent tariffs</li><li>Possibility of&nbsp;<strong>rental with specific applicator</strong>&nbsp;for the area to be treated</li></ul>',
        '<h4><strong>Rent the CRYOPUSH compression cryotherapy now</strong></h4>',
        '<p>Recover faster, reduce pain and improve the quality of your rehabilitation.&nbsp;<strong>Contact us now</strong>&nbsp;to receive a customised quote and find out the availability of CRYOPUSH according to your needs.</p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: { file: 'cryopush-compression-1.png', alt: { it: 'Vendita crioterapia compressiva' } },
    gallery: [
      'cryopush-compression-2.png',
      'cryopush-compression-3.png',
      'cryopush-compression-4.png',
      'cryopush-compression-5.png',
      'cryopush-compression-6.png',
      'cryopush-compression-7.png',
      'cryopush-compression-8.png',
      'cryopush-compression-9.png',
      'cryopush-compression-10.png',
      'cryopush-compression-11.png',
    ],
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
