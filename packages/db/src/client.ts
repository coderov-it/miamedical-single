import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.ts';

export type Database = ReturnType<typeof createDatabase>;

export interface DatabaseOptions {
  /** PostgreSQL connection string. Defaults to `process.env.DATABASE_URL`. */
  url?: string;
  /** Max pool size. Keep this at 1 for serverless / edge runtimes. */
  max?: number;
  /** Log every generated SQL statement. Defaults to on outside production. */
  logger?: boolean;
}

export function createDatabase(options: DatabaseOptions = {}) {
  const url = options.url ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set.');
  }

  const sql = postgres(url, {
    max: options.max ?? 10,
    // Drizzle handles its own prepared statements; disabling avoids issues
    // behind connection poolers such as PgBouncer in transaction mode.
    prepare: false,
  });

  return drizzle(sql, {
    schema,
    casing: 'snake_case',
    logger: options.logger ?? process.env.NODE_ENV !== 'production',
  });
}

let cached: Database | undefined;

/**
 * Process-wide singleton. Use this from long-lived servers so the connection
 * pool survives HMR reloads; use `createDatabase()` directly in scripts and
 * tests where you want to control the lifetime yourself.
 */
export function getDatabase(options?: DatabaseOptions): Database {
  cached ??= createDatabase(options);
  return cached;
}
