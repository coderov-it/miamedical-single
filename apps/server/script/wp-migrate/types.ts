import type { Localized, RentalPackage } from '@mia/db/schema';

/**
 * The shape of the JSON chunks written by `extract.ts` and read by `load.ts`.
 *
 * These are a review format first and a transport format second. Every row
 * carries its WordPress origin (`wpPostId`, `wpTermId`) and, where a value was
 * inferred rather than copied, a `needsReview` list naming the fields to look
 * at — so a reviewer can open a chunk, sort by that field, and fix the handful
 * of rows that actually need a human.
 */

export interface TranslationChunk {
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

/** One downloadable file on the live site, with the origin that names its key. */
export interface MediaSource {
  wpAttachmentId: number;
  /** Absolute URL on the live site — what the loader downloads. */
  url: string;
  mimeType: string;
  alt: string | null;
}

export interface CategoryChunk {
  id: string;
  wpTermId: number;
  code: string;
  /**
   * Which WooCommerce root this category hung under. Not a column — it is how
   * products in this category get their `pricing_mode`.
   */
  treePricingMode: 'fixed' | 'rental';
  position: number;
  isActive: boolean;
  /** R2 key, written by `load` from `iconSource`. Always null out of `extract`. */
  icon: string | null;
  /**
   * The WooCommerce category image (`wp_termmeta.thumbnail_id`) as the live site
   * still serves it. `load` downloads it, squares it to 256 and puts the
   * resulting key in `icon`. Null when the term carried no thumbnail.
   */
  iconSource: MediaSource | null;
  name: Localized;
  slug: string;
  description: string | null;
}

export interface SpecOptionChunk {
  id: string;
  value: string;
  label: Localized;
  position: number;
}

export interface SpecChunk {
  id: string;
  categoryId: string;
  categoryCode: string;
  key: string;
  label: Localized;
  valueType: string;
  unit: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  position: number;
  /** `mia_compare:<group>` or `wc_attribute:<name>` — provenance, for review. */
  source: string;
  /** Why this `valueType` was chosen. */
  inferenceReason: string;
  options: SpecOptionChunk[];
}

export interface ProductChunk {
  id: string;
  wpPostId: number;
  baseSku: string;
  status: 'draft' | 'active' | 'archived';
  categoryId: string;
  categoryCode: string;
  brand: string | null;
  pricingMode: 'fixed' | 'rental';
  /** Fixed products only. NULL on a rental, whose packages are its price. */
  basePrice: string | null;
  /** Rental products only: the rate the old site advertised. Display copy. */
  marketingRate: string | null;
  currency: string;
  rentalUnit: 'hour' | 'day' | null;
  isFeatured: boolean;
  rentalPackages: RentalPackage[];
  translation: TranslationChunk;
  /** Field names whose value was guessed or defaulted. Empty when clean. */
  needsReview: string[];
}

export interface SpecValueChunk {
  productId: string;
  wpPostId: number;
  specId: string;
  categoryCode: string;
  specKey: string;
  /** The original text, kept so a reviewer can see what was coerced. */
  rawValue: string;
  numberValue: number | null;
  numberMin: number | null;
  numberMax: number | null;
  booleanValue: boolean | null;
  textValue: Localized | null;
  optionIds: string[];
  source: string;
}

export interface VariantOptionChunk {
  id: string;
  value: string;
  label: Localized;
  skuCode: string | null;
  priceModifier: string;
  isDefault: boolean;
  position: number;
}

export interface VariantGroupChunk {
  id: string;
  productId: string;
  wpPostId: number;
  key: string;
  label: Localized;
  valueType: string;
  unit: string | null;
  isRequired: boolean;
  affectsSku: boolean;
  position: number;
  options: VariantOptionChunk[];
}

export type MediaRole = 'thumbnail' | 'gallery' | 'document' | 'video';

export interface MediaChunk {
  productId: string;
  wpPostId: number;
  wpAttachmentId: number;
  role: MediaRole;
  position: number;
  /** Absolute URL on the live site — what the loader downloads. */
  sourceUrl: string;
  mimeType: string;
  alt: string | null;
}

export interface AddonChunk {
  id: string;
  /** Empty means the addon was global in WooCommerce and needs assigning. */
  productIds: string[];
  name: Localized;
  description: Localized | null;
  pricingMode: 'fixed' | 'rental';
  price: string;
  minQuantity: number;
  maxQuantity: number | null;
  position: number;
  needsReview: string[];
}

export interface ReportEntry {
  kind: string;
  wpId: number | null;
  subject: string;
  detail: string;
}

export interface Report {
  generatedAt: string;
  source: { host: string; database: string };
  counts: Record<string, number>;
  /** Read this. Every inference, fallback and dropped row lands here. */
  entries: ReportEntry[];
}

/**
 * One load's worth of chunks, after `--only-categories` has narrowed them.
 * Passed around whole because validation, the row writes and the media pass all
 * need to cross-reference the same set — a product's category, a spec value's
 * product — and splitting them into arguments only invites a mismatched pair.
 */
export interface LoadPlan {
  categories: CategoryChunk[];
  specs: SpecChunk[];
  products: ProductChunk[];
  specValues: SpecValueChunk[];
  variantGroups: VariantGroupChunk[];
  media: MediaChunk[];
  addons: AddonChunk[];
}
