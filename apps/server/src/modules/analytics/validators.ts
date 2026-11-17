import * as v from 'valibot';

import { BUCKETS } from './range.ts';

const DaySchema = v.pipe(v.string(), v.trim(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'));

export const SalesQuerySchema = v.object({
  from: v.optional(DaySchema),
  to: v.optional(DaySchema),
  bucket: v.optional(v.picklist(BUCKETS)),
});
