import { sql, type SQL } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';

import type { LanguageCode } from './i18n.ts';

/** drizzle-orm has no built-in tsvector column; this is the documented escape hatch. */
export const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

/** Adding a language later means an enum value *and* a dictionary entry here. */
const SEARCH_CONFIG: Record<LanguageCode, string> = {
  it: 'italian',
  en: 'english',
};

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
  const config = SEARCH_CONFIG[lang];
  return sql`setweight(to_tsvector(${config}::regconfig, ${title}), 'A') || setweight(to_tsvector(${config}::regconfig, ${body ?? ''}), 'B')`;
}

/** Match helper for queries: `WHERE search_vector @@ websearch_to_tsquery(...)`. */
export function searchQueryFor(lang: LanguageCode, query: string): SQL {
  return sql`websearch_to_tsquery(${SEARCH_CONFIG[lang]}::regconfig, ${query})`;
}
