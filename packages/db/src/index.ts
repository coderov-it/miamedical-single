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
  or,
  sql,
} from 'drizzle-orm';
