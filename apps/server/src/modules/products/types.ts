import type {
  categories,
  categorySpecOptions,
  categorySpecs,
  productAddons,
  productFaqs,
  productQuestionOptions,
  productQuestions,
  productSkuOptions,
  productSkus,
  productSpecValueOptions,
  productSpecValues,
  productTerms,
  productTranslations,
  productVariantGroups,
  productVariantOptions,
  products,
  termsDocumentTranslations,
  termsDocuments,
} from '@mia/db/schema';

/** Plain database records. Repo returns these; nothing outside the module sees them. */
export type ProductRow = typeof products.$inferSelect;
export type ProductTranslationRow = typeof productTranslations.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type SpecRow = typeof categorySpecs.$inferSelect;
export type SpecOptionRow = typeof categorySpecOptions.$inferSelect;
export type SpecValueRow = typeof productSpecValues.$inferSelect;
export type SpecValueOptionRow = typeof productSpecValueOptions.$inferSelect;
export type VariantGroupRow = typeof productVariantGroups.$inferSelect;
export type VariantOptionRow = typeof productVariantOptions.$inferSelect;
export type SkuRow = typeof productSkus.$inferSelect;
export type SkuOptionRow = typeof productSkuOptions.$inferSelect;
export type AddonRow = typeof productAddons.$inferSelect;
export type FaqRow = typeof productFaqs.$inferSelect;
export type QuestionRow = typeof productQuestions.$inferSelect;
export type QuestionOptionRow = typeof productQuestionOptions.$inferSelect;
export type ProductTermsRow = typeof productTerms.$inferSelect;
export type TermsRow = typeof termsDocuments.$inferSelect;
export type TermsTranslationRow = typeof termsDocumentTranslations.$inferSelect;

export interface VariantGroupWithOptions extends VariantGroupRow {
  options: VariantOptionRow[];
}

export interface QuestionWithOptions extends QuestionRow {
  options: QuestionOptionRow[];
}

export interface SkuWithOptions extends SkuRow {
  options: SkuOptionRow[];
}

export interface SpecValueWithOptions extends SpecValueRow {
  optionIds: string[];
}

export interface CategoryWithTranslations extends CategoryRow {
  translations: { languageCode: 'it' | 'en'; name: string; slug: string }[];
}

/** Everything one product page needs — one relational query. */
export interface ProductAggregate extends ProductRow {
  translations: ProductTranslationRow[];
  category: CategoryWithTranslations;
  variantGroups: VariantGroupWithOptions[];
  skus: SkuWithOptions[];
  specValues: SpecValueRow[];
  specValueOptions: SpecValueOptionRow[];
  addons: AddonRow[];
  faqs: FaqRow[];
  questions: QuestionWithOptions[];
  terms: Array<ProductTermsRow & { terms: TermsRow & { translations: TermsTranslationRow[] } }>;
  /** The category's spec definitions — needed to render spec values. */
  specs: Array<SpecRow & { options: SpecOptionRow[] }>;
}

/** Card projection for the list endpoint. */
export interface ProductSummaryRowData extends ProductRow {
  translations: ProductTranslationRow[];
  category: CategoryWithTranslations;
  inStock: boolean;
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'title';

export interface SpecFilter {
  key: string;
  /** Select values, e.g. ['acciaio', 'alluminio']. */
  values?: string[];
  /** Numeric range. */
  min?: number;
  max?: number;
  /** Boolean specs. */
  boolean?: boolean;
}

export interface ProductListFilters {
  page: number;
  perPage: number;
  locale: 'it' | 'en';
  q?: string | undefined;
  categoryId?: string | undefined;
  status?: ProductRow['status'] | undefined;
  featured?: boolean | undefined;
  sort: ProductSort;
  specFilters: SpecFilter[];
  /** Set by the service from the caller's permissions — repo never reads auth. */
  includeNonActive: boolean;
}
