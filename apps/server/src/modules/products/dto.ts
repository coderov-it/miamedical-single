import type { LanguageCode, Localized, MediaAlt, ProductChip, RentalPackage } from '@mia/db/schema';

/**
 * Network contracts, consumed through the typed RPC client. Two surfaces:
 *
 * - Public (`/api/products`): every translated field already collapsed to a
 *   plain string for the requested locale, `en → it` fallback applied, with a
 *   sibling `*Locale: "it"` marker on fields that fell back.
 * - Admin (`/api/admin/products`): nothing collapsed — products carry a
 *   `translations` map, everything else its `{ it, en }` object, so one
 *   TranslatedInput component binds to every field.
 *
 * Money is always a two-decimal string. The unit that gives a rental amount
 * its meaning sits once on `pricing.rentalUnit`, never per amount.
 */

export interface MoneyDto {
  amount: string;
  currency: string;
}

export interface PricingDto {
  mode: 'fixed' | 'rental';
  rentalUnit: 'hour' | 'day' | null;
  currency: string;
  /** What a fixed product costs. `null` on a rental — its packages are the price. */
  price: string | null;
  /**
   * A rental's headline rate, for the line under the title: "da 1,10 € al
   * giorno". Copy the back office typed, quoted in `rentalUnit`, and never part
   * of any total — the packages are. `null` on a fixed product, and on a rental
   * that advertises no rate.
   */
  marketingRate: string | null;
  /**
   * The lowest figure this product can actually be had for: its own price when
   * fixed, its cheapest package when rental. A real total, unlike
   * `marketingRate` — it is what a card falls back to when no rate is typed, so
   * a listing never shows a rental with no price at all.
   */
  fromPrice: string | null;
}

/**
 * An add-on's price. Its own shape rather than `PricingDto`, because the two
 * differ on both counts: an add-on always has a price, and it never advertises
 * a headline rate — only a product does.
 */
export interface AddonPricingDto {
  mode: 'fixed' | 'rental';
  /** Set exactly when `mode` is `rental`: the unit `price` is quoted in. */
  rentalUnit: 'hour' | 'day' | null;
  currency: string;
  price: string;
}

/**
 * A rental package as the storefront renders it: `name` already collapsed to
 * the requested locale, `label` the ready-made "7 giorni" string. `price` is the
 * whole cost of the rental for `duration` — the price, not a modifier on one.
 */
export interface PublicRentalPackageDto {
  code: string;
  name: string;
  label: string;
  price: string;
  duration: number;
  unit: 'hour' | 'day';
}

export interface PageMetaDto {
  page: number;
  perPage: number;
  total: number;
  pageCount: number;
}

// --- public ----------------------------------------------------------------

export interface PublicMediaItemDto {
  path: string;
  mimeType: string;
  alt: string | null;
}

export interface PublicProductMediaDto {
  thumbnail: PublicMediaItemDto | null;
  cleanPng: PublicMediaItemDto | null;
  gallery: PublicMediaItemDto[];
  videos: PublicMediaItemDto[];
  documents: PublicMediaItemDto[];
}

export interface PublicCategoryRefDto {
  id: string;
  code: string;
  slug: string;
  name: string;
  icon: string | null;
}

export interface PublicVariantOptionDto {
  id: string;
  value: string;
  label: string;
  skuCode: string | null;
  isDefault: boolean;
  priceModifier: MoneyDto;
}

export interface PublicVariantGroupDto {
  id: string;
  key: string;
  label: string;
  helpText: string | null;
  valueType: string;
  unit: string | null;
  isRequired: boolean;
  affectsSku: boolean;
  position: number;
  icon: string | null;
  min: number | null;
  max: number | null;
  step: number | null;
  priceModifierPerUnit: MoneyDto | null;
  options: PublicVariantOptionDto[];
}

export interface PublicSkuDto {
  id: string;
  sku: string;
  /** `{ groupKey: optionValue }` for the combination this SKU materialises. */
  options: Record<string, string>;
  stock: number;
  inStock: boolean;
  isActive: boolean;
  /** `null` on a rental product, whose price is the chosen package. */
  price: MoneyDto | null;
}

