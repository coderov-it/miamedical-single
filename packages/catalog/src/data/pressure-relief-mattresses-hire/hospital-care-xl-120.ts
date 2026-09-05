/**
 * Noleggio Materasso Antidecubito 120cm ad Alto Rischio Hospital Care XL
 *
 * /prodotto/materasso-antidecubito-hospital-care-xl/
 * WooCommerce product 15053 — the 120 cm mattress, rated to stage 4 and to
 * 340 kg, the highest therapeutic load in the catalogue. Also sold outright, as
 * `pressure-relief-mattresses-sale/hospital-care-xl`.
 *
 * Same compulsory 150 € mattress protector.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { pressureReliefMattressesHire } from './category.ts';

export const hospitalCareXl120 = pressureReliefMattressesHire.rental({
  code: 'hospital-care-xl-120',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(15, 130),
    days(30, 210),
    days(45, 292),
    days(60, 360),
    days(90, 450),
  ],

  translations: {
    it: {
      title: 'Noleggio Materasso Antidecubito 120cm ad Alto Rischio Hospital Care XL',
      slug: 'materasso-antidecubito-hospital-care-xl',
      shortDescription: 'Noleggio Materasso Antidecubito Hospital Care XL (120cm) Noleggio del Materasso ad Alto Rischio per decubito fino al 4° stadio. Portata fino a 340KG. Materasso anti-decubito disponibile anche in vendita. Noleggialo con consegna a domicilio in tutta Italia! Consegna per il noleggio: 45€ consegna + 45€ ritiro. Il ritiro in magazzino è gratuito. Per motivi igienici, è obbligatorio acquistare la copertura del materasso a 150€.',
      metaTitle: 'Materasso Antidecubito Alto Rischio 120cm | Noleggio',
      metaDescription: 'Noleggio materasso antidecubito ad alto rischio HOSPITAL CARE XL. Indicato per la prevenzione e cura delle piaghe da decubito Portata 340 kg.',
      description: [
        '<p>Hai bisogno di una soluzione avanzata per un paziente allettato con esigenze cliniche elevate? Il <strong>materasso antidecubito ad alto rischio HOSPITAL CARE XL</strong> è progettato per garantire <strong>massima sicurezza, comfort e protezione cutanea</strong>, anche nei casi più complessi.</p>',
        '<p>Ideale sia per la <strong>prevenzione</strong> che per la <strong>cura delle ulcere da pressione fino al IV stadio</strong>, questo materasso rappresenta una scelta eccellente per l’assistenza domiciliare e ospedaliera.</p>',
        '<h2>Cos’è un Materasso Antidecubito?</h2>',
        '<p>Il <strong>materasso antidecubito</strong> è un dispositivo medico studiato per ridurre in modo significativo la pressione esercitata sul corpo, prevenendo la formazione delle piaghe da decubito e favorendo il recupero dei tessuti già lesionati.</p>',
        '<p>È particolarmente indicato per pazienti con <strong>mobilità ridotta o assente</strong>, costretti a letto per periodi prolungati, grazie a sistemi di <strong>pressione alternata e gestione intelligente dell’aria</strong>.</p>',
        '<h2>A Cosa Serve il Materasso HOSPITAL CARE XL?</h2>',
        '<p>Il modello <strong>HOSPITAL CARE XL</strong> utilizza un sistema ad aria a tutto spessore, <strong>senza necessità di un materasso aggiuntivo</strong>, ed è progettato per ridurre la pressione nelle zone più sensibili del corpo, come:</p>',
        '<ul><li>Zona sacrale e lombare</li><li>Schiena e tronco</li><li>Talloni e caviglie</li><li>Gomiti e scapole</li></ul>',
        '<p>Grazie alla <strong>micro-cessione d’aria nella zona del tronco</strong>, contribuisce a mantenere la pelle asciutta e a ridurre il rischio di macerazioni e infezioni.</p>',
        '<p>È indicato sia per pazienti ad <strong>altissimo rischio</strong> sia per chi presenta già <strong>lesioni da pressione in stadio avanzato</strong>.</p>',
        '<h2>I 4 Stadi delle Piaghe da Decubito</h2>',
        '<ul><li><strong>I Stadio:</strong> arrossamento persistente della pelle integra</li><li><strong>II Stadio:</strong> lesione superficiale con interessamento del derma</li><li><strong>III Stadio:</strong> perdita di tessuto a tutto spessore con coinvolgimento sottocutaneo</li><li><strong>IV Stadio:</strong> lesione profonda che interessa muscoli, ossa e/o articolazioni</li></ul>',
        '<p>Il materasso <strong>HOSPITAL CARE XL</strong> è adatto alla gestione di <strong>tutti e quattro gli stadi</strong>, inclusi i casi più gravi.</p>',
        '<h2>A Chi È Consigliato?</h2>',
        '<p>Il materasso antidecubito HOSPITAL CARE XL è particolarmente indicato per:</p>',
        '<ul><li>Pazienti allettati a lungo termine</li><li>Anziani con mobilità fortemente ridotta</li><li>Pazienti post-operatori complessi</li><li>Persone con disabilità neurologiche o muscolari</li><li>Pazienti oncologici o in cure palliative</li><li>Pazienti bariatrici, grazie all’elevata portata terapeutica</li></ul>',
        '<p>Il <strong>noleggio</strong> rappresenta una soluzione pratica, rapida ed efficace per garantire assistenza di alto livello senza un investimento definitivo.</p>',
        '<h2>Perché Scegliere il Materasso Antidecubito HOSPITAL CARE XL</h2>',
        '<ul><li>Supporta pazienti fino a <strong>340 kg</strong></li><li>Riduce la pressione cutanea fino al IV stadio</li><li>Favorisce la circolazione sanguigna e la rigenerazione dei tessuti</li><li>Garantisce elevati standard di igiene e sicurezza</li><li>Progettato per utilizzo intensivo in ambito clinico</li></ul>',
        '<h2><a href="https://www.wimed.it/prodotti/antidecubito/hospital-care-xl-3/#1527600285871-61c0b829-41a7d64c-f4fba9f2-89fb">Come Funziona il Materasso Antidecubito HOSPITAL CARE XL</a></h2>',
        '<p>Il sistema è gestito da un <strong>compressore avanzato</strong> che regola automaticamente il gonfiaggio delle celle, consentendo:</p>',
        '<ul><li>Distribuzione uniforme del peso corporeo</li><li>Riduzione dei punti di pressione prolungata</li><li>Migliore ossigenazione dei tessuti</li><li>Maggiore comfort per il paziente</li></ul>',
        '<p>La funzione <strong>“Zero Pressione”</strong> permette di azzerare temporaneamente la pressione nelle aree lesionate, mentre la funzione <strong>P Max</strong> facilita l’assistenza da parte del personale sanitario durante le manovre sul paziente.</p>',
        '<h2>Hai Bisogno di un Materasso Antidecubito ad Alto Rischio</h2>',
        '<p>Il <strong>noleggio del materasso HOSPITAL CARE XL</strong> è una soluzione professionale, sicura e flessibile per affrontare situazioni cliniche complesse.</p>',
        '<p>📞 <strong>Contattaci</strong>: il nostro team ti aiuterà a scegliere il dispositivo più adatto alle esigenze del paziente.</p>',
      ].join(''),
    },
    en: {
      title: 'Hospital Care XL 120 cm high-risk pressure-relief mattress, for hire',
      slug: 'materasso-antidecubito-hospital-care-xl',
      shortDescription: 'Hospital Care XL Antidecubitus Mattress Hire (120cm) Rental of the High-risk mattress for pressure sores up to stage 4. Scope up to 340KG. Anti-decubitus mattress also available for sale. Rent it with home delivery throughout Italy! Delivery for hire: €45 delivery + €45 collection. Pick-up at the warehouse is free. For hygiene reasons, it compulsory purchase of the mattress protector for €150.',
      metaTitle: 'High-risk 120 cm pressure-relief mattress | Hire',
      metaDescription: 'Hire the HOSPITAL CARE XL high-risk pressure-relief mattress, for preventing and treating pressure sores. Rated to 340 kg.',
      description: [
        '<p>Need an advanced solution for a bedridden patient with high clinical needs? The <strong>HOSPITAL CARE XL high-risk anti-decubitus mattress</strong> it is designed to ensure <strong>maximum safety, comfort and skin protection</strong>, even in the most complex cases.</p>',
        '<p>Ideal for both <strong>prevention</strong> than for the <strong>treatment of pressure ulcers up to stage IV</strong>, this mattress represents an excellent choice for home and hospital care.</p>',
        '<h2>What is a Pressure Relief Mattress?</h2>',
        '<p>The <strong>anti-decubitus mattress</strong> it is a medical device designed to significantly reduce the pressure exerted on the body, preventing the formation of pressure sores and promoting the recovery of already damaged tissue.</p>',
        '<p>It is particularly suitable for patients with <strong>reduced or no mobility</strong>, bedridden for prolonged periods, thanks to <strong>alternating pressure and intelligent air management</strong>.</p>',
        '<h2>What is the HOSPITAL CARE XL Mattress for?</h2>',
        '<p>The model <strong>HOSPITAL CARE XL</strong> uses a full-thickness air system, <strong>without the need for an additional mattress</strong>, and it is designed to reduce pressure in the most sensitive areas of the body, such as:</p>',
        '<ul><li>Sacral and lumbar area</li><li>Back and torso</li><li>Heels and ankles</li><li>Elbows and shoulder blades</li></ul>',
        '<p>Thanks to the <strong>micro-air leak in the trunk area</strong>, It helps to keep the skin dry and reduce the risk of maceration and infection.</p>',
        '<p>It is indicated both for patients with <strong>very high risk</strong> both for those already presenting <strong>advanced pressure injuries</strong>.</p>',
        '<h2>The 4 Stages of Pressure Sores</h2>',
        '<ul><li><strong>I Stage:</strong> persistent reddening of intact skin</li><li><strong>Stage II:</strong> superficial lesion with dermal involvement</li><li><strong>Stage III:</strong> full-thickness tissue loss with subcutaneous involvement</li><li><strong>Stage IV:</strong> deep injury affecting muscles, bones and/or joints</li></ul>',
        '<p>The mattress <strong>HOSPITAL CARE XL</strong> it is suitable for managing <strong>all four stages</strong>, including the most severe cases.</p>',
        '<h2>Who is it recommended for?</h2>',
        '<p>The HOSPITAL CARE XL anti-decubitus mattress is particularly suitable for:</p>',
        '<ul><li>Long-term bedridden patients</li><li>Elderly people with severely limited mobility</li><li>Complex post-operative patients</li><li>People with neurological or muscular disabilities</li><li>Oncological or palliative care patients</li><li>Bariatric patients, thanks to the high therapeutic flow rate</li></ul>',
        '<p>The <strong>rental</strong> is a practical, fast and effective solution to ensure a high level of care without a definitive investment.</p>',
        '<h2>Why Choose the HOSPITAL CARE XL Pressure Relief Mattress</h2>',
        '<ul><li>Supports patients up to <strong>340 kg</strong></li><li>Reduces skin pressure up to stage IV</li><li>Promotes blood circulation and tissue regeneration</li><li>Ensures high standards of hygiene and safety</li><li>Designed for intensive use in clinical settings</li></ul>',
        '<h2><a href="https://www.wimed.it/prodotti/antidecubito/hospital-care-xl-3/#1527600285871-61c0b829-41a7d64c-f4fba9f2-89fb">How the HOSPITAL CARE XL Antidecubitus Mattress Works</a></h2>',
        '<p>The system is managed by a <strong>advanced compressor</strong> which automatically adjusts the inflation of the cells, allowing</p>',
        '<ul><li>Uniform body weight distribution</li><li>Reduction of prolonged pressure points</li><li>Improved tissue oxygenation</li><li>Increased patient comfort</li></ul>',
        '<p>The function <strong>“Zero Pressure”</strong> allows the pressure in the injured areas to be temporarily reduced to zero, while the <strong>P Max</strong> it makes it easier for healthcare staff to assist during procedures on the patient.</p>',
        '<h2>Need a High Risk Antidecubitus Mattress</h2>',
        '<p>The <strong>rental of the HOSPITAL CARE XL mattress</strong> It is a professional, safe and flexible solution for addressing complex clinical situations.</p>',
        '<p>📞 <strong>Contact us</strong>our team will help you choose the most suitable device for the patient\'s needs.</p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 340,
    'pressure-ulcer-stage': 'stage-4',
    'has-compressor': true,
  },

  media: {
    thumbnail: 'hospital-care-xl-120-1.png',
  },

  addons: [homeDelivery(45)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
