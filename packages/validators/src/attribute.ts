import * as v from 'valibot';

import { UuidSchema } from './common.ts';
import { localizedSchema } from './i18n.ts';
import { MediaPathSchema } from './media.ts';
import { ValueTypeSchema } from './product.ts';

const CodeSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/, 'Use lowercase letters, numbers, - and _.'),
);

const SkuFragmentSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/i, 'Use letters, numbers and hyphens.'),
  v.toUpperCase(),
);

export const PresetOptionInputSchema = v.strictObject({
  id: v.optional(UuidSchema),
  value: CodeSchema,
  label: localizedSchema(120),
  skuCode: v.optional(v.nullable(SkuFragmentSchema)),
  position: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
});

export const PresetInputSchema = v.strictObject({
  key: CodeSchema,
  label: localizedSchema(120),
  valueType: ValueTypeSchema,
  unit: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(20)))),
  isActive: v.optional(v.boolean(), true),
  icon: v.optional(v.nullable(MediaPathSchema)),
  position: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
  options: v.optional(v.pipe(v.array(PresetOptionInputSchema), v.maxLength(100)), []),
});

export const UpdatePresetSchema = v.partial(PresetInputSchema);

export const PresetIdParamSchema = v.object({ id: UuidSchema });

export type PresetInput = v.InferOutput<typeof PresetInputSchema>;
export type UpdatePresetInput = v.InferOutput<typeof UpdatePresetSchema>;
export type PresetOptionInput = v.InferOutput<typeof PresetOptionInputSchema>;