export interface PublicSpecDto {
  id: string;
  key: string;
  label: string;
  valueType: string;
  unit: string | null;
  /** Typed raw value: number, boolean, option value(s) or text. */
  value: number | boolean | string | string[] | { min: number | null; max: number | null } | null;
  /** Ready-to-render, localized: "90 cm", "Acciaio verniciato", "Sì". */
  displayValue: string;
  isFilterable: boolean;
  isComparable: boolean;
  icon: string | null;
  position: number;
}

export interface PublicAddonDto {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  pricing: AddonPricingDto;
  minQuantity: number;
  maxQuantity: number | null;
  icon: string | null;
  position: number;
}

export interface PublicQuestionOptionDto {
  id: string;
  value: string;
  label: string;
}

export interface PublicQuestionDto {
  id: string;
  key: string;
  prompt: string;
  helpText: string | null;
  valueType: string;
  isRequired: boolean;
  min: number | null;
  max: number | null;
  maxLength: number | null;
  position: number;
  options: PublicQuestionOptionDto[];
}

export interface PublicFaqDto {
  id: string;
  question: string;
  answer: string;
  position: number;
}

export interface PublicTermsRefDto {
  id: string;
  code: string;
  slug: string;
  title: string;
  version: number;
  publishedAt: string | null;
}

