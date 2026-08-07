import * as v from 'valibot';

import { PaginationSchema, SlugSchema, UuidSchema } from './common.ts';
import { LocaleQuerySchema, translationsSchema } from './i18n.ts';

const CodeSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/, 'Use lowercase letters, numbers, - and _.'),
);

export const TermsStatusSchema = v.picklist(['draft', 'published', 'archived']);

export const TermsTranslationFields = {
  title: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(200)),
  body: v.pipe(v.string(), v.minLength(1), v.maxLength(200_000)),
  slug: SlugSchema,
};

export const TermsTranslationsSchema = translationsSchema(TermsTranslationFields);

export const CreateTermsSchema = v.strictObject({
  code: CodeSchema,
  translations: TermsTranslationsSchema,
});

export const UpdateTermsSchema = v.partial(
  v.strictObject({
    code: CodeSchema,
    translations: TermsTranslationsSchema,
  }),
);

/** draft → published → archived; publishing bumps `version` in the service. */
export const TermsStatusChangeSchema = v.strictObject({
  status: TermsStatusSchema,
});

export const TermsQuerySchema = v.object({
  ...PaginationSchema.entries,
  locale: LocaleQuerySchema,
  status: v.optional(TermsStatusSchema),
});

export const TermsIdParamSchema = v.object({ id: UuidSchema });
export const TermsSlugParamSchema = v.object({ slug: SlugSchema });

export type CreateTermsInput = v.InferOutput<typeof CreateTermsSchema>;
export type UpdateTermsInput = v.InferOutput<typeof UpdateTermsSchema>;
export type TermsQuery = v.InferOutput<typeof TermsQuerySchema>;
