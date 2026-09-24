/**
 * How long a password has to be, as a plain number with no dependencies.
 *
 * Its own module, and its own export subpath, because the storefront needs these
 * in the browser: `PasswordForm.svelte` and `attiva-account.astro` both render the
 * number into `minlength` and gate on it before calling the API. Importing them
 * from the package root would pull valibot into the client bundle to read an
 * integer. `common.ts` builds the schemas from these, so there is still one place
 * the rule is written.
 */

/**
 * Back office. An operator holds permission codes over the whole shop.
 */
export const ADMIN_PASSWORD_MIN_LENGTH = 12;

/**
 * Storefront. Half the back office's, because the two guard different things: a
 * customer password opens that customer's own order list and nothing else, and
 * having one is optional to begin with — every route into the account also works
 * by emailed link. A rule strict enough to fail the form costs an activation and
 * protects nothing.
 */
export const CUSTOMER_PASSWORD_MIN_LENGTH = 6;

export const PASSWORD_MAX_LENGTH = 128;
