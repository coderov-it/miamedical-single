/**
 * The resolved catalogue: what the authored files mean once ids are assigned,
 * slugs derived, defaults filled and spec values routed into typed columns.
 *
 * `plan-category.ts` and `plan-product.ts` build it, `validate.ts` judges it,
 * `rows.ts` and `media.ts` write it. Types only — no logic lives here.
 */
import type { LanguageCode, Localized, RentalPackage } from '@mia/db/schema';

import type { AuthoredSpec } from './authored.ts';
import type { CoercedSpecValue } from './spec-values.ts';

/** A file the author named, resolved against the assets root. */
export interface PlannedAsset {
  /** Exactly what the JSON said — every error message quotes this. */
  ref: string;
  sourcePath: string;
  exists: boolean;
}

export interface PlannedTranslation {
  title: string;
  shortDescription: string | null;
  description: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  /** True when nothing in the file pinned it — the run prints what it invented. */
  slugDerived: boolean;
}

export type Translations = Partial<Record<LanguageCode, PlannedTranslation>>;

export interface PlannedSpecOption {
  id: string;
  value: string;
  label: Localized;
  position: number;
}

export interface PlannedSpec {
  id: string;
  categoryId: string;
  categoryCode: string;
  key: string;
  label: Localized;
  helpText: Localized | null;
  valueType: AuthoredSpec['valueType'];
  unit: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  icon: PlannedAsset | null;
  position: number;
  options: PlannedSpecOption[];
}

export interface PlannedCategory {
  id: string;
  code: string;
  /** File name without the extension — every message says where to go and fix it. */
  file: string;
  position: number;
  isActive: boolean;
  requiresDeposit: boolean;
  icon: PlannedAsset | null;
  translations: Translations;
  specs: PlannedSpec[];
}

export interface PlannedSpecValue extends CoercedSpecValue {
  productId: string;
  specId: string;
  specKey: string;
}

export type MediaRole = 'thumbnail' | 'cleanPng' | 'gallery' | 'video' | 'document';

export interface PlannedMedia {
  role: MediaRole;
  position: number;
  asset: PlannedAsset;
  alt: Localized | null;
}

export interface PlannedAddon {
  id: string;
  name: Localized;
  description: Localized | null;
  pricingMode: 'fixed' | 'rental';
  price: string;
  currency: string;
  rentalUnit: 'hour' | 'day' | null;
  minQuantity: number;
  maxQuantity: number | null;
  icon: PlannedAsset | null;
  position: number;
}

export interface PlannedFaq {
  id: string;
  question: Localized;
  answer: Localized;
  position: number;
  isActive: boolean;
}

export interface PlannedQuestionOption {
  id: string;
  value: string;
  label: Localized;
  position: number;
}

export interface PlannedQuestion {
  id: string;
  key: string;
  prompt: Localized;
  helpText: Localized | null;
  questionValueType:
    'string' | 'text' | 'number' | 'single_select' | 'multi_select' | 'boolean' | 'date';
  isRequired: boolean;
  minValue: number | null;
  maxValue: number | null;
  maxLength: number | null;
  position: number;
  options: PlannedQuestionOption[];
}

export interface PlannedProduct {
  id: string;
  code: string;
  file: string;
  categoryId: string;
  categoryCode: string;
  status: 'draft' | 'active' | 'archived';
  brand: string | null;
  pricingMode: 'fixed' | 'rental';
  basePrice: string | null;
  marketingRate: string | null;
  currency: string;
  rentalUnit: 'hour' | 'day' | null;
  rentalPackages: RentalPackage[];
  stock: number;
  isFeatured: boolean;
  chips: Localized[];
  translations: Translations;
  specValues: PlannedSpecValue[];
  media: PlannedMedia[];
  addons: PlannedAddon[];
  faqs: PlannedFaq[];
  questions: PlannedQuestion[];
}

export interface CatalogPlan {
  categories: PlannedCategory[];
  products: PlannedProduct[];
  /**
   * Values that could not be placed at all — an unknown spec key, a range whose
   * min is above its max. Fatal, and reported next to the schema failures.
   */
  problems: string[];
}
