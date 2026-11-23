import { UuidSchema } from '@mia/validators';
import * as v from 'valibot';

const NoteSchema = v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(1000))));

export const InspectUnitSchema = v.object({
  orderItemId: UuidSchema,
  outcome: v.picklist(['restocked', 'attention']),
  note: NoteSchema,
});

export const ResolveAttentionSchema = v.object({
  resolution: v.picklist(['repaired', 'written_off']),
  note: NoteSchema,
});

export const AttentionIdParamSchema = v.object({ id: UuidSchema });

export type InspectUnitInput = v.InferOutput<typeof InspectUnitSchema>;
export type ResolveAttentionInput = v.InferOutput<typeof ResolveAttentionSchema>;
