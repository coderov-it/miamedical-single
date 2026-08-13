import * as v from 'valibot';

import { PaginationSchema, SlugSchema, UuidSchema } from './common.ts';
import { LocaleQuerySchema, LocalizedSchema, translationsSchema } from './i18n.ts';

export const BlogPostStatusSchema = v.picklist(['draft', 'published', 'archived']);

export const BlogTranslationFields = {
  title: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(200)),
  slug: SlugSchema,
  body: v.pipe(v.string(), v.minLength(1), v.maxLength(500_000)),
  excerpt: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(500))),
  metaTitle: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  metaDescription: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(300))),
};

export const BlogTranslationsSchema = translationsSchema(BlogTranslationFields);

export const CreateBlogPostSchema = v.strictObject({
  translations: BlogTranslationsSchema,
  featuredImage: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(500)))),
  categoryIds: v.optional(v.pipe(v.array(UuidSchema), v.maxLength(10)), []),
});

export const UpdateBlogPostSchema = v.partial(
  v.strictObject({
    translations: BlogTranslationsSchema,
    featuredImage: v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(500))),
    categoryIds: v.pipe(v.array(UuidSchema), v.maxLength(10)),
    publishedAt: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
  }),
);

export const BlogPostStatusChangeSchema = v.strictObject({
  status: BlogPostStatusSchema,
});

export const BlogPostQuerySchema = v.object({
  ...PaginationSchema.entries,
  locale: LocaleQuerySchema,
  status: v.optional(BlogPostStatusSchema),
  category: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(64))),
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
});

export const BlogPostIdParamSchema = v.object({ id: UuidSchema });
export const BlogPostSlugParamSchema = v.object({ slug: SlugSchema });

const CodeSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/, 'Use lowercase letters, numbers, - and _.'),
);

export const CreateBlogCategorySchema = v.strictObject({
  code: CodeSchema,
  name: LocalizedSchema,
  slug: SlugSchema,
  position: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
});

export const UpdateBlogCategorySchema = v.partial(
  v.strictObject({
    code: CodeSchema,
    name: LocalizedSchema,
    slug: SlugSchema,
    position: v.pipe(v.number(), v.integer(), v.minValue(0)),
    isActive: v.boolean(),
  }),
);

export const BlogCategoryIdParamSchema = v.object({ id: UuidSchema });

export const PublicBlogQuerySchema = v.object({
  ...PaginationSchema.entries,
  locale: LocaleQuerySchema,
  category: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(64))),
});

export type BlogPostStatus = v.InferOutput<typeof BlogPostStatusSchema>;
export type CreateBlogPostInput = v.InferOutput<typeof CreateBlogPostSchema>;
export type UpdateBlogPostInput = v.InferOutput<typeof UpdateBlogPostSchema>;
export type BlogPostQuery = v.InferOutput<typeof BlogPostQuerySchema>;
export type CreateBlogCategoryInput = v.InferOutput<typeof CreateBlogCategorySchema>;
export type UpdateBlogCategoryInput = v.InferOutput<typeof UpdateBlogCategorySchema>;
