/**
 * Network contracts. These are what the website and admin actually consume via
 * the typed RPC client, so they are deliberately decoupled from the database
 * rows — internal columns and timestamps do not leak onto the wire.
 */

export interface MoneyDto {
  cents: number;
  currency: string;
}

export interface ImageDto {
  url: string;
  alt: string | null;
}

export interface VariantDto {
  id: string;
  sku: string;
  name: string;
  price: MoneyDto;
  compareAtPrice: MoneyDto | null;
  stock: number;
  inStock: boolean;
  options: Record<string, string>;
}

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
}

export interface ProductSummaryDto {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  status: 'draft' | 'active' | 'archived';
  /** Lowest variant price, or null when the product has no variants. */
  priceFrom: MoneyDto | null;
  variantCount: number;
  image: ImageDto | null;
}

export interface ProductDetailDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  brand: string | null;
  status: 'draft' | 'active' | 'archived';
  variants: VariantDto[];
  images: ImageDto[];
  categories: CategoryDto[];
}

export interface PageMetaDto {
  page: number;
  perPage: number;
  total: number;
  pageCount: number;
}

export interface PaginatedDto<T> {
  data: T[];
  meta: PageMetaDto;
}
