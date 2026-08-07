import * as v from 'valibot';

import { PaginationSchema, SlugSchema, UuidSchema } from './common.ts';
import { LocaleQuerySchema, localizedSchema, translationsSchema } from './i18n.ts';
import { MediaPathSchema } from './media.ts';
import { ValueTypeSchema } from './product.ts';

const CodeSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/, 'Use lowercase letters, numbers, - and _.'),
);

export const CategoryTranslationFields = {
  name: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
  description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(5000)))),
  slug: SlugSchema,
  metaTitle: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(200)))),
  metaDescription: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(400)))),
};

export const CategoryTranslationsSchema = translationsSchema(CategoryTranslationFields);

export const CreateCategorySchema = v.strictObject({
  code: CodeSchema,
  icon: v.optional(v.nullable(MediaPathSchema)),
  position: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
  isActive: v.optional(v.boolean(), true),
  translations: CategoryTranslationsSchema,
});

export const UpdateCategorySchema = v.partial(CreateCategorySchema);

export const CategoryQuerySchema = v.object({
  ...PaginationSchema.entries,
  locale: LocaleQuerySchema,
});

export const CategoryIdParamSchema = v.object({ id: UuidSchema });

// --- specs -----------------------------------------------------------------

export const SpecOptionInputSchema = v.strictObject({
  id: v.optional(UuidSchema),
  value: CodeSchema,
  label: localizedSchema(200),
  position: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
});

export const SpecInputSchema = v.pipe(
  v.strictObject({
    id: v.optional(UuidSchema),
    key: CodeSchema,
    label: localizedSchema(200),
    helpText: v.optional(v.nullable(localizedSchema(500))),
    valueType: ValueTypeSchema,
    unit: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(20)))),
    isRequired: v.optional(v.boolean(), false),
    isFilterable: v.optional(v.boolean(), false),
    isComparable: v.optional(v.boolean(), false),
    icon: v.optional(v.nullable(MediaPathSchema)),
    position: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
    options: v.optional(v.pipe(v.array(SpecOptionInputSchema), v.maxLength(100)), []),
  }),
  v.forward(
    v.partialCheck(
      [['valueType'], ['options']],
      (input) =>
        ['single_select', 'multi_select'].includes(input.valueType)
          ? (input.options?.length ?? 0) > 0
          : true,
      'Select specs need at least one option.',
    ),
    ['options'],
  ),
);

export type CreateCategoryInput = v.InferOutput<typeof CreateCategorySchema>;
export type UpdateCategoryInput = v.InferOutput<typeof UpdateCategorySchema>;
export type SpecInput = v.InferOutput<typeof SpecInputSchema>;
export type SpecOptionInput = v.InferOutput<typeof SpecOptionInputSchema>;