export interface PublicProductDetailDto {
  id: string;
  slug: string;
  locale: LanguageCode;
  availableLocales: LanguageCode[];
  status: 'draft' | 'active' | 'archived';
  brand: string | null;
  baseSku: string;
  isFeatured: boolean;
  title: string;
  shortDescription: string | null;
  description: string | null;
  /** Present only when the field above fell back to Italian. */
  shortDescriptionLocale?: 'it';
  descriptionLocale?: 'it';
  seo: { title: string | null; description: string | null };
  /** Short display claims for the hero, already resolved to `locale`. */
  chips: string[];
  category: PublicCategoryRefDto;
  pricing: PricingDto;
  /** Empty on a fixed product, and never empty on a rental one — it IS the price. */
  rentalPackages: PublicRentalPackageDto[];
  media: PublicProductMediaDto;
  variants: PublicVariantGroupDto[];
  skus: PublicSkuDto[];
  specifications: PublicSpecDto[];
  addons: PublicAddonDto[];
  questions: PublicQuestionDto[];
  faqs: PublicFaqDto[];
  terms: PublicTermsRefDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicProductSummaryDto {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  status: 'draft' | 'active' | 'archived';
  brand: string | null;
  isFeatured: boolean;
  category: { slug: string; name: string };
  pricing: PricingDto;
  thumbnail: PublicMediaItemDto | null;
  /** Ready-to-render card chips — the product's own, or the legacy spec fallback. */
  chips: string[];
  inStock: boolean;
}

export interface FacetOptionDto {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}

export type FacetDto =
  | {
      key: string;
      label: string;
      valueType: 'single_select' | 'multi_select';
      options: FacetOptionDto[];
    }
  | {
      key: string;
      label: string;
      valueType: 'number' | 'number_range';
      unit: string | null;
      min: number | null;
      max: number | null;
    };

export interface ProductListResponseDto {
  data: PublicProductSummaryDto[];
  meta: PageMetaDto;
  facets: { specs: FacetDto[] };
}

// --- admin -----------------------------------------------------------------

export interface AdminMediaItemDto {
  path: string;
  mimeType: string;
  alt?: MediaAlt | undefined;
}

export interface AdminProductMediaDto {
  thumbnail: AdminMediaItemDto | null;
  cleanPng: AdminMediaItemDto | null;
  gallery: AdminMediaItemDto[];
  videos: AdminMediaItemDto[];
  documents: AdminMediaItemDto[];
}

export interface AdminProductTranslationDto {
  title: string;
  shortDescription: string | null;
  description: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface TranslationStatusDto {
  it: 'complete' | 'partial' | 'missing';
  en: 'complete' | 'partial' | 'missing';
  missing: Partial<Record<LanguageCode, string[]>>;
}

export interface AdminVariantOptionDto {
  id: string;
  value: string;
  skuCode: string | null;
  priceModifier: string;
  isDefault: boolean;
  position: number;
  label: Localized;
}

export interface AdminVariantGroupDto {
  id: string;
  key: string;
  valueType: string;
  unit: string | null;
  isRequired: boolean;
  affectsSku: boolean;
  sourcePresetKey: string | null;
  minValue: number | null;
  maxValue: number | null;
  stepValue: number | null;
  priceModifierPerUnit: string | null;
  icon: string | null;
  position: number;
  label: Localized;
  helpText: Localized | null;
  options: AdminVariantOptionDto[];
}

export interface AdminSkuDto {
  id: string;
  sku: string;
  suffix: string;
  comboKey: string;
  optionIds: string[];
  priceOverride: string | null;
  /** `null` on a rental product — see `resolveSkuPrice`. */
  resolvedPrice: string | null;
  stock: number;
  isActive: boolean;
  position: number;
}

export interface AdminSpecValueDto {
  specId: string;
  valueType: string;
  numberValue: number | null;
  numberMin: number | null;
  numberMax: number | null;
  booleanValue: boolean | null;
  optionIds: string[];
  textValue: Localized | null;
}

export interface AdminAddonDto {
  id: string;
  sku: string | null;
  pricingMode: 'fixed' | 'rental';
  productPricingMode: 'fixed' | 'rental';
  rentalUnit: 'hour' | 'day' | null;
  price: string;
  currency: string;
  minQuantity: number;
  maxQuantity: number | null;
  icon: string | null;
  position: number;
  name: Localized;
  description: Localized | null;
}

export interface AdminQuestionOptionDto {
  id: string;
  value: string;
  position: number;
  label: Localized;
}

export interface AdminQuestionDto {
  id: string;
  key: string;
  questionValueType: string;
  isRequired: boolean;
  minValue: number | null;
  maxValue: number | null;
  maxLength: number | null;
  position: number;
  prompt: Localized;
  helpText: Localized | null;
  options: AdminQuestionOptionDto[];
}

export interface AdminProductDetailDto {
  id: string;
  baseSku: string;
  status: 'draft' | 'active' | 'archived';
  categoryId: string;
  brand: string | null;
  isFeatured: boolean;
  pricingMode: 'fixed' | 'rental';
  /** Always true on an existing product — renders the disabled control. */
  pricingModeLocked: true;
  rentalUnit: 'hour' | 'day' | null;
  /** Fixed products only. `null` on a rental, which is priced by its packages. */
  basePrice: string | null;
  /** Rental products only, and display copy even there. */
  marketingRate: string | null;
  currency: string;
  /** Raw `{ it, en }` names, like every other admin field — nothing collapsed. */
  rentalPackages: RentalPackage[];
  /** Raw `{ it, en }` chips, in the order they render. */
  chips: ProductChip[];
  translations: Partial<Record<LanguageCode, AdminProductTranslationDto>>;
  translationStatus: TranslationStatusDto;
  variants: AdminVariantGroupDto[];
  skus: AdminSkuDto[];
  specValues: AdminSpecValueDto[];
  media: AdminProductMediaDto;
  addons: AdminAddonDto[];
  /** What the mode rule allows for this product — drives the addon editor. */
  allowedAddonModes: Array<'fixed' | 'rental'>;
  questions: AdminQuestionDto[];
  faqs: Array<{
    id: string;
    position: number;
    isActive: boolean;
    question: Localized;
    answer: Localized;
  }>;
  termsIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductSummaryDto {
  id: string;
  baseSku: string;
  status: 'draft' | 'active' | 'archived';
  brand: string | null;
  isFeatured: boolean;
  pricingMode: 'fixed' | 'rental';
  rentalUnit: 'hour' | 'day' | null;
  /** Fixed products only; a rental's price is its cheapest package. */
  basePrice: string | null;
  /** Rental products only, and display copy even there. */
  marketingRate: string | null;
  currency: string;
  title: string;
  slug: string;
  categoryName: string;
  translationStatus: TranslationStatusDto;
  /** Row thumbnail for the admin list. Path only — the client prefixes the CDN base. */
  thumbnail: string | null;
  updatedAt: string;
}
