/**
 * Noleggio Ultrasuono GLOBUS Medisound 3000
 *
 * /prodotto/noleggio-ultrasuono-globus-medisound-3000/
 * WooCommerce product 14191. Delivery 15 € out and 15 € back anywhere in Italy,
 * free from 45 days. No deposit.
 *
 * ⚠️ The page's own copy quotes two different daily rates — the category says
 * "a partire da 4,60 € al giorno" and this page's Yoast description says
 * "a partire da 4,00 Euro al giorno". Both are carried where the site puts them.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { ultrasoundHire } from './category.ts';

export const globusMedisound3000 = ultrasoundHire.rental({
  code: 'globus-medisound-3000',
  status: 'active',
  brand: 'Globus',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(20, 120),
    days(30, 150),
    days(45, 200),
    days(60, 280),
    days(90, 420),
  ],

  translations: {
    it: {
      title: 'Noleggio Ultrasuono GLOBUS Medisound 3000',
      slug: 'noleggio-ultrasuono-globus-medisound-3000',
      shortDescription: 'Noleggio Ultrasuono Globus Medisound 3000 Consegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Consegna gratis se acquisti un noleggio per un minimo di 45 giorni. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio Ultrasuono GLOBUS Medisound 3000',
      metaDescription: 'Noleggio Ultrasuono Glubus Medisound 3000 a partire da 4,00 Euro al giorno. Consegna a domicilio. Apparecchi sicuri, affidabili e facili da usare.',
      description: [
        '<p><strong>Scopri il servizio di noleggio del dispositivo GLOBUS Medisound 3000, l’ultrasuonoterapico professionale ideale per trattare il dolore, ridurre l’infiammazione e favorire il recupero funzionale direttamente a casa. </strong></p>',
        '<h3>Cos’è l’Ultrasuonoterapia?</h3>',
        '<p>L’ultrasuonoterapia è una tecnica non invasiva che utilizza onde sonore ad alta frequenza per ottenere effetti terapeutici mirati sui tessuti biologici. Gli ultrasuoni generano un micromassaggio profondo che stimola la circolazione sanguigna, riduce le infiammazioni e accelera la rigenerazione cellulare. È particolarmente indicata per trattare dolori articolari, tendiniti, contratture e lesioni muscolari.</p>',
        '<p>Contattaci ora per una consulenza gratuita, senza impegno, e noleggia oggi stesso il tuo dispositivo professionale per ultrasuonoterapia. Consegna rapida in tutta Italia!</p>',
        '<p>Gli effetti benefici possono essere percepiti già dopo poche sedute, ma per un risultato stabile è consigliato completare un ciclo terapeutico di 10-20 applicazioni, della durata di 10-15 minuti ciascuna. La ripetizione costante consente una progressiva riduzione dell&#8217;infiammazione, un miglioramento della mobilità e una netta attenuazione del dolore.</p>',
        '<h3>Noleggio Ultrasuonoterapico GLOBUS Medisound 3000: caratteristiche del dispositivo</h3>',
        '<p>Il GLOBUS Medisound 3000 è un apparecchio professionale di fascia alta, progettato per l’uso fisioterapico, ambulatoriale e domiciliare.</p>',
        '<p>Tra le sue <strong>principali caratteristiche tecniche</strong>:</p>',
        '<ul><li><strong>49 programmi preimpostati</strong> per patologie specifiche</li><li><strong>Emissione continua e pulsata</strong> per trattamenti personalizzati</li><li><strong>Trattamento a contatto o in immersione</strong></li><li><strong>Display retroilluminato</strong> e comandi intuitivi</li><li><strong>Manipolo ergonomico</strong> da 1 MHz per azione in profondità</li><li><strong>Struttura compatta</strong> e trasportabile</li><li><strong>Alimentazione da rete elettrica</strong>, per sedute anche prolungate</li></ul>',
        '<h3>A chi è utile il noleggio di GLOBUS Medisound 3000</h3>',
        '<p>Le patologie trattabili con Medisound 3000 sono varie, tra cui:</p>',
        '<ul><li><strong>Tendiniti e borsiti</strong> (spalla, gomito, ginocchio)</li><li><strong>Esiti di fratture ossee</strong> e traumi articolari</li><li><strong>Contratture e lesioni muscolari</strong></li><li><strong>Artrosi e patologie articolari croniche</strong></li><li><strong>Rigidità articolare</strong></li><li><strong>Infiammazioni post-operatorie o post-infortunio</strong></li></ul>',
        '<h3>Benefici dell’Ultrasuonoterapia con GLOBUS Medisound 3000</h3>',
        '<ul><li><strong>Riduzione del dolore</strong> in modo naturale e non invasivo</li><li><strong>Effetto antinfiammatorio profondo</strong></li><li><strong>Miglioramento della mobilità articolare</strong></li><li><strong>Recupero più rapido dopo traumi e interventi</strong></li><li><strong>Stimolazione del metabolismo tissutale</strong></li><li><strong>Nessun uso di farmaci</strong> durante il trattamento</li></ul>',
        '<h3>Come funziona il trattamento: emissione continua o pulsata?</h3>',
        '<p>Il Medisound 3000 consente di selezionare tra <strong>emissione continua</strong> (effetto termico profondo) o <strong>emissione pulsata</strong> (azione anti-edemigena e rigenerativa), a seconda delle necessità terapeutiche.</p>',
        '<p><strong>Quando usare l’emissione continua:</strong></p>',
        '<ul><li>Patologie croniche</li><li>Rigidità articolare</li><li>Contratture profonde<br />Genera calore endogeno, rilassa i tessuti e favorisce l’irrorazione sanguigna.</li></ul>',
        '<p><strong>Quando usare l’emissione pulsata:</strong></p>',
        '<ul><li>Infiammazioni acute</li><li>Tendiniti</li><li>Lesioni muscolari recenti<br />Ideale per trattare tessuti infiammati senza surriscaldarli.</li></ul>',
        '<p><strong>Trattamento a contatto</strong>: si utilizza con gel conduttivo sulla pelle.<br /><strong>Trattamento in immersione</strong>: perfetto per zone piccole e irregolari (mani, piedi), da svolgere con la parte immersa in acqua insieme al manipolo.</p>',
        '<h3>Consiglio dell’esperto:</h3>',
        '<p>In caso di dubbi sull’impostazione più adatta, chiedi sempre consiglio al tuo fisioterapista o contatta il nostro team. Scegliere correttamente il programma e la modalità è fondamentale per ottenere i <strong>migliori risultati terapeutici</strong>.</p>',
        '<h3>Controindicazioni e Possibili Effetti Collaterali</h3>',
        '<p>ATTENZIONE: L’utilizzo del Medisound 3000 è <strong>CONTROINDICATO</strong> nei seguenti casi:</p>',
        '<ul><li><strong>Portatori di pacemaker</strong></li><li><strong>Gravidanza</strong></li><li><strong>Patologie tumorali attive</strong></li><li><strong>Infezioni locali o ferite aperte</strong></li><li><strong>Tromboflebiti in fase attiva</strong></li></ul>',
        '<p><strong>Possibili effetti collaterali:</strong></p>',
        '<ul><li>Rossore o lieve irritazione cutanea temporanea</li><li>Sensazione di calore o affaticamento muscolare</li><li>Raramente malesseri transitori in soggetti sensibili</li></ul>',
        '<p>È sempre consigliato consultare un medico prima dell’utilizzo.</p>',
        '<h3>Il Servizio di Noleggio di Mia Medical Italia: la tua salute al primo posto</h3>',
        '<p>Il noleggio del GLOBUS Medisound 3000 rappresenta una <strong>soluzione sicura, conveniente e flessibile</strong> per chi desidera effettuare un ciclo di trattamenti a casa o testare il dispositivo prima di un eventuale acquisto.</p>',
        '<p>Con <strong>Mia Medical Italia</strong>, hai accesso a un servizio completo e professionale:</p>',
        '<ul><li><strong>Dispositivi certificati e garantiti</strong></li><li><strong>Consulenza gratuita e personalizzata</strong></li><li><strong>Assistenza clienti dedicata</strong></li><li><strong>Consegna rapida in tutta Italia</strong></li><li><strong>Supporto all’uso e istruzioni dettagliate</strong></li></ul>',
        '<p><strong>Cosa aspetti? Riduci l’infiammazione, elimina il dolore e recupera in autonomia: scegli il servizio di noleggio del Medisound 3000.</strong><br />Contattaci ora al <strong>+39 392 65 09 237</strong> per ricevere tutte le informazioni o per prenotare subito il tuo dispositivo!</p>',
      ].join(''),
    },
    en: {
      title: 'GLOBUS Medisound 3000 ultrasound, for hire',
      slug: 'noleggio-ultrasuono-globus-medisound-3000',
      shortDescription: 'Globus Medisound 3000 Ultrasound Hire Home delivery throughout Italy from 15€ + 15€ for collection. Free delivery if you purchase a rental for a minimum of 45 days. No deposit required!',
      metaTitle: 'GLOBUS Medisound 3000 ultrasound hire',
      metaDescription: 'Globus Medisound 3000 ultrasound hire from €4.00 a day, delivered to your door. Safe, reliable machines that are easy to use.',
      description: [
        '<p><strong>Discover the rental service for the GLOBUS Medisound 3000 device, the ideal professional ultrasound therapy unit for treating pain, reducing inflammation and promoting functional recovery directly at home. </strong></p>',
        '<h3>What is Ultrasound Therapy?</h3>',
        '<p>Ultrasound therapy is a non-invasive technique that uses high-frequency sound waves to achieve targeted therapeutic effects on biological tissues. Ultrasound generates a deep micromassage that stimulates blood circulation, reduces inflammation and accelerates cell regeneration. It is particularly suitable for treating joint pain, tendonitis, contractures and muscle injuries.</p>',
        '<p>Contact us now for a free, no-obligation consultation and rent your professional ultrasound therapy device today. Fast delivery throughout Italy!</p>',
        '<p>The beneficial effects can be felt after just a few sessions, but for a stable result it is recommended to complete a therapy cycle of 10-20 applications, lasting 10-15 minutes each. Constant repetition leads to a progressive reduction in inflammation, improved mobility and a clear alleviation of pain.</p>',
        '<h3>GLOBUS Medisound 3000 ultrasound rental: device features</h3>',
        '<p>The GLOBUS Medisound 3000 is a high-end professional device designed for physiotherapy, outpatient and home use.</p>',
        '<p>Among its <strong>main technical features</strong>:</p>',
        '<ul><li><strong>49 preset programmes</strong> for specific pathologies</li><li><strong>Continuous and pulsed emission</strong> for customised treatments</li><li><strong>Contact or immersion treatment</strong></li><li><strong>Backlit display</strong> and intuitive controls</li><li><strong>Ergonomic handpiece</strong> 1 MHz for deep action</li><li><strong>Compact design</strong> and transportable</li><li><strong>Mains power supply</strong>for even prolonged sessions</li></ul>',
        '<h3>Who benefits from hiring GLOBUS Medisound 3000</h3>',
        '<p>The pathologies that can be treated with Medisound 3000 are varied, including:</p>',
        '<ul><li><strong>Tendinitis and bursitis</strong> (shoulder, elbow, knee)</li><li><strong>Bone fracture outcomes</strong> and joint traumas</li><li><strong>Muscle contractures and injuries</strong></li><li><strong>Arthrosis and chronic joint disease</strong></li><li><strong>Joint stiffness</strong></li><li><strong>Post-operative or post-injury inflammation</strong></li></ul>',
        '<h3>Benefits of Ultrasound Therapy with GLOBUS Medisound 3000</h3>',
        '<ul><li><strong>Pain reduction</strong> in a natural and non-invasive way</li><li><strong>Deep anti-inflammatory effect</strong></li><li><strong>Improved joint mobility</strong></li><li><strong>Faster recovery after trauma and surgery</strong></li><li><strong>Stimulation of tissue metabolism</strong></li><li><strong>No use of drugs</strong> during treatment</li></ul>',
        '<h3>How does the treatment work: continuous or pulsed emission?</h3>',
        '<p>The Medisound 3000 allows you to select between <strong>continuous issue</strong> (deep thermal effect) or <strong>pulsed emission</strong> (anti-oedemigenous and regenerative action), depending on therapeutic needs.</p>',
        '<p><strong>When to use continuous emission</strong></p>',
        '<ul><li>Chronic pathologies</li><li>Joint stiffness</li><li>Deep contractures<br />It generates endogenous heat, relaxes tissues and promotes blood circulation.</li></ul>',
        '<p><strong>When to use pulsed emission</strong></p>',
        '<ul><li>Acute inflammation</li><li>Tendinitis</li><li>Recent muscle injuries<br />Ideal for treating inflamed tissue without overheating it.</li></ul>',
        '<p><strong>Contact treatment</strong>is used with conductive gel on the skin.<br /><strong>Immersion treatment</strong>perfect for small and irregular areas (hands, feet), to be performed with the part immersed in water together with the handpiece.</p>',
        '<h3>Expert\'s advice:</h3>',
        '<p>If in doubt about the most suitable setting, always ask your physiotherapist for advice or contact our team. Choosing the right programme and modality is crucial to achieving the <strong>better therapeutic results</strong>.</p>',
        '<h3>Contraindications and Possible Side Effects</h3>',
        '<p>WARNING: Use of the Medisound 3000 is <strong>CONTRAINDICATED</strong> in the following cases:</p>',
        '<ul><li><strong>Pacemaker wearers</strong></li><li><strong>Pregnancy</strong></li><li><strong>Active tumour pathologies</strong></li><li><strong>Local infections or open wounds</strong></li><li><strong>Thrombophlebitis in active phase</strong></li></ul>',
        '<p><strong>Possible side effects:</strong></p>',
        '<ul><li>Redness or slight temporary skin irritation</li><li>Sensation of heat or muscle fatigue</li><li>Rarely transient discomfort in sensitive individuals</li></ul>',
        '<p>It is always recommended to consult a doctor before use.</p>',
        '<h3>Mia Medical Italia\'s Rental Service: your health comes first</h3>',
        '<p>Hiring the GLOBUS Medisound 3000 represents a <strong>safe, cost-effective and flexible solution</strong> for those who wish to carry out a course of treatments at home or test the device before a possible purchase.</p>',
        '<p>With <strong>Mia Medical Italia</strong>you have access to a comprehensive and professional service:</p>',
        '<ul><li><strong>Certified and guaranteed devices</strong></li><li><strong>Free, personalised counselling</strong></li><li><strong>Dedicated customer support</strong></li><li><strong>Fast delivery throughout Italy</strong></li><li><strong>Usage support and detailed instructions</strong></li></ul>',
        '<p><strong>What are you waiting for? Reduce inflammation, eliminate pain and recover independently: choose the Medisound 3000 rental service.</strong><br />Contact us now at <strong>+39 392 65 09 237</strong> to receive all the information or to book your device now!</p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: 'globus-medisound-3000-1.png',
  },

  addons: [homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
