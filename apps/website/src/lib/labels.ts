/**
 * The storefront's display labels: English key in, Italian words out.
 *
 * Code holds English identifiers only — that is the project rule — so every
 * Italian word a customer reads on the checkout is here and nowhere else. A
 * component asks for `t('storePickup')`; it never contains the string
 * "Ritiro in sede".
 *
 * Keys with no `it` entry fall back to their `en` entry, then to the key
 * humanised (`sameAddress` → "Same address"), so a missing translation degrades
 * instead of blanking a page. The mechanism and that fallback order live in
 * `@mia/i18n`'s `createLabels`; this file is only the catalog.
 *
 * `{placeholder}` slots are filled by the second argument: `t('branchIn', { city })`.
 */
import { createLabels } from '@mia/i18n';
import type { LanguageCode } from '@mia/validators';

/**
 * The storefront is Italian-only, so this is a constant rather than a request
 * value — but it is threaded explicitly all the same, so adding an English
 * storefront later is a matter of passing a different value, not of hunting down
 * hardcoded Italian. Same reasoning as `LOCALE` in `api.ts`.
 */
const LOCALE: LanguageCode = 'it';

const STOREFRONT_LABELS = {
  // -- shared vocabulary ---------------------------------------------------
  yes: { it: 'Sì' },
  no: { it: 'No' },
  /** A per-unit price modifier, e.g. "0,25 € per cm". */
  perUnitNote: { it: '{amount} per {unit}' },
  /** Used when a numeric variant group declares no unit of its own. */
  unitFallback: { it: 'unità' },

  // -- catalogue browse context (carried over from the home search) --------
  /** "dal 01/09/2026" — the requested start date, echoed on the catalogue. */
  fromDateContext: { it: 'dal {date}' },
  durationOneWeek: { it: 'per 1 settimana' },
  durationOneMonth: { it: 'per 1 mese' },
  durationDays: { it: 'per {count} giorni' },

  // -- page chrome ---------------------------------------------------------
  checkout: { it: 'Checkout' },
  checkoutMetaTitle: { it: 'Checkout | Mia Medical Italia' },
  checkoutMetaDescription: {
    it: 'Completa la tua richiesta di noleggio: dati, consegna e conferma.',
  },
  home: { it: 'Home' },
  yourRequest: { it: 'La tua richiesta' },

  // -- steps ---------------------------------------------------------------
  yourDetails: { it: 'I tuoi dati' },
  delivery: { it: 'Consegna' },
  confirmRequest: { it: 'Conferma la richiesta' },
  edit: { it: 'Modifica' },
  continueToDelivery: { it: 'Continua con la consegna' },
  continueToConfirmation: { it: 'Continua alla conferma' },

  // -- step 1: identity ----------------------------------------------------
  firstName: { it: 'Nome' },
  lastName: { it: 'Cognome' },
  address: { it: 'Indirizzo' },
  email: { it: 'Email' },
  phoneNumber: { it: 'Numero di telefono' },
  iAmA: { it: 'Sono un' },
  private: { it: 'Privato' },
  company: { it: 'Azienda' },
  tourist: { it: 'Turista' },
  codiceFiscale: { it: 'Codice fiscale' },
  partitaIva: { it: 'Partita IVA' },
  companyCodiceFiscale: { it: 'Codice fiscale dell’azienda' },
  comments: { it: 'Note' },
  optionalSuffix: { it: '(facoltative)' },

  // Example values, not instructions — a placeholder is a hint, never a label.
  placeholderFirstName: { it: 'Mario' },
  placeholderLastName: { it: 'Rossi' },
  placeholderEmail: { it: 'mario.rossi@example.com' },
  placeholderPhone: { it: '+39 333 000 0000' },
  placeholderCodiceFiscale: { it: 'RSSMRA80A01H501X' },
  placeholderPartitaIva: { it: 'IT01234567890' },
  placeholderCompanyCodiceFiscale: { it: '01234567890' },
  placeholderComments: { it: 'Qualcosa che dovremmo sapere' },

  // -- step 2: delivery ----------------------------------------------------
  /* Step 2 asks two questions and they are not the same one: where it GOES, and
     where it comes back FROM. These name the two halves; they only appear when
     there is a rental, because a purchase has no second half. */
  deliveryStage: { it: 'Consegna' },
  returnStage: { it: 'Riconsegna a fine noleggio' },
  /* The default, and its wording follows the chosen method — a home delivery is
     collected from an address, a branch collection is brought back to a sede. */
  returnSameAddress: { it: 'Ritiriamo allo stesso indirizzo' },
  returnSameBranch: { it: 'Riconsegna alla stessa sede' },
  returnAddressLabel: { it: 'Indirizzo per il ritiro' },
  placeholderReturnAddress: { it: 'Via Roma 12, 00184 Roma' },
  deliveryAndPickup: { it: 'Consegna e ritiro' },
  /* One delivery option, and its wording says so: a hotel, una casa vacanze and a
     home are all just addresses. There used to be a separate `hotelDelivery`. */
  homeDelivery: { it: 'Consegna e ritiro all’indirizzo che indichi' },
  homeDeliveryDetail: {
    it: 'A casa, in hotel o in casa vacanze — consegniamo e ritiriamo dove ti serve',
  },
  homeDeliveryShort: { it: 'Consegna a domicilio' },
  storePickup: { it: 'Ritiro in sede' },
  storePickupDetail: { it: 'Ritiro e riconsegna in una delle nostre sedi' },
  storePickupShort: { it: 'Ritiro in sede' },
  free: { it: 'Gratis' },
  deliveryAddress: { it: 'Indirizzo di consegna' },
  /* An example, like every other placeholder here — never instructions, and never
     the multi-line address it once was: three lines of grey text sitting in an
     empty box read as an answer somebody had already given. One line shows the
     shape without pretending to be content. Nothing parses what is typed. */
  placeholderDeliveryAddress: { it: 'Via Roma 12, int. 3, 88040 Amato (CZ)' },
  /* NOTHING PRICES DELIVERY. There is no fee to show at any point in this form, so
     these two say so in words rather than showing a figure — a zero would read as
     free, which is the one thing the delivery is not.

     The long form goes on the delivery card, where there is room to promise the
     next step. The short one goes in the totals column beside an amount, and it is
     the same "da concordare" the cart and the WhatsApp handover already use. */
  deliveryFeeOnRequest: { it: 'Ti contattiamo per il costo di consegna' },
  deliveryPending: { it: 'Da concordare' },
  choosePickupPoint: { it: 'Scegli dove ritirare e riconsegnare:' },
  branchIn: { it: 'Sede di {city}' },

  // -- step 3: confirmation ------------------------------------------------
  contact: { it: 'Contatto' },
  noPaymentNow: { it: 'Nessun pagamento adesso' },
  noPaymentNowDetail: {
    it: 'Ti scriviamo su WhatsApp per concordare il pagamento e per qualsiasi altra cosa ti serva.',
  },
  /* The no-JavaScript label, still on the server-rendered <a>. The script swaps
     both the words and the behaviour: with JavaScript the button records the
     order first and hands over to WhatsApp after. */
  sendOrderOnWhatsApp: { it: 'Invia l’ordine su WhatsApp' },
  sendRequest: { it: 'Invia la richiesta' },
  sendingRequest: { it: 'Invio in corso…' },
  termsNoticeBefore: { it: 'Inviando l’ordine accetti le nostre' },
  rentalTerms: { it: 'condizioni di noleggio' },
  requestSent: { it: 'Richiesta inviata' },
  requestSentDetail: {
    it: 'Abbiamo la tua richiesta. Ti contattiamo su WhatsApp a breve per confermare la disponibilità e concordare consegna e pagamento.',
  },
  /** The reference an operator opens the phone call with. */
  requestNumber: { it: 'Numero richiesta' },
  requestTotalEstimate: { it: 'Totale indicativo' },
  continueOnWhatsApp: { it: 'Continua su WhatsApp' },
  /* Said when the POST fails. It does not tell the customer to start again: the
     WhatsApp message below it already carries their whole request, so the honest
     next step is the one that still works. */
  requestFailed: { it: 'Non siamo riusciti a registrare la richiesta' },
  requestFailedDetail: {
    it: 'Puoi riprovare, oppure inviarcela su WhatsApp: il messaggio è già pronto con tutti i dettagli.',
  },
  retry: { it: 'Riprova' },
  /* The package gate. A rental IS its package, so a line without one has no price
     at all — the confirm step says so and sends the customer back to the one page
     where they can pick it. */
  packageMissing: { it: 'Manca il pacchetto di noleggio' },
  packageMissingDetail: {
    it: 'Il prezzo del noleggio dipende dal pacchetto: senza sceglierne uno non possiamo calcolare un totale. Scegli la durata e torna qui — oppure chiamaci e la scegliamo insieme.',
  },
  pickPackage: { it: 'Scegli il pacchetto' },
  /* A line that never made a required choice. The API refuses it, so the page says
     which choice is missing instead of offering a button that cannot work. */
  configurationIncomplete: { it: 'Manca una scelta obbligatoria' },
  configurationIncompleteDetail: {
    it: 'Per {product} serve ancora: {missing}. Completa la scelta e torna qui — oppure chiamaci e la facciamo insieme.',
  },
  completeConfiguration: { it: 'Completa la scelta' },
  thanksName: { it: 'Grazie {name}!' },
  thanks: { it: 'Grazie!' },
  collectedAtBranch: { it: 'Ritiro e riconsegna presso la sede di {city}' },

  // -- order overview ------------------------------------------------------
  orderSummary: { it: 'Riepilogo ordine' },
  pickupDate: { it: 'Ritiro' },
  returnDate: { it: 'Riconsegna' },
  duration: { it: 'Durata' },
  quantity: { it: 'Quantità' },
  toBeConfirmed: { it: 'da definire' },
  total: { it: 'Totale' },
  vatIncluded: { it: 'IVA inclusa' },
  estimateNoPackage: { it: 'stima · scegli un pacchetto' },
  noPaymentFootnote: {
    it: 'Nessun pagamento adesso — ti contattiamo su WhatsApp per concordarlo.',
  },
  baseRate: { it: 'Tariffa base' },
  included: { it: 'Incluso' },

  // -- cart ----------------------------------------------------------------
  cart: { it: 'La tua richiesta' },
  cartMetaTitle: { it: 'La tua richiesta | Mia Medical Italia' },
  cartMetaDescription: {
    it: 'Controlla gli ausili che hai scelto e passa alla conferma: non paghi niente adesso.',
  },
  /* "1 ausilio" / "3 ausili". "Ausilio" rather than "prodotto" or "articolo":
     it is the word this catalogue and the rest of the storefront already use for
     a medical aid, and the word the owner uses on the phone. */
  cartCountOne: { it: '1 ausilio' },
  cartCountMany: { it: '{count} ausili' },
  cartSummary: { it: 'Riepilogo' },
  cartSubtotal: { it: 'Totale indicativo' },
  cartDeliveryPending: { it: 'da concordare' },
  /* The reference design closes with "Proceed to checkout" over a payable total.
     Nothing is payable here, so the button says where it goes and the line under
     it says what it does not do. */
  goToCheckout: { it: 'Vai alla conferma' },
  cartNoChargeYet: { it: 'Non paghi niente adesso.' },
  continueBrowsing: { it: 'Continua a sfogliare' },
  /* No `editConfiguration` any more: the cart's "Modifica la scelta" is gone
     (owner, 2026-08-20). Editing meant going back to the product page and adding
     again, which appends a second line rather than replacing the first — so the
     button promised something it did not do. Remove and re-add is the honest
     route, and it is one press away. */
  remove: { it: 'Rimuovi' },
  removeNamed: { it: 'Rimuovi {title}' },
  increaseQuantity: { it: 'Aumenta la quantità' },
  decreaseQuantity: { it: 'Riduci la quantità' },
  quantityOf: { it: 'Quantità di {title}' },
  showDetailsOf: { it: 'Mostra i dettagli di {title}' },
  /* Announced by the island after a row changes, so a screen reader hears the
     result of pressing "+" rather than only seeing the number change. */
  cartUpdated: { it: 'Richiesta aggiornata' },
  cartHelpTitle: { it: 'Preferisci al telefono?' },
  /* Ends without punctuation and reads into the phone-number link that follows it:
     the cart's helper is one sentence on one line, not a card with a call button. */
  cartHelpDetail: { it: 'Chiamaci al numero verde gratuito' },
  cartLoading: { it: 'Calcolo dei prezzi…' },
  /* Shown while the island reads the cart out of `localStorage` and has it priced.
     The server cannot know what the cart holds, so this is what the FIRST paint
     says — see the `booting` state in lib/cart-state.svelte.ts. */
  cartBooting: { it: 'Carichiamo la tua richiesta…' },
  /* With JavaScript off nothing can read the store, so the page says so instead of
     leaving a spinner turning forever. Only rendered when the URL carried no line:
     a hand-off from a product page needs no script and shows its row. */
  cartNoScript: {
    it: 'Per vedere la tua richiesta serve JavaScript. Puoi anche chiamarci: la completiamo insieme al telefono.',
  },
  cartOffline: {
    it: 'Non riusciamo ad aggiornare i prezzi in questo momento. Gli importi qui sotto potrebbero non essere aggiornati — la conferma al telefono vale sempre.',
  },
  /* A product that no longer resolves. The checkout drops these silently; the
     cart says so, because this is the page where the customer can still act. */
  cartLineUnavailableOne: {
    it: 'Un ausilio non è più disponibile e l’abbiamo tolto dalla richiesta.',
  },
  cartLineUnavailableMany: {
    it: '{count} ausili non sono più disponibili e li abbiamo tolti dalla richiesta.',
  },

  // -- empty state ---------------------------------------------------------
  cartEmpty: { it: 'La tua richiesta è vuota' },
  cartEmptyDetail: {
    it: 'Scegli un ausilio dal catalogo e aggiungilo qui: poi confermiamo tutto insieme al telefono, senza pagare niente adesso.',
  },
  nothingToConfirm: { it: 'Non c’è niente da confermare' },
  nothingToConfirmDetail: {
    it: 'La tua richiesta è vuota, oppure uno dei prodotti non è più disponibile. Scegli un ausilio dal catalogo e torna qui: confermiamo tutto insieme, senza pagare nulla adesso.',
  },
  goToCatalog: { it: 'Vai al catalogo' },

  // -- the WhatsApp handover message ---------------------------------------
  rentalRequestHeading: { it: 'Richiesta di noleggio:' },
  msgPackage: { it: 'Pacchetto' },
  msgFrom: { it: 'Da' },
  msgTo: { it: 'A' },
  msgExtra: { it: 'Extra' },
  msgEstimate: { it: 'Stima' },
  msgName: { it: 'Nome' },
  msgEmail: { it: 'Email' },
  msgPhone: { it: 'Telefono' },
  msgAddress: { it: 'Indirizzo' },
  msgCustomerType: { it: 'Tipo cliente' },
  msgDelivery: { it: 'Consegna' },
  msgToBeArranged: { it: 'da concordare' },
  msgDeliveryAddress: { it: 'Indirizzo di consegna' },
  msgPickupBranch: { it: 'Sede di ritiro' },
  msgNotes: { it: 'Note' },
  /** Prefixed to the handover message once the order has a number to quote. */
  msgRequestNumber: { it: 'Richiesta n.' },
} as const;

export type StorefrontLabelKey = keyof typeof STOREFRONT_LABELS;

const label = createLabels(STOREFRONT_LABELS);

/** `t('storePickup')` → "Ritiro in sede". `t('branchIn', { city: 'Roma' })`. */
export function t(key: StorefrontLabelKey, params?: Record<string, string | number>): string {
  return label(key, LOCALE, params);
}
