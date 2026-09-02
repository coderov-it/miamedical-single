/**
 * The shapes a catalogue file is written in.
 *
 * Every one of them mirrors a column or a CHECK constraint in
 * `packages/db/src/schema/catalog.ts`, so the compiler refuses what the
 * database would refuse:
 *
 *   products_rental_unit_check       rental ⟺ rentalUnit      → two constructors
 *   products_base_price_check        fixed  ⟺ basePrice        → two constructors
 *   products_marketing_rate_check    marketingRate only rental → RentalProduct only
 *   products_rental_packages_check   rental ⟹ ≥1 package      → NonEmpty<>
 *   product_addons_mode_check        fixed product ⟹ fixed addons only
 *   product_addons_rental_unit_check rental addon ⟺ rentalUnit → two constructors
 *
 * Types are borrowed from `@mia/db/schema` rather than restated, so a column
 * that changes shape breaks this package instead of drifting from it. Every
 * import is `import type`, and `verbatimModuleSyntax` erases them — this
 * package carries no runtime dependency on Drizzle.
 *
 * Vocabulary is English throughout, including option values, spec keys and
 * package codes. Italian appears only inside a `Localized` value, which is the
 * text a customer reads.
 */
import type { LanguageCode, Localized, MediaAlt } from '@mia/db/schema';

export type { LanguageCode, Localized };

/**
 * `numeric(12, 2)` as the string Drizzle wants. The template type rejects the
 * three mistakes that actually happen: `'45'` (no decimals), `'45,00'` (the
 * Italian display separator) and anything non-numeric. It cannot count decimal
 * places, so three-place amounts still reach the runtime check.
 */
export type Money = `${number}.${number}`;

/** At least one element, enforced at compile time. */
export type NonEmpty<T> = readonly [T, ...T[]];

// --- specs ------------------------------------------------------------------

/**
 * Select options keyed by their machine value, so the value is English by
 * construction and cannot repeat — which is exactly what
 * `category_spec_options_spec_value_key` requires. Insertion order becomes
 * `position`.
 */
export type SpecOptions = Record<string, Localized>;

interface SpecBase {
  label: Localized;
  helpText?: Localized;
  isRequired?: boolean;
  isFilterable?: boolean;
  isComparable?: boolean;
  /** Object key of an icon file. Squared to 256×256 WebP on upload. */
  icon?: string;
}

export interface NumberSpec extends SpecBase {
  valueType: 'number';
  unit?: string;
}
export interface RangeSpec extends SpecBase {
  valueType: 'number_range';
  unit?: string;
}
export interface BooleanSpec extends SpecBase {
  valueType: 'boolean';
}
export interface TextSpec extends SpecBase {
  valueType: 'string';
}
export interface SelectSpec<O extends SpecOptions = SpecOptions> extends SpecBase {
  valueType: 'single_select';
  options: O;
}
export interface MultiSelectSpec<O extends SpecOptions = SpecOptions> extends SpecBase {
  valueType: 'multi_select';
  options: O;
}

export type AnySpec =
  NumberSpec | RangeSpec | BooleanSpec | TextSpec | SelectSpec | MultiSelectSpec;

/**
 * Specs keyed by their machine key rather than listed with a `key` field. Two
 * reasons, one of them forced:
 *
 *   1. A key cannot repeat, which is `category_specs_category_key_key`.
 *   2. TypeScript's `const` type parameter does NOT preserve a tuple when the
 *      constraint is an array of a non-literal type — `readonly AnySpec[]`
 *      widens `key` to `string`, the mapped type collapses to an index
 *      signature, and every spec key and option value silently stops being
 *      checked. A `Record` constraint has no such problem.
 */
export type SpecMap = Record<string, AnySpec>;

/** The value shape a spec's `valueType` demands from a product. */
export type SpecValue<S> = S extends NumberSpec
  ? number
  : S extends RangeSpec
    ? { min?: number; max?: number }
    : S extends BooleanSpec
      ? boolean
      : S extends SelectSpec<infer O>
        ? keyof O & string
        : S extends MultiSelectSpec<infer O>
          ? readonly (keyof O & string)[]
          : S extends TextSpec
            ? string | Localized
            : never;

/** A product's `specs` field, derived from the specs its category declared. */
export type SpecsOf<S extends SpecMap> = { [K in keyof S]?: SpecValue<S[K]> };

// --- rental packages --------------------------------------------------------

export interface RentalPackageInput {
  /**
   * Stable English handle an order line records — `7-days`, never `7-giorni`.
   * A renamed package must not rewrite order history, and the name a customer
   * reads lives in `name`.
   */
  code: string;
  name: Localized;
  price: Money;
  duration: number;
  /** Its own unit: a per-day product may still offer a 12-hour package. */
  unit: 'hour' | 'day';
}

// --- add-ons ----------------------------------------------------------------

interface AddonBase {
  name: Localized;
  description?: Localized;
  minQuantity?: number;
  /** `1` means "tick, not stepper". Omit for the shared ceiling. */
  maxQuantity?: number;
  icon?: string;
}

/** Billed once. The only kind a fixed-price product may carry. */
export interface FixedAddon extends AddonBase {
  pricingMode: 'fixed';
  price: Money;
}

