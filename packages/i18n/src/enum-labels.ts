import type {
  LanguageCode,
  OrderStatus,
  PaymentStatus,
  PricingMode,
  ProductStatus,
  QuestionValueType,
  RentalUnit,
  TermsStatus,
  ValueType,
} from '@mia/validators';

/**
 * Display strings for the eight enum types — see docs/code/static-i18n-labels.md.
 *
 * These are NOT content. An enum value is a machine token (`'day'`, `'draft'`)
 * that is never translated in the database, so it must never become a
 * `localized()` jsonb column: there is nothing bilingual to *store*, only to
 * *display*. The project's content i18n rule does not apply here.
 *
 * Every catalog is `satisfies Labels<TheUnion, …>`, which is the whole point:
 * append a member to a pgEnum and `tsc` fails until both languages exist.
 * A flat key namespace (`rental_unit_day_per`) cannot do that.
 */

/**
 * Keyed by `LanguageCode`, so a code that is not a registered language fails to
 * compile — and registering one makes `tsc` list every catalog entry that has
 * not answered for it yet. That is the whole point of these being `satisfies`
 * with no fallback: a flat key namespace (`rental_unit_day_per`) cannot do it.
 */
type Labels<TToken extends string, TForms> = Record<TToken, Record<LanguageCode, TForms>>;

/** The common case: one word per language. */
type Plain = string;

/**
 * Rental units need three forms, written out rather than composed. Italian
 * elides the preposition before a vowel — `al giorno` but `all'ora` — so no
 * generic `'al ' + unit` can produce both, and `many` is not `one + 's'`
 * in every language (`ora` → `ore`). French takes `par` uniformly, which is
 * exactly why composing from a per-language preposition would still be wrong:
 * the rule differs per language, not per unit.
 */
export interface UnitForms {
  one: string;
  many: string;
  /** "per day" / "al giorno" — the whole adverbial phrase. */
  per: string;
}

export const RENTAL_UNIT = {
  hour: {
    it: { one: 'ora', many: 'ore', per: "all'ora" },
    en: { one: 'hour', many: 'hours', per: 'per hour' },
    fr: { one: 'heure', many: 'heures', per: 'par heure' },
  },
  day: {
    it: { one: 'giorno', many: 'giorni', per: 'al giorno' },
    en: { one: 'day', many: 'days', per: 'per day' },
    fr: { one: 'jour', many: 'jours', per: 'par jour' },
  },
} as const satisfies Labels<RentalUnit, UnitForms>;

export const PRICING_MODE = {
  fixed: { it: 'Prezzo fisso', en: 'Fixed price', fr: 'Prix fixe' },
  rental: { it: 'Noleggio', en: 'Rental', fr: 'Location' },
} as const satisfies Labels<PricingMode, Plain>;

export const PRODUCT_STATUS = {
  draft: { it: 'Bozza', en: 'Draft', fr: 'Brouillon' },
  active: { it: 'Attivo', en: 'Active', fr: 'Actif' },
  archived: { it: 'Archiviato', en: 'Archived', fr: 'Archivé' },
} as const satisfies Labels<ProductStatus, Plain>;

/**
 * These agree with the noun they describe, and the noun's gender differs by
 * language: `ordine` is masculine in Italian, `commande` is feminine in French,
 * so the French forms carry the -e that the Italian ones must not. Same reason
 * PAYMENT_STATUS below is masculine in French — it describes `paiement`.
 */
export const ORDER_STATUS = {
  pending: { it: 'In attesa', en: 'Pending', fr: 'En attente' },
  paid: { it: 'Pagato', en: 'Paid', fr: 'Payée' },
  fulfilled: { it: 'Evaso', en: 'Fulfilled', fr: 'Traitée' },
  cancelled: { it: 'Annullato', en: 'Cancelled', fr: 'Annulée' },
  refunded: { it: 'Rimborsato', en: 'Refunded', fr: 'Remboursée' },
} as const satisfies Labels<OrderStatus, Plain>;

export const PAYMENT_STATUS = {
  unpaid: { it: 'Non pagato', en: 'Unpaid', fr: 'Non payé' },
  authorized: { it: 'Autorizzato', en: 'Authorized', fr: 'Autorisé' },
  paid: { it: 'Pagato', en: 'Paid', fr: 'Payé' },
  partially_refunded: {
    it: 'Rimborsato parzialmente',
    en: 'Partially refunded',
    fr: 'Partiellement remboursé',
  },
  refunded: { it: 'Rimborsato', en: 'Refunded', fr: 'Remboursé' },
  failed: { it: 'Non riuscito', en: 'Failed', fr: 'Échoué' },
} as const satisfies Labels<PaymentStatus, Plain>;

