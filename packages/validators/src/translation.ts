import * as v from 'valibot';

import { LanguageCodeSchema, TARGET_LANGUAGE_CODES } from './i18n.ts';

/**
 * The wire contract between the admin's "translate" dialog and the provider
 * running on the server.
 *
 * Two properties are deliberate:
 *
 * 1. **One target per request.** The dialog shows a log line per language as it
 *    goes, which means a request per language — a batch call could only report
 *    "working" for the whole set. It also means one provider failure fails one
 *    language, not the run.
 * 2. **`source` is a language, not an assumption.** Italian is the language the
 *    product is authored in, but the dialog lets an operator translate any
 *    language into any other (`en → fr`), so the source travels on the wire and
 *    the provider is never allowed to infer it from the text.
 */

/** Every language a value may be translated *into* — never the source itself. */
export const TargetLanguageCodeSchema = v.picklist(
  TARGET_LANGUAGE_CODES,
  `Target must be one of: ${TARGET_LANGUAGE_CODES.join(', ')}.`,
);

/**
 * One field of one record. `key` is what the caller uses to put the answer back
 * where it came from; `label` is context the provider may use to disambiguate
 * (a bare word like "Benda" translates differently as a title than as a chip).
 */
export const TranslatableFieldSchema = v.strictObject({
  key: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
  label: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
  text: v.pipe(v.string(), v.minLength(1), v.maxLength(40_000)),
  /**
   * `html` must survive as html — the providers are told to keep the tags and
   * translate only the text between them, because the server sanitises on write
   * and a provider that returned Markdown would be stored as literal markup.
   */
  format: v.picklist(['text', 'html']),
});

export const TranslateRequestSchema = v.strictObject({
  source: LanguageCodeSchema,
  target: TargetLanguageCodeSchema,
  fields: v.pipe(v.array(TranslatableFieldSchema), v.minLength(1), v.maxLength(100)),
});

/** `{ title: 'Fauteuil…', description: '<p>…</p>' }` — only the keys that came back. */
export const TranslateResponseSchema = v.strictObject({
  translations: v.record(v.string(), v.string()),
});

/** What the admin probes once to decide whether to offer the action at all. */
export const TranslationCapabilitySchema = v.strictObject({
  enabled: v.boolean(),
  /** Provider name for the log line, or `null` when translation is off. */
  provider: v.nullable(v.string()),
});

export type TranslatableFieldInput = v.InferOutput<typeof TranslatableFieldSchema>;
export type TranslateRequestInput = v.InferOutput<typeof TranslateRequestSchema>;
export type TranslateResponse = v.InferOutput<typeof TranslateResponseSchema>;
export type TranslationCapability = v.InferOutput<typeof TranslationCapabilitySchema>;
