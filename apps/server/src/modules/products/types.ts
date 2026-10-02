import type {
  LanguageCode,
  categories,
  categorySpecOptions,
  categorySpecs,
  productAddons,
  productFaqs,
  productQuestionOptions,
  productQuestions,
  productSpecValueOptions,
  productSpecValues,
  productTerms,
  productTranslations,
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
export type AddonRow = typeof productAddons.$inferSelect;
export type FaqRow = typeof productFaqs.$inferSelect;
export type QuestionRow = typeof productQuestions.$inferSelect;
export type QuestionOptionRow = typeof productQuestionOptions.$inferSelect;
export type ProductTermsRow = typeof productTerms.$inferSelect;
export type TermsRow = typeof termsDocuments.$inferSelect;
export type TermsTranslationRow = typeof termsDocumentTranslations.$inferSelect;

export interface QuestionWithOptions extends QuestionRow {
  options: QuestionOptionRow[];
}

export interface SpecValueWithOptions extends SpecValueRow {
  optionIds: string[];
}

export interface CategoryWithTranslations extends CategoryRow {
  translations: { languageCode: LanguageCode; name: string; slug: string }[];
}

/** Everything one product page needs — one relational query. */
export interface ProductAggregate extends ProductRow {
  translations: ProductTranslationRow[];
  category: CategoryWithTranslations;
  specValues: SpecValueRow[];
  specValueOptions: SpecValueOptionRow[];
  addons: AddonRow[];
  faqs: FaqRow[];
  questions: QuestionWithOptions[];
  terms: Array<ProductTermsRow & { terms: TermsRow & { translations: TermsTranslationRow[] } }>;
  /** The category's spec definitions — needed to render spec values. */
  specs: Array<SpecRow & { options: SpecOptionRow[] }>;
}

// --- list read model ------------------------------------------------------
//
// A listing loads only what a card shows — docs/code/catalog-list-read-model.md.
// Full rows (`ProductAggregate`) satisfy every one of these shapes, so the
// product page and the cards share the mapper functions below them.

/** The spec columns a rendered spec reads, with its options. */
export type SpecDefinition = Pick<
  SpecRow,
  | 'id'
  | 'key'
  | 'label'
  | 'valueType'
  | 'unit'
  | 'isFilterable'
  | 'isComparable'
  | 'icon'
  | 'position'
> & { options: Pick<SpecOptionRow, 'id' | 'value' | 'label'>[] };

export type SpecValueData = Pick<
  SpecValueRow,
  'specId' | 'numberValue' | 'numberMin' | 'numberMax' | 'booleanValue' | 'textValue'
>;

export type SpecValueOptionLink = Pick<SpecValueOptionRow, 'specId' | 'optionId'>;

/** Every field translation status measures — see `toTranslationStatus`. */
export type TranslationStatusRow = Pick<
  ProductTranslationRow,
  | 'languageCode'
  | 'title'
  | 'shortDescription'
  | 'description'
  | 'slug'
  | 'metaTitle'
  | 'metaDescription'
>;

/** A card's category: its code plus the requested locale's and Italian's names. */
export interface SummaryCategory {
  id: string;
  code: string;
  translations: { languageCode: LanguageCode; name: string; slug: string }[];
}

type SummaryColumns =
  | 'id'
  | 'categoryId'
  | 'status'
  | 'brand'
  | 'isFeatured'
  | 'pricingMode'
  | 'rentalUnit'
  | 'currency'
  | 'basePrice'
  | 'marketingRate'
  | 'stock'
  | 'media'
  | 'updatedAt';

/** A storefront card. */
export interface PublicSummaryRowData extends Pick<
  ProductRow,
  SummaryColumns | 'rentalPackages' | 'chips'
> {
  /** Every language the product has a translation row in. */
  availableLocales: LanguageCode[];
  /** The requested locale and Italian only, and only what a card prints. */
  translations: Pick<
    ProductTranslationRow,
    'languageCode' | 'title' | 'slug' | 'shortDescription'
  >[];
  category: SummaryCategory;
  /**
   * The spec-tag fallback's input — loaded only for a product with no chips,
   * and only its category's comparable specs (the only ones a tag can show).
   * The `specs` array is shared by every card of the same category.
   */
  specs: SpecDefinition[];
  specValues: SpecValueData[];
  specValueOptions: SpecValueOptionLink[];
}

/** A back-office list row. */
export interface AdminSummaryRowData extends Pick<ProductRow, SummaryColumns> {
  /**
   * Every language, for the translation status. `description` is its first
   * character only: the status asks whether a field is empty, never what it says.
   */
  translations: TranslationStatusRow[];
  category: SummaryCategory;
}

export type ProductSort = 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'title';

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
  locale: LanguageCode;
  q?: string | undefined;
  categoryId?: string | undefined;
  /** Pricing mode, which is what the rental and sale catalogues filter on. */
  mode?: ProductRow['pricingMode'] | undefined;
  status?: ProductRow['status'] | undefined;
  featured?: boolean | undefined;
  sort: ProductSort;
  /**
   * Rental products lead the page and sale products follow, above whatever
   * `sort` asks for. Set by the service: on for a storefront listing that mixes
   * both modes, off once `mode` has picked one and off in the back office.
   */
  rentalFirst: boolean;
  specFilters: SpecFilter[];
  /** Set by the service from the caller's permissions — repo never reads auth. */
  includeNonActive: boolean;
}
