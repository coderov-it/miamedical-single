import * as v from 'valibot';

import { CentsSchema, CurrencySchema, PaginationSchema, SlugSchema, UuidSchema } from './common.ts';

export const ProductStatusSchema = v.picklist(['draft', 'active', 'archived']);

export const VariantInputSchema = v.object({
  sku: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
  priceCents: CentsSchema,
  compareAtPriceCents: v.optional(v.nullable(CentsSchema)),
  currency: v.optional(CurrencySchema, 'USD'),
  stock: v.pipe(v.number(), v.integer(), v.minValue(0)),
  weightGrams: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0)))),
  options: v.optional(v.record(v.string(), v.string()), {}),
  isDefault: v.optional(v.boolean(), false),
});

export const CreateProductSchema = v.object({
  slug: SlugSchema,
  name: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(200)),
  description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(10_000)))),
  status: v.optional(ProductStatusSchema, 'draft'),
  brand: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(120)))),
  categoryIds: v.optional(v.array(UuidSchema), []),
  variants: v.pipe(v.array(VariantInputSchema), v.minLength(1, 'Add at least one variant.')),
  metadata: v.optional(v.record(v.string(), v.unknown()), {}),
});

export const UpdateProductSchema = v.partial(v.omit(CreateProductSchema, ['variants']));

export const ProductQuerySchema = v.object({
  ...PaginationSchema.entries,
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  category: v.optional(SlugSchema),
  status: v.optional(ProductStatusSchema),
  sort: v.optional(v.picklist(['newest', 'price_asc', 'price_desc', 'name']), 'newest'),
});

export type CreateProductInput = v.InferOutput<typeof CreateProductSchema>;
export type UpdateProductInput = v.InferOutput<typeof UpdateProductSchema>;
export type ProductQuery = v.InferOutput<typeof ProductQuerySchema>;
