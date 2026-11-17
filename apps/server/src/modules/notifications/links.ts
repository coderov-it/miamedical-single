import { type LanguageCode, SOURCE_LANGUAGE } from '@mia/validators/language';

import { env } from '../../config/env.ts';

/**
 * Absolute URLs for the pages emails point at, in the reader's language.
 *
 * ⚠️ These paths mirror `PRIVATE_SEGMENTS` in `apps/website/src/lib/routes.ts`,
 * the source of truth. The server cannot import from the website app, so they
 * are repeated here — change one and you must change the other, or every link
 * in every email 404s. There is no build-time check binding them together;
 * `docs/code/customer-accounts.md` records the pairing.
 *
 * Private routes are English and identical in every language, so a language
 * changes only the prefix — the storefront's own rule: none for the source
 * language, `/<code>` for every other.
 *
 *   activationUrl('A', 'it')  →  https://…/activate-account/?token=A
 *   activationUrl('A', 'en')  →  https://…/en/activate-account/?token=A
 *
 * Query keys are English, per the naming rule: the query string is a machine
 * wire format.
 */

const PATHS = {
  activateAccount: '/activate-account/',
  resetPassword: '/reset-password/',
  accountOrders: '/account/orders/',
  reportOrder: '/report-order/',
  login: '/sign-in/',
  signContract: '/sign-contract/',
  paymentResult: '/payment/',
  completeOrder: '/complete-order/',
} as const;

function siteUrl(path: string, language: LanguageCode, token?: string): string {
  const prefix = language === SOURCE_LANGUAGE ? '' : `/${language}`;
  const url = new URL(env.PUBLIC_SITE_URL + prefix + path);
  if (token) url.searchParams.set('token', token);
  return url.toString();
}

/** Sets a password and signs them in. Doubles as the order-confirmation click. */
export const activationUrl = (token: string, language: LanguageCode) =>
  siteUrl(PATHS.activateAccount, language, token);

export const passwordResetUrl = (token: string, language: LanguageCode) =>
  siteUrl(PATHS.resetPassword, language, token);

/** Magic-link sign-in lands on the same page as activation — it redeems a token. */
export const magicLinkUrl = (token: string, language: LanguageCode) =>
  siteUrl(PATHS.activateAccount, language, token);

export const reportOrderUrl = (token: string, language: LanguageCode) =>
  siteUrl(PATHS.reportOrder, language, token);

export const accountOrdersUrl = (language: LanguageCode) => siteUrl(PATHS.accountOrders, language);

/** One order in the customer area — where its rental card lives. */
export const accountOrderUrl = (orderNumber: string, language: LanguageCode) =>
  siteUrl(`${PATHS.accountOrders}${encodeURIComponent(orderNumber)}/`, language);

/** The same order with the renewal modal open — the extend offer's button. */
export const accountRenewUrl = (orderNumber: string, language: LanguageCode) =>
  `${accountOrderUrl(orderNumber, language)}?renew=1`;

export const loginUrl = (language: LanguageCode) => siteUrl(PATHS.login, language);

/** In the contract's own language, like the email that carries it. */
export const contractSigningUrl = (token: string, language: LanguageCode) =>
  siteUrl(PATHS.signContract, language, token);

/** The private page an agent's link opens to finish a manual order. */
export const completeOrderUrl = (token: string, language: LanguageCode) =>
  siteUrl(PATHS.completeOrder, language, token);

/** Where the payment gateway sends the customer back, in the language they paid in. */
export const paymentResultUrl = (token: string, language: LanguageCode) =>
  siteUrl(PATHS.paymentResult, language, token);

/** Deep link into the admin SPA for an internal alert. */
export const adminDisputeUrl = (disputeId: string) =>
  `${env.PUBLIC_ADMIN_URL}/order-disputes/${disputeId}`;
