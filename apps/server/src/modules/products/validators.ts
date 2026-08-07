import {
  AddonInputSchema,
  CreateProductSchema,
  FaqInputSchema,
  LocaleOnlyQuerySchema,
  LocaleQuerySchema,
  ProductQuerySchema,
  ProductSlugParamSchema,
  ProductTermsInputSchema,
  QuestionInputSchema,
  SkuUpdateSchema,
  SpecValuesInputSchema,
  UpdateProductSchema,
  UuidSchema,
  VariantGroupInputSchema,
} from '@mia/validators';
import * as v from 'valibot';

/**
 * Module-owned validation. Cross-app contracts live in `@mia/validators` so
 * the frontends reuse them; anything only this module needs is defined here.
 */

export const ProductIdParamSchema = v.object({ id: UuidSchema });
export const ProductSkuParamSchema = v.object({ id: UuidSchema, skuId: UuidSchema });

export const VariantGroupsPutSchema = v.pipe(
  v.array(VariantGroupInputSchema),
  v.maxLength(30, 'Too many variant groups.'),
);

export const AddonsPutSchema = v.pipe(v.array(AddonInputSchema), v.maxLength(50));
export const FaqsPutSchema = v.pipe(v.array(FaqInputSchema), v.maxLength(100));
export const QuestionsPutSchema = v.pipe(v.array(QuestionInputSchema), v.maxLength(50));

export const AdminProductQuerySchema = v.object({
  page: ProductQuerySchema.entries.page,
  perPage: ProductQuerySchema.entries.perPage,
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  status: v.optional(v.picklist(['draft', 'active', 'archived'])),
  category: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(64))),
  // The admin client appends this on every read: which language list titles
  // and search resolve in. Reading only — editing payloads stay bilingual.
  locale: LocaleQuerySchema,
});

export {
  CreateProductSchema,
  LocaleOnlyQuerySchema,
  ProductQuerySchema,
  ProductSlugParamSchema,
  ProductTermsInputSchema,
  SkuUpdateSchema,
  SpecValuesInputSchema,
  UpdateProductSchema,
};
