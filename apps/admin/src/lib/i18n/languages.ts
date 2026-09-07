/**
 * The admin's view of the language registry.
 *
 * Everything language-shaped in this app reads from here, and this file reads
 * from `@mia/validators/language` — so registering a language lights it up
 * across the admin (switcher, per-field status, translation summaries) with no
 * edit in a component. Nothing under `src/` may write a language code as a
 * literal; that is what made the second language a fifty-file change.
 */
import {
  LANGUAGES,
  LANGUAGE_CODES,
  type LanguageCode,
  type LanguageDefinition,
  type Localized,
  type LocalizedOptional,
  isLanguageCode,
  languageOf,
  localizedFrom,
  SOURCE_LANGUAGE,
  TARGET_LANGUAGE_CODES,
  type TargetLanguageCode,
} from '@mia/validators/language';

export {
  LANGUAGES,
  LANGUAGE_CODES,
  isLanguageCode,
  languageOf,
  localizedFrom,
  SOURCE_LANGUAGE,
  TARGET_LANGUAGE_CODES,
  type LanguageCode,
  type LanguageDefinition,
  type Localized,
  type LocalizedOptional,
  type TargetLanguageCode,
};

/**
 * Past this many languages a row of buttons stops being readable and the
 * switcher becomes a dropdown. Three fit comfortably; six do not.
 *
 * It is a number rather than a media query on purpose — the constraint is how
 * many choices a person can scan, not how wide the viewport is.
 */
export const INLINE_SWITCHER_LIMIT = 4;

/** How complete one language is for a given record. Mirrors the server's `TranslationState`. */
export type TranslationState = 'complete' | 'partial' | 'missing';

export interface LanguageProgress {
  code: LanguageCode;
  label: string;
  /** The source language is never "missing" — it is the thing others are missing against. */
  state: TranslationState;
  isSource: boolean;
}

/**
 * An EDITABLE translated value: the source language is always a string — a form
 * binds it to an input and the API requires it — and every target language is
 * optional. This is what a form field holds and what a payload sends.
 */
export type LocalizedValue = Localized;

/**
 * Anything language-keyed, including values with no source text. Media alt text
 * is the case that needs it: alt is optional in every language, so it cannot be
 * a `LocalizedValue`. Read-side helpers take this so they serve both.
 */
export type LocalizedLike = LocalizedOptional;

const filled = (text: string | undefined): boolean => text !== undefined && text.trim() !== '';

/** Read one language out of a localized value. The single accessor — components never index by literal. */
export function textFor(value: LocalizedLike, code: LanguageCode): string {
  return value[code] ?? '';
}

/**
 * Write one language into a localized value.
 *
 * An emptied target language is stored as `undefined`, never `''`. That is not
 * tidiness: the storefront falls back to the source language when a translation
 * is absent, so a blank string would render as a real, empty translation and
 * `missingLanguages()` would stop reporting the gap. For the same reason
 * nothing in this admin ever copies source text into a target language — an
 * empty target is a working fallback, a copied one is a silent lie.
 */
export function setTextFor(value: LocalizedLike, code: LanguageCode, text: string): void {
  if (code === SOURCE_LANGUAGE) {
    value[code] = text;
    return;
  }
  value[code] = text || undefined;
}

/** Which target languages this value has no text for. */
export function gapsIn(value: LocalizedLike | null | undefined): TargetLanguageCode[] {
  if (!value) return [...TARGET_LANGUAGE_CODES];
  return TARGET_LANGUAGE_CODES.filter((code) => !filled(value[code]));
}

/**
 * Per-language progress across several localized values — one form's worth of
 * fields. A language is `complete` when every field has text, `missing` when
 * none does, and `partial` in between, which is the state that actually needs
 * showing: "started and abandoned" is the one a person has to act on.
 */
