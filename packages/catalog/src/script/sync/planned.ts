/**
 * The resolved catalogue: what the data files mean once ids are assigned,
 * slugs derived, defaults filled and spec values routed into typed columns.
 *
 * `plan.ts` and `plan-product.ts` build it, `validate.ts` judges it, `rows*.ts`
 * and `media.ts` write it. Types only — no logic lives here.
 *
 * Everything a message needs to name its subject is carried on the row itself
 * (`code`, `categoryCode`), because there is no file path to fall back on: a
 * category is a TypeScript value listed in `data/index.ts`, not a file the
 * runner opened.
 */
import type { LanguageCode, Localized, RentalPackage } from '@mia/db/schema';

import type { AnySpec } from '../../lib/types.ts';
import type { CoercedSpecValue } from './spec-values.ts';

/** A file the author named, resolved against the assets root. */
export interface PlannedAsset {
  /** Exactly what the data file said — every error message quotes this. */
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
  valueType: AnySpec['valueType'];
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

export type QuestionValueType =
  'string' | 'text' | 'number' | 'single_select' | 'multi_select' | 'boolean' | 'date';

export interface PlannedQuestion {
  id: string;
  key: string;
  prompt: Localized;
  helpText: Localized | null;
  questionValueType: QuestionValueType;
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
  /** Ids of the terms documents this product signs, in the order written. */
  termsIds: string[];
}

export interface PlannedTermsTranslation {
  title: string;
  body: string;
  slug: string;
}

/**
 * A terms document is a row of its own that products point AT, never a field
 * they own — two products showing the same conditions share one document, and
 * `product_terms` is what records that.
 */
export interface PlannedTerms {
  id: string;
  code: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  translations: Partial<Record<LanguageCode, PlannedTermsTranslation>>;
}

export interface CatalogPlan {
  categories: PlannedCategory[];
  products: PlannedProduct[];
  terms: PlannedTerms[];
  /**
   * Values that could not be placed at all — an undeclared spec key, a range
   * whose min is above its max, a price with more decimals than the column
   * keeps. Fatal, and reported next to the schema failures.
   */
  problems: string[];
}

/** What every message about a category or a product is prefixed with. */
export const whereCategory = (code: string): string => `category "${code}"`;
export const whereProduct = (categoryCode: string, code: string): string =>
  `${categoryCode} › product "${code}"`;
export const whereTerms = (code: string): string => `terms "${code}"`;
