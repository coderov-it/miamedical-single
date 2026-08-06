import type { categories, productImages, productVariants, products } from '@mia/db/schema';

/** Plain database records. Repo returns these; nothing outside the module sees them. */
export type ProductRow = typeof products.$inferSelect;
export type VariantRow = typeof productVariants.$inferSelect;
export type ImageRow = typeof productImages.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;

export interface ProductWithRelations extends ProductRow {
  variants: VariantRow[];
  images: ImageRow[];
  categories: { category: CategoryRow }[];
}

/** Listing rows carry a single lead image rather than the full gallery. */
export interface ProductSummaryRow extends ProductRow {
  variants: VariantRow[];
  images: ImageRow[];
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name';

export interface ProductListFilters {
  page: number;
  perPage: number;
  q?: string | undefined;
  status?: ProductRow['status'] | undefined;
  sort: ProductSort;
  /** Set by the service from the caller's role — the repo never reads auth state. */
  includeNonActive: boolean;
}