export const TERMS_STATUS = {
  draft: { it: 'Bozza', en: 'Draft', fr: 'Brouillon' },
  published: { it: 'Pubblicato', en: 'Published', fr: 'Publié' },
  archived: { it: 'Archiviato', en: 'Archived', fr: 'Archivé' },
} as const satisfies Labels<TermsStatus, Plain>;

/** The shapes a category spec's value can take. */
export const VALUE_TYPE = {
  string: { it: 'Testo', en: 'Text', fr: 'Texte' },
  number: { it: 'Numero', en: 'Number', fr: 'Nombre' },
  single_select: { it: 'Scelta singola', en: 'Single choice', fr: 'Choix unique' },
  multi_select: { it: 'Scelta multipla', en: 'Multiple choice', fr: 'Choix multiple' },
  boolean: { it: 'Sì / No', en: 'Yes / No', fr: 'Oui / Non' },
  number_range: { it: 'Intervallo numerico', en: 'Number range', fr: 'Plage numérique' },
} as const satisfies Labels<ValueType, Plain>;

/** Intake questions answered by the customer at order time. */
export const QUESTION_VALUE_TYPE = {
  string: { it: 'Testo breve', en: 'Short text', fr: 'Texte court' },
  text: { it: 'Testo lungo', en: 'Long text', fr: 'Texte long' },
  number: { it: 'Numero', en: 'Number', fr: 'Nombre' },
  single_select: { it: 'Scelta singola', en: 'Single choice', fr: 'Choix unique' },
  multi_select: { it: 'Scelta multipla', en: 'Multiple choice', fr: 'Choix multiple' },
  boolean: { it: 'Sì / No', en: 'Yes / No', fr: 'Oui / Non' },
  date: { it: 'Data', en: 'Date', fr: 'Date' },
} as const satisfies Labels<QuestionValueType, Plain>;

// --- accessors --------------------------------------------------------------

/**
 * No fallback chain here, unlike content i18n: a catalog is exhaustive by
 * construction, so every registered language is always present and a lookup
 * cannot miss.
 */
export function unitLabel(
  unit: RentalUnit,
  locale: LanguageCode,
  form: keyof UnitForms = 'one',
): string {
  return RENTAL_UNIT[unit][locale][form];
}

/**
 * "8,00 € al giorno" is built by the caller from a formatted amount plus this.
 * Fixed-price products pass `null` and get an empty suffix.
 */
export function perUnitLabel(unit: RentalUnit | null, locale: LanguageCode): string {
  return unit ? RENTAL_UNIT[unit][locale].per : '';
}

/** "7 giorni" / "1 giorno" — the label a rental package renders under. */
export function durationLabel(duration: number, unit: RentalUnit, locale: LanguageCode): string {
  return `${duration} ${unitLabel(unit, locale, duration === 1 ? 'one' : 'many')}`;
}

const plain =
  <TToken extends string>(catalog: Labels<TToken, Plain>) =>
  (token: TToken, locale: LanguageCode): string =>
    catalog[token][locale];

export const pricingModeLabel = plain(PRICING_MODE);
export const productStatusLabel = plain(PRODUCT_STATUS);
export const orderStatusLabel = plain(ORDER_STATUS);
export const paymentStatusLabel = plain(PAYMENT_STATUS);
export const termsStatusLabel = plain(TERMS_STATUS);
export const valueTypeLabel = plain(VALUE_TYPE);
export const questionValueTypeLabel = plain(QUESTION_VALUE_TYPE);

/**
 * `[{ value, label }]` for a `<Select>`, in the enum's own declaration order.
 * `Object.keys` on a catalog is safe: the `satisfies` above proves the key set
 * is exactly the union.
 */
export function optionsOf<TToken extends string>(
  catalog: Labels<TToken, Plain>,
  locale: LanguageCode,
): Array<{ value: TToken; label: string }> {
  return (Object.keys(catalog) as TToken[]).map((value) => ({
    value,
    label: catalog[value][locale],
  }));
}

/** Same, for the three-form rental-unit catalog. */
export function rentalUnitOptions(
  locale: LanguageCode,
  form: keyof UnitForms = 'one',
): Array<{ value: RentalUnit; label: string }> {
  return (Object.keys(RENTAL_UNIT) as RentalUnit[]).map((value) => ({
    value,
    label: unitLabel(value, locale, form),
  }));
}
