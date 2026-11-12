import type { LanguageCode } from '@mia/validators';

import { env } from '../../config/env.ts';

/**
 * Absolute URLs for the pages emails point at.
 *
 * ⚠️ These paths mirror `apps/website/src/lib/routes.ts`, which is the source of
 * truth for public URLs and an SEO commitment. The server cannot import from the
 * website app, so they are repeated here — change one and you must change the
 * other, or every link in every email 404s. There is no build-time check binding
 * them together; `docs/code/customer-accounts.md` records the pairing.
 *
 * Query keys are English, per the naming rule: the Italian path is content, the
 * query string is a machine wire format.
 */

const PATHS = {
  activateAccount: '/attiva-account/',
  resetPassword: '/reimposta-password/',
  accountOrders: '/area-clienti/ordini/',
  reportOrder: '/segnala-ordine/',
  login: '/accedi/',
} as const;

function siteUrl(path: string, token?: string): string {
  const url = new URL(env.PUBLIC_SITE_URL + path);
  if (token) url.searchParams.set('token', token);
  return url.toString();
}

/** Sets a password and signs them in. Doubles as the order-confirmation click. */
export const activationUrl = (token: string) => siteUrl(PATHS.activateAccount, token);

export const passwordResetUrl = (token: string) => siteUrl(PATHS.resetPassword, token);

/** Magic-link sign-in lands on the same page as activation — it redeems a token. */
export const magicLinkUrl = (token: string) => siteUrl(PATHS.activateAccount, token);

export const reportOrderUrl = (token: string) => siteUrl(PATHS.reportOrder, token);

export const accountOrdersUrl = () => siteUrl(PATHS.accountOrders);

/** One order in the customer area — where its rental card lives. */
export const accountOrderUrl = (orderNumber: string) =>
  siteUrl(`${PATHS.accountOrders}${encodeURIComponent(orderNumber)}/`);

/** The same order with the renewal modal open — the extend offer's button. */
export const accountRenewUrl = (orderNumber: string) => `${accountOrderUrl(orderNumber)}?renew=1`;

export const loginUrl = () => siteUrl(PATHS.login);

export const contractSigningUrl = (token: string) => siteUrl('/firma-contratto/', token);

/**
 * Where the payment gateway sends the customer back, in the language they paid
 * in. Mirrors `paymentResult` in the website's routes.ts, like every path here.
 */
const PAYMENT_RESULT_PATHS: Record<LanguageCode, string> = {
  it: '/pagamento/',
  en: '/en/payment/',
  fr: '/fr/paiement/',
  de: '/de/zahlung/',
};

export const paymentResultUrl = (token: string, language: LanguageCode) =>
  siteUrl(PAYMENT_RESULT_PATHS[language], token);

/** Deep link into the admin SPA for an internal alert. */
export const adminDisputeUrl = (disputeId: string) =>
  `${env.PUBLIC_ADMIN_URL}/order-disputes/${disputeId}`;
