import { sql } from 'drizzle-orm';
import { check, jsonb, pgEnum, type AnyPgColumn } from 'drizzle-orm/pg-core';

/**
 * The two catalog languages. An enum rather than a `languages` table: the
 * codebase leans on literal types throughout (permission catalog, valibot
 * picklists), and adding a language needs a code change anyway — the search
 * helper must learn the new dictionary. Values are appended, never reordered:
 * PostgreSQL enum ordering is part of the type.
 */
export const languageCode = pgEnum('language_code', ['it', 'en']);

export const LANGUAGE_CODES = languageCode.enumValues;
export type LanguageCode = (typeof languageCode.enumValues)[number];

/** Italian is the site's default and the only language guaranteed to exist. */
export const DEFAULT_LANGUAGE: LanguageCode = 'it';

/**
 * The project i18n rule (see docs/backend-structure-and-standart.md):
 * translated text goes in a `*_translations` table only if PostgreSQL indexes
 * it — full-text search or a per-locale unique slug. Everything else is an
 * inline `{ it, en }` jsonb column built with `localized()` below.
 */
export interface Localized {
  it: string;
  en?: string | undefined;
}

/** Inline `{ it, en }` jsonb column. Pair with `localizedCheck()` in the table extras. */
export const localized = () => jsonb().$type<Localized>();

/**
 * `CHECK (col ? 'it')` — Italian is mandatory *in the database*, not only in
 * valibot. The jsonb key-existence operator is immutable, which is what makes
 * it legal in a CHECK. What it cannot police is the key set — a stray
 * `{"fr": …}` is valibot's job to reject.
 */
export const localizedCheck = (name: string, column: AnyPgColumn) =>
  check(name, sql`${column} ? 'it' AND length(${column}->>'it') > 0`);

/** Same rule for nullable localized columns: absent entirely, or Italian-first. */
export const optionalLocalizedCheck = (name: string, column: AnyPgColumn) =>
  check(name, sql`${column} IS NULL OR (${column} ? 'it' AND length(${column}->>'it') > 0)`);

/**
 * Shared column for the three translation tables. Each table adds its own
 * parent FK and a composite `primaryKey({ columns: [parentId, languageCode] })`.
 */
export const translationColumns = {
  languageCode: languageCode().notNull(),
};
