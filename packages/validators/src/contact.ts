/**
 * Whether a customer's phone number could be dialled.
 *
 * Its own module and export subpath, like `password-policy.ts`: the storefront
 * gates its forms on this in the browser, and importing it from the package
 * root would bundle valibot to run one regex. `CustomerPhoneSchema` in
 * `common.ts` is built on it, so the server and the forms cannot disagree.
 *
 * Deliberately loose about layout — "+39 333 1234567", "(06) 1234 5678" and
 * "333-123-4567" are all how people write numbers — and strict only about what
 * makes one undialable: letters, or too few or too many digits. Six is the
 * shortest Italian landline; fifteen is the E.164 ceiling.
 */
const PHONE_CHARACTERS = /^\+?[\d\s().\/-]+$/;
const MIN_DIGITS = 6;
const MAX_DIGITS = 15;

export function isPlausiblePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!PHONE_CHARACTERS.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '').length;
  return digits >= MIN_DIGITS && digits <= MAX_DIGITS;
}

/**
 * Whether an email address has the shape the server's `EmailSchema` accepts:
 * something, an @, a domain with a dot. Looser than that schema, never
 * stricter — its job is to stop "@" and "mario@gmail" in the browser instead
 * of after the last step, not to second-guess addresses that work.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isPlausibleEmail(value: string): boolean {
  return EMAIL_SHAPE.test(value.trim());
}
