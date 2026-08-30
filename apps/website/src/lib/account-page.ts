/**
 * The account pages' browser-side copy and routes, resolved on the server.
 *
 * Every page under the customer area renders its list from `/api/customer/*`
 * in the browser, because the session is a cookie on the API's origin and this
 * app is a different host. That means the strings those scripts write into the
 * DOM cannot be `translate()`d where they are used — the script has no request
 * and no locale.
 *
 * So the server resolves them once and ships them as a JSON blob, exactly as the
 * product page and the checkout already do (`data-pdp-labels`,
 * `data-checkout-labels`). The ROUTES travel the same way and for the same
 * reason: `routes.account` is the Italian path, and an English page that
 * redirects there drops the reader out of their language.
 */
import { translate, type SiteLocale } from './i18n.ts';
import { accountOrderPath, routePath } from './routes.ts';

/** Order states, in the storefront's softer wording — not the back office's. */
export const ORDER_STATUS_KEYS = ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'] as const;

export interface AccountCopy {
  text: Record<string, string>;
  routes: {
    home: string;
    login: string;
    account: string;
    accountOrders: string;
    catalog: string;
    /** `{number}` stands in for the order number the script fills in. */
    orderDetail: string;
  };
  status: Record<string, string>;
}

/**
 * `keys` are FULL message keys, and the blob is keyed by the same strings.
 *
 * No `account.` prefix is added for the page: these scripts legitimately need
 * keys from outside that namespace — the order detail prints `total` and
 * `delivery`, which the checkout already owns — and a hidden prefix would make
 * those unreachable while looking like they worked.
 */
export function accountCopy(locale: SiteLocale, keys: readonly string[]): AccountCopy {
  const text: Record<string, string> = {};
  for (const key of keys) text[key] = translate(locale, key);

  const status: Record<string, string> = {};
  for (const key of ORDER_STATUS_KEYS) status[key] = translate(locale, `account.status.${key}`);

  return {
    text,
    routes: {
      home: routePath(locale, 'home'),
      login: routePath(locale, 'login'),
      account: routePath(locale, 'account'),
      accountOrders: routePath(locale, 'accountOrders'),
      catalog: routePath(locale, 'catalog'),
      orderDetail: accountOrderPath('{number}', locale),
    },
    status,
  };
}
