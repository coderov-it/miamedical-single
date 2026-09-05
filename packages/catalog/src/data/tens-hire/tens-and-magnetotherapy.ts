/**
 * Noleggio Elettrostimolatore TENS + Magnetoterapia
 *
 * /prodotto/elettrostimolatore-e-magnetoterapia/  ·  WooCommerce product 9455.
 *
 * A TENS unit paired with biocompatible CEMP magnetotherapy. Listed under both
 * Magnetoterapia and Tens; filed here after the first device its title names.
 *
 * ⚠️ Ten variations, five durations: each duration appears twice because the
 * electrode pack is a compulsory second axis. The five packages below are the
 * five hire prices; the two electrode packs are add-ons.
 *
 * Delivery 15 € out and 15 € back anywhere in Italy, free from 30 days.
 */

import { days } from '../shared/packages.ts';
import { electrodes, homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { tensHire } from './category.ts';

export const tensAndMagnetotherapy = tensHire.rental({
  code: 'tens-and-magnetotherapy',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(10, 110),  // 10 giorni - 110 € — label (the charged price bundles the compulsory electrode pack)
    days(20, 190),  // 20 giorni - 190 € — label (the charged price bundles the compulsory electrode pack)
    days(30, 220),  // 30 giorni - 220 € — label (the charged price bundles the compulsory electrode pack)
    days(45, 300),  // 45 giorni - 300 € — label (the charged price bundles the compulsory electrode pack)
    days(60, 360),  // 60 giorni - 360 € — label (the charged price bundles the compulsory electrode pack)
  ],

  translations: {
    it: {
      title: 'Noleggio Elettrostimolatore TENS + Magnetoterapia',
      slug: 'elettrostimolatore-e-magnetoterapia',
      shortDescription: 'Noleggio Tens elettrostimolatore abbinato con la Magnetoterapia Cemp bio compatibile Consegna gratuita per i noleggi da 30 giorni, in tutta l’Italia! Per noleggi di durata minore onsegna a domicilio in tutta Italia a partire da 15€ + 15€ per il ritiro. Ricordati di acquistare anche gli elettrodi, necessari per usare l’elettrostimolatore Tens. Nessuna cauzione richiesta!',
      metaTitle: 'Noleggio Tens e Magnetoterapia Cemp',
      metaDescription: 'Noleggio Tens e magnetoterapia Cemp per fisioterapia post traumatica, dolori muscolari e recupero veloce. Chiama 3926509237',
      description: [
        '<p><strong>La soluzione completa per la gestione del dolore e la riabilitazione a domicilio</strong></p>',
        '<p>Il&nbsp;<strong>noleggio combinato TENS elettrostimolatore + magnetoterapia CEMP</strong>&nbsp;rappresenta una soluzione professionale, efficace e flessibile per chi necessita di trattamenti fisioterapici domiciliari, riabilitazione post-traumatica e controllo del dolore muscolare e articolare.</p>',
        '<p>Questa combinazione permette di intervenire su più livelli terapeutici, da un lato il&nbsp;<strong>trattamento antalgico tramite stimolazione nervosa</strong>, dall’altro la&nbsp;<strong>stimolazione dei processi biologici di rigenerazione tissutale</strong>, favorendo un recupero più rapido e completo.</p>',
        '<p>Il tutto senza l’acquisto di dispositivi costosi e con la possibilità di proseguire la terapia per tutto il tempo realmente necessario.</p>',
        '<h2><strong>A chi è indicato il noleggio combinato TENS Elettrostimolatore + Magnetoterapia CEMP</strong></h2>',
        '<p>Il pacchetto è indicato per pazienti che presentano:</p>',
        '<ul><li>dolore muscolare o articolare acuto o cronico</li><li>infiammazioni persistenti</li><li>rigidità muscolare</li><li>patologie osteo-articolari</li><li>esiti post-traumatici</li><li>recupero post-operatorio</li><li>patologie degenerative</li></ul>',
        '<p>La combinazione è adatta sia a pazienti privati sia a fisioterapisti, studi riabilitativi e professionisti sanitari.</p>',
        '<h3><strong>In cosa consiste il noleggio combinato TENS Elettrostimolatore + Magnetoterapia CEMP</strong></h3>',
        '<p>Il pacchetto include due dispositivi elettromedicali professionali utilizzati quotidianamente nei percorsi riabilitativi.</p>',
        '<h4><strong><a href="/catalogo-noleggio/">Magnetoterapia CEMP biocompatibile</a></strong></h4>',
        '<p>La magnetoterapia CEMP (Campi ElettroMagnetici Pulsati) è una terapia fisica che sfrutta campi magnetici a bassa frequenza per stimolare i naturali processi di rigenerazione dell’organismo.</p>',
        '<p><strong>Benefici clinici della magnetoterapia</strong></p>',
        '<ul><li>riduzione dell’infiammazione</li><li>stimolazione della rigenerazione ossea</li><li>miglioramento del trofismo tissutale</li><li>riduzione del dolore</li><li>accelerazione dei tempi di recupero</li></ul>',
        '<p>È particolarmente indicata in caso di:</p>',
        '<ul><li>fratture</li><li>ritardi di consolidamento osseo</li><li>artrosi</li><li>infiammazioni croniche</li><li>edemi</li><li>patologie muscolo-scheletriche</li></ul>',
        '<p><strong>Controindicazioni della magnetoterapia</strong></p>',
        '<p>La magnetoterapia è generalmente ben tollerata, ma è controindicata in presenza di:</p>',
        '<ul><li>pacemaker o dispositivi elettronici impiantati</li><li>patologie tumorali attive</li><li>gravidanza (per precauzione)</li></ul>',
        '<p>È sempre necessario attenersi alle indicazioni del medico e al manuale del dispositivo.</p>',
        '<h4><strong><a href="/catalogo-noleggio/">TENS : Elettrostimolazione Nervosa Transcutanea</a></strong></h4>',
        '<p>La TENS è una terapia antalgica non invasiva che utilizza impulsi elettrici a bassa intensità applicati tramite elettrodi adesivi posizionati sulla cute. Gli impulsi vengono percepiti come una lieve sensazione di formicolio, assolutamente indolore.</p>',
        '<p><strong>Come funziona la TENS</strong></p>',
        '<p>Lo stimolatore consente di modulare:</p>',
        '<ul><li>frequenza dell’impulso</li><li>ampiezza</li><li>intensità</li></ul>',
        '<p>Gli impulsi elettrici:</p>',
        '<ul><li>interferiscono con la trasmissione del dolore verso il sistema nervoso centrale</li><li>stimolano il rilascio di endorfine</li><li>innalzano la soglia del dolore</li><li>riducono spasmi e contratture muscolari</li></ul>',
        '<p><strong>Benefici della terapia TENS</strong></p>',
        '<ul><li>riduzione del dolore acuto e cronico</li><li>effetto analgesico naturale</li><li>rilassamento muscolare</li><li>miglioramento della qualità della vita</li><li>possibilità di utilizzo quotidiano</li></ul>',
        '<p>È particolarmente indicata per:</p>',
        '<ul><li>cervicalgie</li><li>lombalgie</li><li>dolori muscolari</li><li>dolori articolari</li><li>sindromi dolorose croniche</li></ul>',
        '<p><strong>Controindicazioni della TENS</strong></p>',
        '<p>La TENS non deve essere utilizzata in presenza di:</p>',
        '<ul><li>pacemaker o dispositivi elettrici impiantati</li><li>epilessia</li><li>disturbi del ritmo cardiaco</li><li>tumori maligni</li><li>gravi patologie cutanee</li><li>gravidanza (da usare con cautela)</li></ul>',
        '<p>È fondamentale utilizzare la TENS solo dopo valutazione medica o fisioterapica.</p>',
        '<p><strong>Possibili effetti collaterali</strong></p>',
        '<p>Gli effetti collaterali sono generalmente lievi e poco frequenti:</p>',
        '<ul><li>arrossamenti cutanei</li><li>irritazioni da elettrodi</li></ul>',
        '<p>Raramente possono comparire sensazioni sgradevoli o lieve fastidio, solitamente reversibili con la corretta regolazione dei parametri.</p>',
        '<h3><strong>Perché scegliere il noleggio combinato di TENS e MAGNETOTERAPIA</strong></h3>',
        '<p>Il noleggio TENS e magnetoterapia CEMP consente di:</p>',
        '<ul><li>ridurre il dolore in modo naturale e non invasivo</li><li>accelerare il recupero post-traumatico</li><li>effettuare terapie professionali a domicilio</li><li>evitare l’acquisto di dispositivi costosi</li><li>adattare la durata alle reali esigenze cliniche</li></ul>',
        '<p>È una soluzione ideale sia per utilizzo privato sia professionale.</p>',
        '<h4><strong>Consegna, montaggio e ritiro</strong></h4>',
        '<ul><li>Consegna gratuita in tutta Italia per noleggi da 30 giorni</li><li>Consegna a domicilio in tutta Italia a partire da 15 € + 15 € per il ritiro</li><li>Nessuna cauzione richiesta</li><li>Consegna e Ritiro in magazzino gratuito&nbsp;</li></ul>',
        '<p>La consegna viene effettuata entro 48 ore dalla chiamata, salvo diversa disponibilità.</p>',
        '<p><strong>Formazione e assistenza</strong></p>',
        '<p>Con il noleggio vengono fornite:</p>',
        '<ul><li>istruzioni complete all’utilizzo</li><li>indicazioni terapeutiche di base</li><li>supporto tecnico continuo</li></ul>',
        '<p>Il paziente può svolgere la terapia in modo sicuro, efficace e confortevole direttamente a casa.</p>',
        '<h3><strong>Perché scegliere Mia Medical Italia</strong></h3>',
        '<ul><li>dispositivi elettromedicali professionali certificati</li><li>tecnici esperti e consulenza personalizzata</li><li>consegna rapida in tutta Italia</li><li>prezzi trasparenti</li><li>nessuna cauzione</li><li>assistenza continua durante il noleggio</li></ul>',
        '<p>Scegliere Mia Medical Italia significa affidarsi a un partner competente nel percorso di fisioterapia e riabilitazione domiciliare.</p>',
        '<p>Per informazioni, disponibilità e consulenza personalizzata puoi contattarci telefonicamente al <strong><a href="https://wa.me/393926509237">+ 39 392 6509237</a></strong> oppure scriverci su WhatsApp. Il nostro personale specializzato è sempre a disposizione per aiutarti a individuare la soluzione più adatta alle tue esigenze.</p>',
      ].join(''),
    },
    en: {
      title: 'TENS stimulator + magnetotherapy, combined hire',
      slug: 'elettrostimolatore-e-magnetoterapia',
      shortDescription: 'Rental Tens electrostimulator combined with bio-compatible Cemp Magnetotherapy Free delivery for 30-day rentals, all over Italy! For shorter rentals, home delivery throughout Italy starts at €15 + €15 for collection. Remember to also buy the electrodes, which are needed to use the Tens electro-stimulator. No deposit required!',
      metaTitle: 'TENS and CEMP magnetotherapy hire',
      metaDescription: 'Hire a TENS unit with CEMP magnetotherapy for physiotherapy after an injury, muscle pain and a quicker recovery. Call +39 392 650 9237',
      description: [
        '<p><strong>The complete solution for pain management and rehabilitation at home</strong></p>',
        '<p>The&nbsp;<strong>combined TENS electrostimulator + PEMF magnetotherapy rental</strong>&nbsp;is a professional, effective and flexible solution for those in need of home physiotherapy treatments, post-traumatic rehabilitation and muscle and joint pain control.</p>',
        '<p>This combination allows intervention on multiple therapeutic levels, on the one hand the&nbsp;<strong>antalgic treatment by nerve stimulation</strong>, on the other hand, the&nbsp;<strong>stimulation of biological tissue regeneration processes</strong>, promoting faster and more complete recovery.</p>',
        '<p>All this without the purchase of expensive devices and with the possibility of continuing therapy for as long as is actually necessary.</p>',
        '<h2><strong>The combined rental of TENS Electro-stimulator + CEMP Magnetic Therapy is indicated for whom?</strong></h2>',
        '<p>The package is indicated for patients presenting with:</p>',
        '<ul><li>acute or chronic muscle or joint pain</li><li>persistent inflammations</li><li>muscle stiffness</li><li>osteo-articular pathologies</li><li>post-traumatic outcomes</li><li>post-operative recovery</li><li>degenerative diseases</li></ul>',
        '<p>The combination is suitable for both private patients and physiotherapists, rehabilitation clinics and healthcare professionals.</p>',
        '<h3><strong>What the combined TENS Electrostimulator + PEMF Magnetotherapy rental consists of</strong></h3>',
        '<p>The package includes two professional electro-medical devices used daily in rehabilitation.</p>',
        '<h4><strong><a href="/en/rental-catalog/">Biocompatible PEMF magnetotherapy</a></strong></h4>',
        '<p>Pulsed Electromagnetic Field (PEMF) therapy is a physical therapy that uses low-frequency magnetic fields to stimulate the body\'s natural regeneration processes.</p>',
        '<p><strong>Clinical benefits of magnetotherapy</strong></p>',
        '<ul><li>reduction of inflammation</li><li>stimulation of bone regeneration</li><li>improvement of tissue trophism</li><li>reduction of pain</li><li>acceleration of recovery times</li></ul>',
        '<p>It is particularly suitable for cases of:</p>',
        '<ul><li>fractures</li><li>delays in bone consolidation</li><li>arthrosis</li><li>chronic inflammations</li><li>oedemas</li><li>musculoskeletal pathologies</li></ul>',
        '<p><strong>Contraindications of magnetotherapy</strong></p>',
        '<p>Magnet therapy is generally well-tolerated, but it is contraindicated in the presence of:</p>',
        '<ul><li>pacemakers or implanted electronic devices</li><li>active tumour pathologies</li><li>pregnancy (as a precaution)</li></ul>',
        '<p>You must always follow the doctor\'s instructions and the device manual.</p>',
        '<h4><strong><a href="/en/rental-catalog/">TENS : Transcutaneous Nerve Stimulation</a></strong></h4>',
        '<p>TENS is a non-invasive pain relief therapy that uses low-intensity electrical impulses applied via adhesive electrodes placed on the skin. The impulses are perceived as a mild, completely painless tingling sensation.</p>',
        '<p><strong>How TENS works</strong></p>',
        '<p>The stimulator allows modulation:</p>',
        '<ul><li>Pulse frequency</li><li>width</li><li>Intensity</li></ul>',
        '<p>Electrical impulses:</p>',
        '<ul><li>interfere with the transmission of pain to the central nervous system</li><li>stimulate the release of endorphins</li><li>they raise the pain threshold</li><li>reduce spasms and muscle contractures</li></ul>',
        '<p><strong>Benefits of TENS therapy</strong></p>',
        '<ul><li>reduction of acute and chronic pain</li><li>natural analgesic effect</li><li>muscle relaxation</li><li>improvement in quality of life</li><li>possibility of daily use</li></ul>',
        '<p>It is particularly suitable for:</p>',
        '<ul><li>cervicalgia</li><li>low back pain</li><li>muscle pain</li><li>joint pain</li><li>chronic pain syndromes</li></ul>',
        '<p><strong>Contraindications of TENS</strong></p>',
        '<p>TENS should not be used in the presence of:</p>',
        '<ul><li>pacemakers or implanted electrical devices</li><li>epilepsy</li><li>heart rhythm disorders</li><li>malignant tumours</li><li>severe skin diseases</li><li>pregnancy (use with caution)</li></ul>',
        '<p>It is essential to use TENS only after medical or physiotherapy assessment.</p>',
        '<p><strong>Possible side effects</strong></p>',
        '<p>Side effects are generally mild and infrequent:</p>',
        '<ul><li>skin redness</li><li>electrode irritations</li></ul>',
        '<p>Unpleasant sensations or slight discomfort may appear rarely, usually reversible with the correct adjustment of parameters.</p>',
        '<h3><strong>Why choose combined TENS and magnetic therapy rental</strong></h3>',
        '<p>The TENS and PEMF magnetotherapy rental enables:</p>',
        '<ul><li>reduce pain in a natural and non-invasive way</li><li>accelerate post-traumatic recovery</li><li>performing professional therapies at home</li><li>avoid buying expensive devices</li><li>adapt the duration to actual clinical needs</li></ul>',
        '<p>It is an ideal solution for both private and professional use.</p>',
        '<h4><strong>Delivery, assembly and collection</strong></h4>',
        '<ul><li>Free delivery throughout Italy for rentals from 30 days</li><li>Home delivery throughout Italy from 15 € + 15 € for collection</li><li>No deposit required</li><li>Free delivery and pick-up&nbsp;</li></ul>',
        '<p>Delivery is made within 48 hours of the call, subject to availability.</p>',
        '<p><strong>Training and assistance</strong></p>',
        '<p>With the rental comes</p>',
        '<ul><li>Full instructions for use</li><li>basic therapeutic indications</li><li>continuous technical support</li></ul>',
        '<p>The patient can safely, effectively, and comfortably carry out therapy at home.</p>',
        '<h3><strong>Why choose Mia Medical Italia</strong></h3>',
        '<ul><li>certified professional electromedical devices</li><li>expert technicians and personalised advice</li><li>fast delivery throughout Italy</li><li>transparent prices</li><li>no bail</li><li>continuous assistance during rental</li></ul>',
        '<p>Choosing Mia Medical Italia means relying on a competent partner for home physiotherapy and rehabilitation.</p>',
        '<p>For information, availability, and personalised advice, please call us on <strong><a href="https://wa.me/393926509237">+ 39 392 6509237</a></strong> Or write to us on WhatsApp. Our specialised staff are always on hand to help you find the solution that best suits your needs.</p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: { file: 'tens-and-magnetotherapy-1.jpg', alt: { it: 'combo magneto + tens' } },
    gallery: [
      { file: 'tens-and-magnetotherapy-2.jpg', alt: { it: 'Noleggio ausili per terapia a domicilio' } },
      'tens-and-magnetotherapy-3.jpg',
      'tens-and-magnetotherapy-4.jpg',
      'tens-and-magnetotherapy-5.jpeg',
    ],
  },

  addons: [electrodes('5 x 5 cm', 8), electrodes('9 x 5 cm', 13), homeDeliveryOnly(15), homeCollection(15)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
