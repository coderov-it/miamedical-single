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
  placeholderAddress: { it: 'Via e numero civico, CAP, città' },
  placeholderEmail: { it: 'mario.rossi@example.com' },
  placeholderPhone: { it: '+39 333 000 0000' },
  placeholderCodiceFiscale: { it: 'RSSMRA80A01H501X' },
  placeholderPartitaIva: { it: 'IT01234567890' },
  placeholderCompanyCodiceFiscale: { it: '01234567890' },
  placeholderComments: { it: 'Qualcosa che dovremmo sapere' },
  placeholderVenue: { it: 'Hotel Duomo, Via Roma 12' },
  placeholderGuestName: { it: 'Mario Rossi' },

  // -- step 2: delivery ----------------------------------------------------
  deliveryAndPickup: { it: 'Consegna e ritiro' },
  hotelDelivery: { it: 'Consegna e ritiro in hotel o casa vacanze' },
  hotelDeliveryDetail: {
    it: 'Consegnato e ritirato alla reception dell’hotel o nel tuo alloggio',
  },
  hotelDeliveryShort: { it: 'Consegna in hotel' },
  homeDelivery: { it: 'Consegna e ritiro a domicilio' },
  homeDeliveryDetail: {
    it: 'Consegnato al tuo indirizzo in una fascia di due ore che scegli tu',
  },
  homeDeliveryShort: { it: 'Consegna a domicilio' },
  storePickup: { it: 'Ritiro in sede' },
  storePickupDetail: { it: 'Ritiro e riconsegna in una delle nostre sedi' },
  storePickupShort: { it: 'Ritiro in sede' },
  free: { it: 'Gratis' },
  venueNameAndAddress: { it: 'Nome e indirizzo della struttura' },
  guestNameAtReception: { it: 'Nome dell’ospite alla reception' },
  deliverToDetailsAddress: { it: 'Consegna all’indirizzo indicato al passo 1' },
  deliveryAddress: { it: 'Indirizzo di consegna' },
  choosePickupPoint: { it: 'Scegli dove ritirare e riconsegnare:' },
  branchIn: { it: 'Sede di {city}' },

  // -- step 3: confirmation ------------------------------------------------
  contact: { it: 'Contatto' },
  noPaymentNow: { it: 'Nessun pagamento adesso' },
  noPaymentNowDetail: {
    it: 'Ti scriviamo su WhatsApp per concordare il pagamento e per qualsiasi altra cosa ti serva.',
  },
  sendOrderOnWhatsApp: { it: 'Invia l’ordine su WhatsApp' },
  termsNoticeBefore: { it: 'Inviando l’ordine accetti le nostre' },
  rentalTerms: { it: 'condizioni di noleggio' },
  requestSent: { it: 'Richiesta inviata' },
  requestSentDetail: {
    it: 'Abbiamo la tua richiesta. Ti contattiamo su WhatsApp a breve per confermare la disponibilità e concordare consegna e pagamento.',
  },
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
  estimateOpenPeriod: { it: 'stima · periodo da definire' },
  noPaymentFootnote: {
    it: 'Nessun pagamento adesso — ti contattiamo su WhatsApp per concordarlo.',
  },
  baseRate: { it: 'Tariffa base' },
  included: { it: 'Incluso' },
  oneTimeSuffix: { it: 'una tantum' },
  packageDiscountApplied: { it: 'Sconto pacchetto già applicato' },
  packagePrefix: { it: 'Pacchetto' },

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
  editConfiguration: { it: 'Modifica la scelta' },
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
  msgVenue: { it: 'Struttura' },
  msgGuest: { it: 'Ospite' },
  msgDeliveryAddress: { it: 'Indirizzo di consegna' },
  msgPickupBranch: { it: 'Sede di ritiro' },
  msgNotes: { it: 'Note' },
} as const;

export type StorefrontLabelKey = keyof typeof STOREFRONT_LABELS;

const label = createLabels(STOREFRONT_LABELS);

/** `t('storePickup')` → "Ritiro in sede". `t('branchIn', { city: 'Roma' })`. */
export function t(key: StorefrontLabelKey, params?: Record<string, string | number>): string {
  return label(key, LOCALE, params);
}
