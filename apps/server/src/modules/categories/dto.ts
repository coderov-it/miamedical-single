import type { LanguageCode, Localized } from '@mia/db/schema';

// --- public ----------------------------------------------------------------

export interface PublicSpecOptionDto {
  id: string;
  value: string;
  label: string;
  position: number;
}

export interface PublicCategorySpecDto {
  id: string;
  key: string;
  label: string;
  helpText: string | null;
  valueType: string;
  unit: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  icon: string | null;
  position: number;
  options: PublicSpecOptionDto[];
}

/**
 * What a category tile says under its name. `fromPrice` is the cheapest
 * headline figure inside the category — a rental's promo rate if one is typed,
 * otherwise its cheapest package — and `pricingMode` says whether that figure
 * takes a per-unit label. Both are null for a category whose products carry no
 * price at all, which is when the tile falls back to `productCount`.
 */
export interface PublicCategorySummaryDto {
  productCount: number;
  /** A decimal string, like every other amount on the wire — never a JS number. */
  fromPrice: string | null;
  currency: string | null;
  pricingMode: 'fixed' | 'rental' | null;
  rentalUnit: 'hour' | 'day' | null;
}

export interface PublicCategoryDto {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  position: number;
  /** Storefront tile data. Zero products and no price on an empty category. */
  summary: PublicCategorySummaryDto;
  specs: PublicCategorySpecDto[];
}

// --- admin -----------------------------------------------------------------

export interface AdminCategoryTranslationDto {
  name: string;
  description: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface AdminSpecOptionDto {
  id: string;
  value: string;
  label: Localized;
  position: number;
}

export interface AdminCategorySpecDto {
  id: string;
  key: string;
  label: Localized;
  helpText: Localized | null;
  valueType: string;
  unit: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  icon: string | null;
  position: number;
  options: AdminSpecOptionDto[];
}

export interface AdminCategoryDto {
  id: string;
  code: string;
  icon: string | null;
  position: number;
  isActive: boolean;
  /** Rentals in this category sign the deposit (scooter) contract variant. */
  requiresDeposit: boolean;
  translations: Partial<Record<LanguageCode, AdminCategoryTranslationDto>>;
  specs: AdminCategorySpecDto[];
  createdAt: string;
  updatedAt: string;
}
