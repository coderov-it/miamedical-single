import type { PgDatabase } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.ts';

export type Database = ReturnType<typeof createDatabase>;

/** The handle a `db.transaction(async (tx) => …)` callback is given. */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Either of the two, for a helper that does not care which it was given.
 *
 * Both `Database` and `Transaction` extend this base, so a repo function typed
 * with it can be called from an ordinary request and reused inside a
 * transaction that has to stay atomic with something else. Use `Database` where
 * a function opens its own transaction, and `Transaction` where being inside one
 * is the point — see `modules/notifications/write.ts`.
 */
export type DatabaseWriter = PgDatabase<PostgresJsQueryResultHKT, typeof schema>;

export interface DatabaseOptions {
  /** PostgreSQL connection string. Defaults to `process.env.DATABASE_URL`. */
  url?: string;
  /** Max pool size. Keep this at 1 for serverless / edge runtimes. */
  max?: number;
  /** Log every generated SQL statement. Defaults to `DRIZZLE_LOG`; see below. */
  logger?: boolean;
}

/**
 * `DRIZZLE_LOG=true` prints every generated statement. Off unless asked.
 *
 * Its own variable rather than the `NODE_ENV !== 'production'` heuristic this
 * replaces. Nothing in this repo ever sets `NODE_ENV` — it is absent from
 * `.env.example`, there is no pm2 ecosystem file, and `pnpm start` is a bare
 * `node` invocation — so that test was true *everywhere*, production included,
 * and query logging was unconditional while reading as though it were not.
 *
 * Deliberately not a dev-vs-prod switch. Wanting to see the SQL is a debugging
 * intent, and it is the same intent on a laptop and on the server; tying it to
 * the environment only meant nobody could turn it on where they needed it or off
 * where they did not.
 *
 * Strictly `'true'`, matching `TRUST_PROXY` in the server's env schema, which
 * validates the same variable at boot. Two readers of one variable have to agree
 * on what counts as true, and the narrowest rule is the one that cannot drift.
 */
function loggingEnabled(): boolean {
  return process.env.DRIZZLE_LOG === 'true';
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
    /* An explicit option wins, so the server can hand over the value its own
       env schema already validated; `DRIZZLE_LOG` is the fallback that makes
       scripts and one-off `tsx` runs obey the same switch. */
    logger: options.logger ?? loggingEnabled(),
  });
}

/**
 * The underlying postgres.js client.
 *
 * Only `LISTEN` needs this. `sql.listen()` opens a dedicated connection that
 * stays open for the life of the process and is never returned to the pool —
 * Drizzle has no wrapper for that, and going through the query builder would
 * hand back a pooled connection the listener would then hold hostage.
 *
 * Everything else uses the Drizzle handle. A raw statement inside ordinary work
 * belongs in `sql\`…\`` through `db.execute`, not here.
 */
export function listenerClient(db: Database): ReturnType<typeof postgres> {
  return db.$client;
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
