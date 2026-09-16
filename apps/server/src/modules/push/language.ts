import { DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from '@mia/validators/language';

/**
 * Which language a person is written to in.
 *
 * Two sources, one per channel, and the order between them written down ONCE so
 * that nothing has to remember it:
 *
 * ```text
 * push, localized   the phone's own OS locale — we send no language at all
 * push, fallback    push_devices.language → customer_accounts.language → 'it'
 * email             customer_accounts.language → 'it'
 * in-app feed       customer_accounts.language → 'it'
 * ```
 *
 * A push is read on a particular handset, so the device wins there: a phone set
 * to German should speak German whatever language the account was created in. An
 * email has no device behind it and must use what the person told us.
 *
 * Every candidate is narrowed through the registry before it is used, so a phone
 * set to Japanese falls through to the account and then to Italian rather than
 * rendering an empty catalogue. That is also why these take `unknown`: the values
 * come out of a database column that a hand-edit could put anything into.
 */

/** The account's own preference. `null` means they have never told us. */
export function readerLanguage(accountLanguage: unknown): LanguageCode {
  return isLanguageCode(accountLanguage) ? accountLanguage : DEFAULT_LANGUAGE;
}

/**
 * The language for a server-rendered push — the fallback path only.
 *
 * When localization keys are in play this is never called: the OS resolves the
 * string against the handset's own locale and the server never learns which one
 * that was. That is a feature rather than a gap, and it is why
 * `push_devices.language` is nullable and unimportant.
 */
export function deviceLanguage(deviceLanguage: unknown, accountLanguage: unknown): LanguageCode {
  if (isLanguageCode(deviceLanguage)) return deviceLanguage;
  return readerLanguage(accountLanguage);
}
