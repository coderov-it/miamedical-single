/**
 * Opening a customer's private pages in their own language when they arrive
 * from outside the site — an email, a bookmark, a typed address.
 *
 * ```text
 *  arrives from     page                          account language  →  result
 *  email (Gmail)    /activate-account/?token=A    en                →  /en/activate-account/?token=A
 *  email (Gmail)    /en/activate-account/?token=A en                →  stays
 *  bookmark         /account/orders/              en                →  /en/account/orders/
 *  the site's own   /account/orders/              en                →  stays (they chose Italian)
 *    language menu
 * ```
 *
 * Arrivals only, never in-site navigation: a customer who picks Italian in the
 * language menu is never sent back. The menu also saves that choice as their
 * language (`LanguageSwitcher.astro`), so a later arrival agrees with it.
 *
 * Two halves, because the session cookie lives on the API's host and the
 * storefront server cannot see it (`signed-in-hint.ts`):
 *   email-link pages   on the server, from the link itself (`linkLanguageRedirect`)
 *   the account area   in the browser, once `/auth/me` answers (`accountLanguageRedirect`)
 *
 * Private routes share one English path in every language, so moving a page to
 * another language only swaps the prefix.
 */
import { isLanguageCode, SOURCE_LANGUAGE } from '@mia/validators/language';

import { apiUrl } from './api-base.ts';
import type { SiteLocale } from './i18n.ts';
import { routePaths, type RouteKey } from './routes.ts';

/** The pages an emailed sign-in or report link lands on. */
const LINK_PAGES: readonly RouteKey[] = ['activateAccount', 'resetPassword', 'reportOrder'];

/** A slow API must not hold the page: past this, the link opens where it was. */
const LOOKUP_TIMEOUT_MS = 1500;

/** `/en/account/` → `/account/`; a source-language path is returned unchanged. */
function withoutPrefix(pathname: string, locale: SiteLocale): string {
  if (locale === SOURCE_LANGUAGE) return pathname;
  return pathname.slice(locale.length + 1);
}

/** The same private page in `language`. */
export function privatePathIn(pathname: string, from: SiteLocale, to: SiteLocale): string {
  const bare = withoutPrefix(pathname, from);
  return to === SOURCE_LANGUAGE ? bare : `/${to}${bare}`;
}

/**
 * Whether a navigation came from outside the site. `Sec-Fetch-Site` is sent by
 * every current browser; without it the request is treated as an arrival.
 */
export function isArrival(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  return site !== 'same-origin' && site !== 'same-site';
}

async function lookupLinkLanguage(token: string): Promise<SiteLocale | null> {
  try {
    const response = await fetch(
      apiUrl(`/api/customer/auth/token/language?token=${encodeURIComponent(token)}`),
      { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { language?: unknown } };
    const language = body.data?.language;
    return isLanguageCode(language) ? language : null;
  } catch {
    return null;
  }
}

/**
 * Where an emailed link should open instead, or null to render it here. The
 * link is only looked at, never spent: the page still redeems it as before.
 */
export async function linkLanguageRedirect(
  request: Request,
  url: URL,
  locale: SiteLocale,
): Promise<string | null> {
  if (request.method !== 'GET' || !isArrival(request)) return null;
  const token = url.searchParams.get('token');
  if (!token) return null;
  const page = LINK_PAGES.find((key) => routePaths[locale][key] === url.pathname);
  if (!page) return null;

  const language = await lookupLinkLanguage(token);
  if (!language || language === locale) return null;
  return `${routePaths[language][page]}${url.search}`;
}

/** In the browser: reached by a link from another site, or with no referrer at all. */
function arrivedFromOutside(): boolean {
  if (!document.referrer) return true;
  try {
    return new URL(document.referrer).origin !== window.location.origin;
  } catch {
    return true;
  }
}

/**
 * Sends a signed-in customer who arrived at an account page in another
 * language to the same page in theirs. True when the browser is leaving.
 */
export function accountLanguageRedirect(language: unknown, pageLocale: SiteLocale): boolean {
  if (!isLanguageCode(language) || language === pageLocale || !arrivedFromOutside()) return false;
  const { pathname, search, hash } = window.location;
  window.location.replace(`${privatePathIn(pathname, pageLocale, language)}${search}${hash}`);
  return true;
}
