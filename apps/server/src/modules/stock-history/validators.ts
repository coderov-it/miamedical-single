import { PaginationSchema, UuidSchema } from '@mia/validators';
import * as v from 'valibot';

const DaySchema = v.pipe(v.string(), v.trim(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'));

export const StockHistoryParamSchema = v.object({ id: UuidSchema });

/** The page size is fixed (25), so only `page` is taken from the shared pagination shape. */
export const StockHistoryQuerySchema = v.object({
  from: v.optional(DaySchema),
  to: v.optional(DaySchema),
  page: PaginationSchema.entries.page,
});

export type StockHistoryQuery = v.InferOutput<typeof StockHistoryQuerySchema>;
