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

/** Keyed by `LanguageCode` so a stray `{ fr: … }` fails to compile. */
type Labels<TToken extends string, TForms> = Record<TToken, Record<LanguageCode, TForms>>;

/** The common case: one word per language. */
type Plain = string;

/**
 * Rental units need three forms, written out rather than composed. Italian
 * elides the preposition before a vowel — `al giorno` but `all'ora` — so no
 * generic `'al ' + unit` can produce both, and `many` is not `one + 's'`
 * in either language (`ora` → `ore`).
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
  },
  day: {
    it: { one: 'giorno', many: 'giorni', per: 'al giorno' },
    en: { one: 'day', many: 'days', per: 'per day' },
  },
} as const satisfies Labels<RentalUnit, UnitForms>;

export const PRICING_MODE = {
  fixed: { it: 'Prezzo fisso', en: 'Fixed price' },
  rental: { it: 'Noleggio', en: 'Rental' },
} as const satisfies Labels<PricingMode, Plain>;

export const PRODUCT_STATUS = {
  draft: { it: 'Bozza', en: 'Draft' },
  active: { it: 'Attivo', en: 'Active' },
  archived: { it: 'Archiviato', en: 'Archived' },
} as const satisfies Labels<ProductStatus, Plain>;

export const ORDER_STATUS = {
  pending: { it: 'In attesa', en: 'Pending' },
  paid: { it: 'Pagato', en: 'Paid' },
  fulfilled: { it: 'Evaso', en: 'Fulfilled' },
  cancelled: { it: 'Annullato', en: 'Cancelled' },
  refunded: { it: 'Rimborsato', en: 'Refunded' },
} as const satisfies Labels<OrderStatus, Plain>;

export const PAYMENT_STATUS = {
  unpaid: { it: 'Non pagato', en: 'Unpaid' },
  authorized: { it: 'Autorizzato', en: 'Authorized' },
  paid: { it: 'Pagato', en: 'Paid' },
  partially_refunded: { it: 'Rimborsato parzialmente', en: 'Partially refunded' },
  refunded: { it: 'Rimborsato', en: 'Refunded' },
  failed: { it: 'Non riuscito', en: 'Failed' },
} as const satisfies Labels<PaymentStatus, Plain>;

export const TERMS_STATUS = {
  draft: { it: 'Bozza', en: 'Draft' },
  published: { it: 'Pubblicato', en: 'Published' },
  archived: { it: 'Archiviato', en: 'Archived' },
} as const satisfies Labels<TermsStatus, Plain>;

/** Shared by category specs and variant groups. */
export const VALUE_TYPE = {
  string: { it: 'Testo', en: 'Text' },
  number: { it: 'Numero', en: 'Number' },
  single_select: { it: 'Scelta singola', en: 'Single choice' },
  multi_select: { it: 'Scelta multipla', en: 'Multiple choice' },
  boolean: { it: 'Sì / No', en: 'Yes / No' },
  number_range: { it: 'Intervallo numerico', en: 'Number range' },
} as const satisfies Labels<ValueType, Plain>;

/** Intake questions answered by the customer at order time. */
export const QUESTION_VALUE_TYPE = {
  string: { it: 'Testo breve', en: 'Short text' },
  text: { it: 'Testo lungo', en: 'Long text' },
  number: { it: 'Numero', en: 'Number' },
  single_select: { it: 'Scelta singola', en: 'Single choice' },
  multi_select: { it: 'Scelta multipla', en: 'Multiple choice' },
  boolean: { it: 'Sì / No', en: 'Yes / No' },
  date: { it: 'Data', en: 'Date' },
} as const satisfies Labels<QuestionValueType, Plain>;

// --- accessors --------------------------------------------------------------

/**
 * No fallback chain here, unlike content i18n: a catalog is exhaustive by
 * construction, so both languages are always present and a lookup cannot miss.
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
