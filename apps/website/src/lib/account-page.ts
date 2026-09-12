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
import { LOCALES, translate, type SiteLocale } from './i18n.ts';
import { accountOrderPathTemplate, routePath } from './routes.ts';

/**
 * Every string the account island renders.
 *
 * ONE set, shared by all three shims, because they mount the same island and a
 * per-page list would let a screen reach a key its entry point never shipped —
 * a blank label that only appears when you arrive from the other page. The
 * four pages that are NOT the island keep declaring their own `keys`; nothing
 * about `<AccountCopy>` changes for them.
 *
 * It includes the `*.metaTitle` keys, which the server also uses for `<title>`:
 * a client-side navigation has to move the title too, and only the island can.
 *
 * Keys outside `account.` are reused verbatim from the checkout — the field
 * errors and the gate's count templates are the same sentences, and a second
 * translation of "Inserisci il tuo nome." is a second thing to keep in step.
 */
export const ACCOUNT_ISLAND_KEYS = [
  // shell
  'account.metaTitle',
  'account.loading',
  'account.title',
  'account.signOut',
  'account.myOrders',
  'account.genericError',
  'account.retry',
  'account.nav.overview',
  'breadcrumbs.label',
  // profile
  'yourDetails',
  'firstName',
  'lastName',
  'account.whatsappNumber',
  'account.save',
  'account.profileSaved',
  'errorFirstName',
  'errorLastName',
  'errorPhone',
  // password
  'account.password',
  'account.changePassword',
  'account.changePasswordNote',
  'account.setPassword',
  'account.setPasswordNote',
  'account.currentPassword',
  'account.newPassword',
  'account.minChars',
  'account.savePassword',
  'account.passwordSaved',
  'account.passwordTooShort',
  'account.errorCurrentPassword',
  // the gate's live region
  'errorCountOne',
  'errorCountMany',
  // orders
  'account.orders.metaTitle',
  'account.orders.breadcrumb',
  'account.orders.empty',
  'account.orders.browse',
  'account.orders.itemOne',
  'account.orders.itemMany',
  'account.orders.verifyPrompt',
  'account.orders.confirm',
  'account.orders.reject',
  'account.orders.recent',
  'account.orders.viewAll',
  'account.summary.lastOrder',
  'retry',
  // one order
  'account.order.metaTitle',
  'account.order.title',
  'account.order.placedOn',
  'account.order.subtotal',
  'account.order.storePickup',
  'account.order.pieces',
  'account.order.yourNotes',
  'account.order.unavailable',
  'account.order.backToOrders',
  'orderSummary',
  'homeDeliveryShort',
  'deliveryPending',
  'delivery',
  'total',
] as const;

/** Order states, in the storefront's softer wording — not the back office's. */
export const ORDER_STATUS_KEYS = ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'] as const;

/** The account paths the island navigates between, for ONE language. */
export interface AccountRouteSet {
  home: string;
  login: string;
  account: string;
  accountOrders: string;
  catalog: string;
  /** `{number}` stands in for the order number the island fills in. */
  orderDetail: string;
}

export interface AccountCopy {
  text: Record<string, string>;
  /** This request's language. */
  routes: AccountRouteSet;
  /**
   * The same paths in EVERY language, for the header's switcher.
   *
   * The switcher is server-rendered chrome and the screen is not, so after a
   * client-side hop it still points at the screen the reader ARRIVED on —
   * offering "Deutsch" on an order detail and landing them on the German order
   * LIST. `AccountApp` rewrites its hrefs from this on every screen change.
   * A few dozen strings; the alternative is chrome that lies.
   */
  languageRoutes: Record<string, AccountRouteSet>;
  status: Record<string, string>;
}

function accountRouteSet(locale: SiteLocale): AccountRouteSet {
  return {
    home: routePath(locale, 'home'),
    login: routePath(locale, 'login'),
    account: routePath(locale, 'account'),
    accountOrders: routePath(locale, 'accountOrders'),
    catalog: routePath(locale, 'catalog'),
    orderDetail: accountOrderPathTemplate(locale),
  };
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
    routes: accountRouteSet(locale),
    languageRoutes: Object.fromEntries(LOCALES.map((code) => [code, accountRouteSet(code)])),
    status,
  };
}
