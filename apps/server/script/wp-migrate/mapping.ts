import type { LanguageCode } from '@mia/db/schema';

import { slugify } from './parse.ts';

/**
 * The judgement calls, gathered in one file so they can be argued with.
 *
 * Everything here is a decision about *meaning* that the data does not state
 * outright: which WooCommerce tree implies which pricing mode, which curated
 * comparison group describes which category, what shape a free-text spec value
 * really is. Each one is applied mechanically and then written into
 * `report.json`, because a heuristic you cannot audit is a guess.
 */

// --- pricing mode -----------------------------------------------------------

/**
 * The two WooCommerce roots. `categories` in the new schema is flat and has no
 * `parentId`, so these do not survive as categories — they survive as the
 * product's `pricing_mode`, which is the only thing they ever really encoded.
 */
export const RENTAL_ROOT_TERM_ID = 260;
export const SALE_ROOT_TERM_ID = 261;

export type PricingMode = 'fixed' | 'rental';

// --- curated comparison groups ---------------------------------------------

/**
 * `wp_mia_compare_excel_groups.group_slug` → the category `code` its fields
 * describe. Written out rather than fuzzy-matched on tokens: there are nine
 * groups and eighteen categories, the mapping is not one-to-one, and a wrong
 * silent match would attach bed specs to wheelchairs.
 *
 * `carrozzine-elettriche` and `scooter-elettrici` both land on the one
 * WooCommerce category that sells both ("Carrozzine elettriche e scooter"),
 * so their fields merge — deduplicated by `field_key` further down.
 */
export const COMPARE_GROUP_TO_CATEGORY: Record<string, string> = {
  'letti-elettrici-ortopedici': 'letti-ortopedici-ospedalieri',
  'carrozzine-elettriche': 'carrozzine-elettriche-e-scooter',
  'scooter-elettrici': 'carrozzine-elettriche-e-scooter',
  'carrozzine-manuali': 'carrozzine',
  sollevatori: 'sollevatori',
  deambulatori: 'deambulatori-e-rollatori',
  magnetoterapia: 'magnetoterapia',
  verticalizzatori: 'verticalizzatori',
  montascale: 'montascale',
};

// --- category naming --------------------------------------------------------

/** "Affitto e noleggio X", "Noleggio e affitto X", "Vendita X". */
const LEADING_SALES_MODE =
  /^(?:affitto|noleggio|vendita)(?:\s+e\s+(?:affitto|noleggio|vendita))?\s+/i;
/** "X in Vendita", "X a noleggio". */
const TRAILING_SALES_MODE = /\s+(?:in|a|da)\s+(?:affitto|noleggio|vendita)\b/i;

/**
 * How a category was sold is not part of its name. WooCommerce disagreed —
 * every term in the rental tree is prefixed with it and three sale-tree names
 * repeat it — so it comes off here, name and code alike:
 *
 *   "Vendita Ausili per la mobilità"  → "Ausili per la mobilità"
 *   "Occasione Usato in Vendita"      → "Occasione usato"
 *   "Carrozzine"                      → "Carrozzine"          (already clean)
 *
 * `products.pricing_mode` is where that fact lives now, so leaving it in the
 * name would both duplicate the column and split one product family in two the
 * day the same wheelchairs are also sold outright.
 */
