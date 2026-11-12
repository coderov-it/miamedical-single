/**
 * The private routes' OLD per-language paths, kept alive as permanent redirects.
 *
 * Private routes now have one English path shared by every language
 * (`PRIVATE_SEGMENTS` in `routes.ts`), but emails already sent still carry the
 * old translated ones: activation, password reset, magic link, report-order,
 * contract signing, order links, payment returns. Those links must keep working,
 * so the middleware answers each with a 301 before any other routing.
 *
 *   request                                          answer
 *   1. /carrello/                                    301 /cart/
 *   2. /fr/panier/?x=1                               301 /fr/cart/?x=1
 *   3. /area-clienti/ordini/MIA-2026-001042/         301 /account/orders/MIA-2026-001042/
 *   4. /checkout/  or  /en/sign-in/  (unchanged)     no redirect, routed as usual
 *
 * The table is FROZEN history: it lists only paths that changed, one per old
 * spelling, and nothing is ever added to it — a new private route is born
 * English and never has a legacy path. A path that did not change must not
 * appear here, or it would redirect to itself forever.
 *
 * The destination is computed from `routePaths`, so the redirect follows the
 * registry and stays in the language of the old URL.
 */
import type { SiteLocale } from './i18n.ts';
import { type RouteKey, routePaths } from './routes.ts';

type LegacyTable = Readonly<Record<string, RouteKey>>;

const LEGACY_PATHS = {
  it: {
    '/carrello/': 'cart',
    '/accedi/': 'login',
    '/area-clienti/': 'account',
    '/area-clienti/ordini/': 'accountOrders',
    '/area-clienti/notifiche/': 'accountNotifications',
    '/attiva-account/': 'activateAccount',
    '/reimposta-password/': 'resetPassword',
    '/segnala-ordine/': 'reportOrder',
    '/firma-contratto/': 'signContract',
    '/pagamento/': 'paymentResult',
  },
  en: {
    '/en/customer-area/': 'account',
    '/en/customer-area/orders/': 'accountOrders',
    '/en/customer-area/notifications/': 'accountNotifications',
  },
  fr: {
    '/fr/panier/': 'cart',
    '/fr/commande/': 'checkout',
    '/fr/connexion/': 'login',
    '/fr/espace-client/': 'account',
    '/fr/espace-client/commandes/': 'accountOrders',
    '/fr/espace-client/notifications/': 'accountNotifications',
    '/fr/activer-le-compte/': 'activateAccount',
    '/fr/reinitialiser-le-mot-de-passe/': 'resetPassword',
    '/fr/signaler-une-commande/': 'reportOrder',
    '/fr/signer-le-contrat/': 'signContract',
    '/fr/paiement/': 'paymentResult',
  },
  de: {
    '/de/warenkorb/': 'cart',
    '/de/kasse/': 'checkout',
    '/de/anmelden/': 'login',
    '/de/kundenbereich/': 'account',
    '/de/kundenbereich/bestellungen/': 'accountOrders',
    '/de/kundenbereich/benachrichtigungen/': 'accountNotifications',
    '/de/konto-aktivieren/': 'activateAccount',
    '/de/passwort-zuruecksetzen/': 'resetPassword',
    '/de/bestellung-melden/': 'reportOrder',
    '/de/vertrag-unterzeichnen/': 'signContract',
    '/de/zahlung/': 'paymentResult',
  },
} as const satisfies Record<SiteLocale, LegacyTable>;

for (const table of Object.values(LEGACY_PATHS)) Object.freeze(table);
Object.freeze(LEGACY_PATHS);

/** The locales, in lookup order. The source language is the unprefixed one. */
const LOCALE_CODES = Object.keys(LEGACY_PATHS) as SiteLocale[];

function withTrailingSlash(pathname: string): string {
  if (pathname.endsWith('/')) return pathname;
  return `${pathname}/`;
}

/** The new path for one old path, or null when it is not a legacy one. */
function legacyTarget(locale: SiteLocale, pathname: string): string | null {
  const table: LegacyTable = LEGACY_PATHS[locale];
  const key = table[pathname];
  if (key) return routePaths[locale][key];

  /* One order by number — the only private route with a dynamic segment. */
  const oldOrdersBase = Object.keys(table).find((path) => table[path] === 'accountOrders');
  if (!oldOrdersBase || !pathname.startsWith(oldOrdersBase)) return null;

  const number = pathname.slice(oldOrdersBase.length).replace(/\/$/, '');
  if (number === '' || number.includes('/')) return null;
  return `${routePaths[locale].accountOrders}${number}/`;
}

/**
 * Where an old private URL now lives, query string included — or `null` when the
 * request is not an old private URL and routing should carry on.
 *
 * `search` is `URL.search`: either empty or starting with `?`. Tokens ride in it,
 * so it is passed through untouched.
 */
export function legacyRedirect(pathname: string, search: string): string | null {
  const path = withTrailingSlash(pathname);
  for (const locale of LOCALE_CODES) {
    const target = legacyTarget(locale, path);
    if (target) return `${target}${search}`;
  }
  return null;
}
