import type {
  CategoryDto,
  ImageDto,
  MoneyDto,
  PageMetaDto,
  ProductDetailDto,
  ProductSummaryDto,
  VariantDto,
} from './dto.ts';
import type {
  CategoryRow,
  ImageRow,
  ProductSummaryRow,
  ProductWithRelations,
  VariantRow,
} from './types.ts';

const money = (cents: number, currency: string): MoneyDto => ({ cents, currency });

const toImage = (row: ImageRow): ImageDto => ({ url: row.url, alt: row.alt });

const toCategory = (row: CategoryRow): CategoryDto => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
});

export function toVariant(row: VariantRow): VariantDto {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    price: money(row.priceCents, row.currency),
    compareAtPrice:
      row.compareAtPriceCents === null ? null : money(row.compareAtPriceCents, row.currency),
    stock: row.stock,
    inStock: row.stock > 0,
    options: row.options,
  };
}

export function toProductSummary(row: ProductSummaryRow): ProductSummaryDto {
  const cheapest = row.variants.reduce<VariantRow | null>(
    (lowest, variant) =>
      lowest === null || variant.priceCents < lowest.priceCents ? variant : lowest,
    null,
  );

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    status: row.status,
    priceFrom: cheapest ? money(cheapest.priceCents, cheapest.currency) : null,
    variantCount: row.variants.length,
    image: row.images[0] ? toImage(row.images[0]) : null,
  };
}

export function toProductDetail(row: ProductWithRelations): ProductDetailDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    brand: row.brand,
    status: row.status,
    variants: row.variants.map(toVariant),
    images: row.images.map(toImage),
    categories: row.categories.map((link) => toCategory(link.category)),
  };
}

export function toPageMeta(page: number, perPage: number, total: number): PageMetaDto {
  return { page, perPage, total, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}