export function stripSalesMode(name: string): string {
  const stripped = name.replace(LEADING_SALES_MODE, '').replace(TRAILING_SALES_MODE, '').trim();
  if (stripped.length === 0) return name.trim();
  // A stripped prefix leaves the next word lowercase where it now starts.
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

// --- spec value shapes ------------------------------------------------------

export type ValueType =
  'string' | 'number' | 'single_select' | 'multi_select' | 'boolean' | 'number_range';

/** Italian yes/no vocabulary as this catalog actually writes it. */
const TRUTHY = new Set(['sì', 'si', 'yes', 'incluso', 'inclusa', 'presente', 'disponibile', 'x']);
const FALSY = new Set(['no', 'non incluso', 'non inclusa', 'assente', 'non disponibile', '-', '—']);

const norm = (raw: string): string => raw.trim().toLowerCase().replace(/\s+/g, ' ');

export function asBoolean(raw: string): boolean | null {
  const value = norm(raw);
  if (TRUTHY.has(value)) return true;
  if (FALSY.has(value)) return false;
  return null;
}

/**
 * `"130 kg"` → 130, `"195x95 cm"` → null (that is a dimension pair, not a
 * quantity), `"Fino a 75°"` → null (a qualified bound, whose text carries the
 * meaning). Deliberately strict: a spec that is only *sometimes* numeric is
 * worse than one that is honestly text, because a numeric facet filter would
 * silently exclude every row it failed to parse.
 */
export function asNumber(raw: string): { value: number; unit: string | null } | null {
  const text = raw.trim();
  const match = /^(-?\d+(?:[.,]\d+)?)\s*([a-zA-Z°%µ]*)$/.exec(text);
  if (!match) return null;
  const value = Number(match[1]!.replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  return { value, unit: match[2] ? match[2] : null };
}

/** `"min: 30 cm - max: 80 cm"` and `"da 0° a circa 75°"` → a range. */
export function asRange(raw: string): { min: number; max: number; unit: string | null } | null {
  const text = raw.trim();
  const explicit =
    /min\.?:?\s*(-?\d+(?:[.,]\d+)?)\s*([a-zA-Z°%]*)\s*[-–—]?\s*max\.?:?\s*(-?\d+(?:[.,]\d+)?)\s*([a-zA-Z°%]*)/i.exec(
      text,
    );
  const loose =
    explicit ??
    /^(?:da\s*)?(-?\d+(?:[.,]\d+)?)\s*([a-zA-Z°%]*)\s*(?:a|-|–|—)\s*(?:circa\s*)?(-?\d+(?:[.,]\d+)?)\s*([a-zA-Z°%]*)$/i.exec(
      text,
    );
  if (!loose) return null;
  const min = Number(loose[1]!.replace(',', '.'));
  const max = Number(loose[3]!.replace(',', '.'));
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return null;
  return { min, max, unit: loose[4] || loose[2] || null };
}

export interface InferredSpec {
  valueType: ValueType;
  unit: string | null;
  /** Distinct machine values, for a select. Empty for every other shape. */
  options: string[];
  /** Why this shape was chosen — copied into report.json verbatim. */
  reason: string;
}

/**
 * Infer one spec's shape from every value products actually gave it.
 *
 * Order matters and encodes a preference for the shape that keeps filtering
 * honest: boolean and number are index-backed and lossless when they apply;
 * a small closed set becomes a facet; everything else stays text, which
 * displays fine and simply does not filter.
 */
export function inferSpec(values: string[]): InferredSpec {
  const present = values.map((value) => value.trim()).filter(Boolean);
  if (present.length === 0) {
    return { valueType: 'string', unit: null, options: [], reason: 'no values present' };
  }

  if (present.every((value) => asBoolean(value) !== null)) {
    return {
      valueType: 'boolean',
      unit: null,
      options: [],
      reason: `all ${present.length} values are yes/no vocabulary`,
    };
  }

  const numbers = present.map(asNumber);
  if (numbers.every((parsed) => parsed !== null)) {
    const units = new Set(numbers.map((parsed) => parsed!.unit).filter(Boolean));
    // Mixed units on one spec cannot be compared, so it is text after all.
    if (units.size <= 1) {
      return {
        valueType: 'number',
        unit: [...units][0] ?? null,
        options: [],
        reason: `all ${present.length} values parse as a number${units.size ? ` in ${[...units][0]}` : ''}`,
      };
    }
  }

  const ranges = present.map(asRange);
  if (ranges.every((parsed) => parsed !== null)) {
    const units = new Set(ranges.map((parsed) => parsed!.unit).filter(Boolean));
    if (units.size <= 1) {
      return {
        valueType: 'number_range',
        unit: [...units][0] ?? null,
        options: [],
        reason: `all ${present.length} values parse as a min–max range`,
      };
    }
  }

  const distinct = [...new Set(present.map(norm))];
  // A closed set worth faceting: few enough options to list, and genuinely
  // repeated rather than one free-text answer per product.
  if (distinct.length >= 2 && distinct.length <= 12 && distinct.length < present.length) {
    return {
      valueType: 'single_select',
      unit: null,
      options: distinct,
      reason: `${distinct.length} distinct values across ${present.length} products`,
    };
  }

  return {
    valueType: 'string',
    unit: null,
    options: [],
    reason: `${distinct.length} distinct free-text values across ${present.length} products`,
  };
}

/**
 * Only these shapes support a facet filter that hits an index. A `string` spec
 * is displayed and compared but never filtered — `product_spec_values.textValue`
 * is jsonb with no trigram index behind it.
 */
export function isFilterableType(valueType: ValueType): boolean {
  return valueType === 'boolean' || valueType === 'number' || valueType === 'single_select';
}

// --- model → product matching ----------------------------------------------

/**
 * The curated tables describe *models* ("Fantastica", "1 Piazza (90 CM)"),
 * not WooCommerce posts, so their values only reach a product through a name
 * match. `tokens` is the plugin's own tokenisation of the model label; a model
 * claims a product when every one of its tokens appears in the product's
 * title.
 *
 * Every match and every miss goes in the report: this is the least certain
 * step in the whole migration, and the JSON review exists mostly for it.
 */
export function matchModelToProducts(
  tokens: string[],
  products: Array<{ id: string; title: string }>,
): string[] {
  const meaningful = tokens.map(norm).filter((token) => token.length > 1);
  if (meaningful.length === 0) return [];
  return products
    .filter((product) => {
      const title = norm(product.title);
      return meaningful.every((token) => title.includes(token));
    })
    .map((product) => product.id);
}

// --- misc -------------------------------------------------------------------

/** `KeySchema`-safe machine key from an Italian label. */
export const specKey = (label: string): string => slugify(label, 'spec');

/** Italian-only translations map, the only language this dump holds. */
export const italianOnly = <T>(value: T): Partial<Record<LanguageCode, T>> => ({ it: value });
