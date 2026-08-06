import { CreateProductSchema, ProductQuerySchema, SlugSchema } from '@mia/validators';
import * as v from 'valibot';

/**
 * Module-owned validation. Cross-app contracts live in `@mia/validators` so the
 * frontends can reuse them; anything only this module needs is defined here.
 */
export const ProductSlugParamSchema = v.object({ slug: SlugSchema });

export { CreateProductSchema, ProductQuerySchema };