export function progressAcross(
  values: Array<LocalizedLike | null | undefined>,
): LanguageProgress[] {
  const present = values.filter((value): value is LocalizedLike => Boolean(value));
  return LANGUAGE_CODES.map((code) => {
    const language = languageOf(code);
    if (code === SOURCE_LANGUAGE) {
      return { code, label: language.label, state: 'complete' as const, isSource: true };
    }
    const total = present.length;
    const done = present.filter((value) => filled(value[code])).length;
    const state: TranslationState =
      done === 0 ? 'missing' : done === total ? 'complete' : 'partial';
    return { code, label: language.label, state, isSource: false };
  });
}

/** Same shape from the server's `translationStatus.languages` map. */
export function progressFromStates(
  states: Partial<Record<LanguageCode, TranslationState>>,
): LanguageProgress[] {
  return LANGUAGE_CODES.map((code) => ({
    code,
    label: languageOf(code).label,
    state: code === SOURCE_LANGUAGE ? 'complete' : (states[code] ?? 'missing'),
    isSource: code === SOURCE_LANGUAGE,
  }));
}

/**
 * "Tradotto" wording lives in the components; this returns the counts they need.
 * Source language excluded — it is the baseline, not a translation of anything.
 */
export function translationSummary(progress: LanguageProgress[]): {
  done: number;
  total: number;
  incomplete: LanguageProgress[];
} {
  const targets = progress.filter((entry) => !entry.isSource);
  const incomplete = targets.filter((entry) => entry.state !== 'complete');
  return { done: targets.length - incomplete.length, total: targets.length, incomplete };
}

/**
 * Build a translations payload for the API: the source language always, and a
 * target language ONLY when its row is complete.
 *
 * That rule is the reason this is shared rather than written per editor. A
 * half-filled target row is worse than no row: the storefront falls back
 * per-FIELD, so a French document with a title but no body would serve a French
 * heading over Italian prose. Dropping the row falls back per-DOCUMENT, which
 * is the coherent thing to read.
 *
 * `build` returns `null` for a language that cannot be sent at all — the
 * product description tab uses it that way, because a description can only ride
 * along with a title and slug that already exist server-side. When the SOURCE
 * language builds to `null` the whole payload is `null`: there is nothing valid
 * to send, and the caller says so in its own words rather than posting a body
 * the API will reject.
 */
export function buildTranslations<TRow>(
  build: (lang: LanguageCode) => TRow | null,
  isComplete: (row: TRow) => boolean,
): (Record<typeof SOURCE_LANGUAGE, TRow> & Partial<Record<TargetLanguageCode, TRow>>) | null {
  const source = build(SOURCE_LANGUAGE);
  if (source === null) return null;

  const payload = { [SOURCE_LANGUAGE]: source } as Record<typeof SOURCE_LANGUAGE, TRow> &
    Partial<Record<TargetLanguageCode, TRow>>;
  for (const code of TARGET_LANGUAGE_CODES) {
    const row = build(code);
    if (row !== null && isComplete(row)) payload[code] = row;
  }
  return payload;
}

/** Copy a stored `{ it, en, … }` jsonb value into an editable form value. */
export function cloneLocalized(value: LocalizedLike | null | undefined): LocalizedValue {
  return localizedFrom(
    value ? Object.fromEntries(LANGUAGE_CODES.map((code) => [code, value[code]])) : undefined,
    (text: string | undefined) => text,
  );
}

/**
 * Form value → API payload, or `null` when the source language is blank.
 *
 * Target languages are dropped when empty rather than sent as `''`: the column
 * is `strictObject`-validated and the storefront falls back on absence, so an
 * empty string would be stored as a real translation into nothing.
 */
export function localizedOrNull(value: LocalizedLike): LocalizedValue | null {
  const source = (value[SOURCE_LANGUAGE] ?? '').trim();
  if (!source) return null;
  const payload: LocalizedLike = { [SOURCE_LANGUAGE]: source };
  for (const code of TARGET_LANGUAGE_CODES) {
    const text = value[code]?.trim();
    if (text) payload[code] = text;
  }
  return payload as LocalizedValue;
}
