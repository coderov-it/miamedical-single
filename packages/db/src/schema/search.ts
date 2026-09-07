import { sql, type SQL } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';

import { languageOf } from '@mia/validators/language';

import type { LanguageCode } from './i18n.ts';

/** drizzle-orm has no built-in tsvector column; this is the documented escape hatch. */
export const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

/**
 * The dictionary comes off the language registry, so adding a language cannot
 * forget it — `searchConfig` is a required field of `LanguageDefinition`.
 *
 * It must name a config that exists on the instance:
 * `SELECT cfgname FROM pg_ts_config`. A slim PostgreSQL image can ship without
 * one, and the failure surfaces as a throw on every write of a translation row
 * in that language.
 */
const searchConfigFor = (lang: LanguageCode): string => languageOf(lang).searchConfig;

/**
 * The one place that builds a `search_vector` value. It cannot be a
 * `GENERATED ALWAYS AS` column: PostgreSQL requires the expression to be
 * immutable and the dictionary here varies by row (`italian` vs `english`).
 * The built-in escape hatch, `tsvector_update_trigger_column()`, does not
 * support `setweight` — so the repo writes the vector through this helper on
 * every insert/update of a translation row instead.
 *
 * Title is weighted A, body B, so title matches rank first.
 */
export function searchVectorFor(lang: LanguageCode, title: string, body: string | null): SQL {
  const config = searchConfigFor(lang);
  return sql`setweight(to_tsvector(${config}::regconfig, ${title}), 'A') || setweight(to_tsvector(${config}::regconfig, ${body ?? ''}), 'B')`;
}

/** Match helper for queries: `WHERE search_vector @@ websearch_to_tsquery(...)`. */
export function searchQueryFor(lang: LanguageCode, query: string): SQL {
  return sql`websearch_to_tsquery(${searchConfigFor(lang)}::regconfig, ${query})`;
}
