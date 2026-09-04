export * from './client.ts';
export * as schema from './schema/index.ts';

// Re-export the query builders so consumers don't need a direct drizzle-orm
// dependency for everyday queries.
export {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';

// The types a generic helper needs to take "some table, some column" — a
// reconciling delete, a dynamic order-by. Same reason as the builders above:
// writing one is not a reason to depend on the ORM directly.
export type { SQL } from 'drizzle-orm';
export type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