/** Billed per `rentalUnit`. Only a rental product may carry one. */
export interface RentalAddon extends AddonBase {
  pricingMode: 'rental';
  price: Money;
  rentalUnit: 'hour' | 'day';
}

// --- intake questions -------------------------------------------------------

interface QuestionBase {
  /** English machine key — `floor`, `hasLift`. Unique within a product. */
  key: string;
  prompt: Localized;
  helpText?: Localized;
  isRequired?: boolean;
}

export interface NumberQuestion extends QuestionBase {
  questionValueType: 'number';
  minValue?: number;
  maxValue?: number;
}
export interface TextQuestion extends QuestionBase {
  questionValueType: 'string' | 'text';
  maxLength?: number;
}
export interface BooleanQuestion extends QuestionBase {
  questionValueType: 'boolean';
}
export interface DateQuestion extends QuestionBase {
  questionValueType: 'date';
}
export interface SelectQuestion<O extends SpecOptions = SpecOptions> extends QuestionBase {
  questionValueType: 'single_select' | 'multi_select';
  options: O;
}

export type AnyQuestion =
  NumberQuestion | TextQuestion | BooleanQuestion | DateQuestion | SelectQuestion;

// --- FAQs, media, terms -----------------------------------------------------

export interface FaqInput {
  question: Localized;
  answer: Localized;
  isActive?: boolean;
}

/** A media file by name, plus the alt text a screen reader reads. */
export interface MediaRef {
  file: string;
  alt?: MediaAlt;
}

export interface MediaInput {
  thumbnail?: string | MediaRef;
  /** Transparent cutout. Converted to WebP like every other image. */
  cleanPng?: string | MediaRef;
  gallery?: readonly (string | MediaRef)[];
  videos?: readonly (string | MediaRef)[];
  documents?: readonly (string | MediaRef)[];
}

export interface TermsTranslation {
  title: string;
  body: string;
  /** Public URL segment. Unique per language across every terms document. */
  slug: string;
}

export interface TermsInput {
  /** Stable English handle — `general-rental`, `scooter-deposit`. */
  code: string;
  status?: 'draft' | 'published' | 'archived';
  version?: number;
  translations: { it: TermsTranslation } & Partial<Record<LanguageCode, TermsTranslation>>;
}

/** What `defineTerms` returns — a document a product can link to. */
export interface TermsDocument extends TermsInput {
  readonly __brand: 'terms';
}

// --- products ---------------------------------------------------------------

/**
 * `product_translations` — `title`. Kept separate from the category's because
 * `category_translations` names its column `name`, and one shared type would
 * put a `title` in a category row.
 */
export interface ProductTranslationInput {
  title: string;
  /** A public URL and an SEO commitment. Derived from `title` when omitted. */
  slug?: string;
  shortDescription?: string;
  /** Rich text. Sanitised on the way in. */
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

/** `category_translations` — `name`, and no short description. */
export interface CategoryTranslationInput {
  name: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface ProductBase<S extends SpecMap> {
  /** Identity, and the uuid seed. Renaming it mints a different product. */
  code: string;
  status?: 'draft' | 'active' | 'archived';
  brand?: string;
  stock?: number;
  isFeatured?: boolean;
  /** Two to five short claims for the card and the hero. */
  chips?: readonly Localized[];
  translations: { it: ProductTranslationInput } & Partial<
    Record<LanguageCode, ProductTranslationInput>
  >;
  specs?: SpecsOf<S>;
  media?: MediaInput;
  faqs?: readonly FaqInput[];
  questions?: readonly AnyQuestion[];
  terms?: readonly TermsDocument[];
}

/** Priced by packages. `basePrice` is absent because the CHECK forbids it. */
export interface RentalProductInput<S extends SpecMap> extends ProductBase<S> {
  pricingMode: 'rental';
  rentalUnit: 'hour' | 'day';
  packages: NonEmpty<RentalPackageInput>;
  /** Display copy — "da 1,10 € al giorno". No total ever reads it. */
  marketingRate?: Money;
  addons?: readonly (FixedAddon | RentalAddon)[];
}

/** Bought outright. No packages, no rental unit, no marketing rate. */
export interface FixedProductInput<S extends SpecMap> extends ProductBase<S> {
  pricingMode: 'fixed';
  basePrice: Money;
  /** A rental add-on on a sold product has no period to bill against. */
  addons?: readonly FixedAddon[];
}

export type ProductInput<S extends SpecMap> = RentalProductInput<S> | FixedProductInput<S>;

// --- categories -------------------------------------------------------------

export interface CategoryInput<S extends SpecMap> {
  /** Stable English handle and the file's identity. */
  code: string;
  translations: { it: CategoryTranslationInput } & Partial<
    Record<LanguageCode, CategoryTranslationInput>
  >;
  icon?: string;
  position?: number;
  isActive?: boolean;
  /** Rentals here sign the deposit contract variant. */
  requiresDeposit?: boolean;
  specs: S;
}

/** A category plus the products written against it. */
export interface Category<S extends SpecMap = SpecMap> {
  readonly input: CategoryInput<S>;
  readonly products: readonly ProductInput<S>[];
}
