/**
 * The shape of a hand-authored catalogue file: one JSON file per category in
 * `docs/catalog/`, holding the category, the specs it defines, and every
 * product in it.
 *
 * This is a WRITING format, not a transport format. Everything that can be
 * derived is optional, translations are per-field `{ it, en }` objects the way
 * the database stores them, and a product names its specs by key rather than by
 * id. `plan.ts` turns one of these into the rows the database wants.
 *
 * Full walkthrough, including every default, in docs/code/catalog-import.md.
 */

/** Italian mandatory, English optional — the project rule, stated once. */
export interface AuthoredText {
  it: string;
  en?: string;
}

// --- category ---------------------------------------------------------------

export interface AuthoredSpecOption {
  /** Machine value a facet filter matches, e.g. `aluminium`. Never translated. */
  value: string;
  label: AuthoredText;
}

export interface AuthoredSpec {
  /** Machine key. What a product's `specs` map is keyed by. */
  key: string;
  label: AuthoredText;
  helpText?: AuthoredText | null;
  valueType: 'string' | 'number' | 'single_select' | 'multi_select' | 'boolean' | 'number_range';
  unit?: string | null;
  isRequired?: boolean;
  isFilterable?: boolean;
  isComparable?: boolean;
  /** Defaults to the spec's place in the list. */
  position?: number;
  /** Image file under the assets root. Squared to 256×256 WebP on import. */
  icon?: string | null;
  /** Required on `single_select` / `multi_select`, ignored otherwise. */
  options?: AuthoredSpecOption[];
}

export interface AuthoredCategory {
  /** Stable machine handle and the file's identity — never rename it casually. */
  code: string;
  /** Adopt an existing row instead of the id derived from `code`. */
  id?: string;
  name: AuthoredText;
  /** Derived from `name` when absent. A slug is an SEO commitment: pin it. */
  slug?: AuthoredText;
  description?: AuthoredText | null;
  metaTitle?: AuthoredText | null;
  metaDescription?: AuthoredText | null;
  /** Image file under the assets root. */
  icon?: string | null;
  position?: number;
  isActive?: boolean;
  /** Rentals here sign the deposit (scooter) contract variant. */
  requiresDeposit?: boolean;
  specs?: AuthoredSpec[];
  products?: AuthoredProduct[];
}

// --- product ----------------------------------------------------------------

/**
 * A spec value in the shape its `valueType` implies:
 *
 *   number         42                       number_range  { "min": 12, "max": 15 }
 *   boolean        true                     single_select "aluminium"
 *   string         "Nero" or { it, en }     multi_select  ["aluminium", "steel"]
 */
export type AuthoredSpecValue =
  | string
  | number
  | boolean
  | string[]
  | AuthoredText
  | { min?: number | null; max?: number | null };

/** A file name under the assets root, or that plus alt text. */
export type AuthoredMediaRef = string | { file: string; alt?: AuthoredText };

export interface AuthoredMedia {
  thumbnail?: AuthoredMediaRef | null;
  /** Transparent cutout. Converted to WebP like every other image. */
  cleanPng?: AuthoredMediaRef | null;
  gallery?: AuthoredMediaRef[];
  videos?: AuthoredMediaRef[];
  documents?: AuthoredMediaRef[];
}

export interface AuthoredAddon {
  name: AuthoredText;
  description?: AuthoredText | null;
  /** Defaults to the product's own mode. A fixed product takes fixed addons only. */
  pricingMode?: 'fixed' | 'rental';
  price: string;
  /** Defaults to the product's rental unit on a rental addon. */
  rentalUnit?: 'hour' | 'day' | null;
  minQuantity?: number;
  /** `1` means "tick, not stepper". Absent means the shared ceiling. */
  maxQuantity?: number | null;
  icon?: string | null;
  position?: number;
}

export interface AuthoredFaq {
  question: AuthoredText;
  answer: AuthoredText;
  position?: number;
  isActive?: boolean;
}

export interface AuthoredQuestionOption {
  value: string;
  label: AuthoredText;
}

export interface AuthoredQuestion {
  key: string;
  prompt: AuthoredText;
  helpText?: AuthoredText | null;
  questionValueType:
    'string' | 'text' | 'number' | 'single_select' | 'multi_select' | 'boolean' | 'date';
  isRequired?: boolean;
  minValue?: number | null;
  maxValue?: number | null;
  maxLength?: number | null;
  position?: number;
  options?: AuthoredQuestionOption[];
}

export interface AuthoredRentalPackage {
  /** Stable handle an order line records, e.g. `7-giorni`. */
  code: string;
  name: AuthoredText;
  /** Decimal string with two places — `"45.00"`, never a JSON number. */
  price: string;
  duration: number;
  unit: 'hour' | 'day';
}

export interface AuthoredProduct {
  /**
   * The product's identity in this file, and the ONLY thing that makes a re-run
   * update rather than duplicate. It is not the slug: a slug is public and gets
   * rewritten for SEO, and rewriting one must not mint a second product.
   */
  code: string;
  /** Adopt an existing row instead of the id derived from `code`. */
  id?: string;
  status?: 'draft' | 'active' | 'archived';
  brand?: string | null;
  pricingMode: 'fixed' | 'rental';
  /** Fixed products only. A rental is priced by its packages. */
  basePrice?: string | null;
  /** Rental products only, and display copy even there — "da 1,10 € al giorno". */
  marketingRate?: string | null;
  currency?: string;
  /** Required on a rental, forbidden on a fixed product. */
  rentalUnit?: 'hour' | 'day' | null;
  /** At least one on a rental product. THE price — nothing derives it. */
  rentalPackages?: AuthoredRentalPackage[];
  stock?: number;
  isFeatured?: boolean;
  /** Two to five short claims for the card and hero. 20 characters each. */
  chips?: AuthoredText[];

  title: AuthoredText;
  /** Derived from `title` when absent. */
  slug?: AuthoredText;
  shortDescription?: AuthoredText | null;
  /** Rich text (HTML). Sanitised on the way in; the tsvector gets words only. */
  description?: AuthoredText | null;
  metaTitle?: AuthoredText | null;
  metaDescription?: AuthoredText | null;

  /** Keyed by the category spec's `key`. Unknown keys are a validation error. */
  specs?: Record<string, AuthoredSpecValue>;
  media?: AuthoredMedia;
  addons?: AuthoredAddon[];
  faqs?: AuthoredFaq[];
  questions?: AuthoredQuestion[];
}
