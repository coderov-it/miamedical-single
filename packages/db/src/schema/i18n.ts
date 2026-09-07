import { sql } from 'drizzle-orm';
import { check, jsonb, pgEnum, type AnyPgColumn } from 'drizzle-orm/pg-core';

import {
  LANGUAGE_CODES,
  type LanguageCode,
  type Localized,
  pickLocalized,
  SOURCE_LANGUAGE,
} from '@mia/validators/language';

/**
 * The catalog languages come from THE registry — `@mia/validators/language`.
 * This file only turns that array into DDL.
 *
 * An enum rather than a `languages` table: the codebase leans on literal types
 * throughout (permission catalog, valibot picklists), and adding a language
 * needs a code change anyway — the registry must carry its search dictionary.
 *
 * ⚠️ Values are appended, never reordered: PostgreSQL enum ordering is part of
 * the type. The registry documents the same rule at its own declaration, and
 * this is the half that a reorder would break irreversibly.
 *
 * The subpath import is deliberate: `@mia/validators/language` is the pure
 * registry, so the schema package gains no dependency on valibot or
 * sanitize-html by reading it.
 */
export const languageCode = pgEnum(
  'language_code',
  LANGUAGE_CODES as unknown as [LanguageCode, ...LanguageCode[]],
);

/* Re-exported so the schema package stays the one import for anything that
   already depends on it — the server resolves localized values constantly and
   should not need a second package for the rule. */
export { LANGUAGE_CODES, pickLocalized, SOURCE_LANGUAGE };
export type { LanguageCode, Localized };

/** The site's default and the only language guaranteed to exist. */
export const DEFAULT_LANGUAGE: LanguageCode = SOURCE_LANGUAGE;

/**
 * The project i18n rule (see docs/backend-structure-and-standart.md):
 * translated text goes in a `*_translations` table only if PostgreSQL indexes
 * it — full-text search or a per-locale unique slug. Everything else is an
 * inline `{ it, en, … }` jsonb column built with `localized()` below.
 */
export const localized = () => jsonb().$type<Localized>();

/**
 * `CHECK (col ? 'it')` — the source language is mandatory *in the database*,
 * not only in valibot. The jsonb key-existence operator is immutable, which is
 * what makes it legal in a CHECK. What it cannot police is the key set: a key
 * for a language not in the registry is valibot's job to reject, which is why
 * `localizedSchema` is a `strictObject`.
 *
 * Adding a language needs no migration here — this constraint names only the
 * source language, and always will.
 *
 * `sql.raw` is not optional. Interpolating `SOURCE_LANGUAGE` as a value makes
 * drizzle bind it as `$1`, which a CHECK expression cannot contain — the
 * generated DDL is rejected by PostgreSQL, and drizzle-kit meanwhile sees every
 * constraint as changed and drops and recreates all twelve. The value is a
 * registry constant, never input, so building the literal is safe here and
 * nowhere near a query.
 */
const SOURCE = sql.raw(`'${SOURCE_LANGUAGE}'`);
export const localizedCheck = (name: string, column: AnyPgColumn) =>
  check(name, sql`${column} ? ${SOURCE} AND length(${column}->>${SOURCE}) > 0`);

/** Same rule for nullable localized columns: absent entirely, or source-language-first. */
export const optionalLocalizedCheck = (name: string, column: AnyPgColumn) =>
  check(
    name,
    sql`${column} IS NULL OR (${column} ? ${SOURCE} AND length(${column}->>${SOURCE}) > 0)`,
  );

/**
 * Shared column for the translation tables. Each table adds its own parent FK
 * and a composite `primaryKey({ columns: [parentId, languageCode] })` — which
 * is why a new language is an INSERT and never a migration.
 */
export const translationColumns = {
  languageCode: languageCode().notNull(),
};
