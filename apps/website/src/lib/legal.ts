/**
 * The site's own policies — the privacy notice today.
 *
 * Read like the catalogue is read: through `cached()`, so the page costs the API
 * one call per locale per refresh interval rather than one per visitor. What the
 * two caches add up to, and why a policy is allowed a longer staleness budget
 * than a price, is in docs/code/legal-pages.md § caching.
 */
import type { InferResponseType } from 'hono/client';
import type { LegalPageCode } from '@mia/validators';

import { api } from './api.ts';
import { type CachePolicy, cached } from './cache.ts';
import type { SiteLocale } from './i18n.ts';
import type { RouteKey } from './routes.ts';

export type LegalPage = InferResponseType<(typeof api.api.legal)[':code']['$get'], 200>['data'];

/**
 * Ten minutes fresh, a day of stale-while-revalidate behind it.
 *
 * Far longer than `CATALOG_POLICY`'s four minutes, because the two answer
 * different questions. A price that is four minutes out of date is a customer
 * quoted the wrong number; a privacy notice that is ten minutes out of date is
 * a document whose new wording has not reached everyone yet, which is what a
 * publication date is for. `stale` is a day so an API outage cannot replace a
 * legal document with an apology page — the last good copy keeps serving.
 */
const LEGAL_POLICY: CachePolicy = { fresh: 600, stale: 86_400 };

async function fetchLegalPage(code: LegalPageCode, locale: SiteLocale): Promise<LegalPage | null> {
  const response = await api.api.legal[':code'].$get({ param: { code }, query: { locale } });

  /* Never written yet. A real answer, and a cheap one to remember. */
  if (response.status === 404) return null;
  /*
    Anything else THROWS, and that distinction is the point: `cached()` keeps
    the last good value across a failed refresh, but only if the refresh fails.
    Returning null here would store "no privacy policy" for ten minutes every
    time the API hiccups, and the page would tell visitors the document is being
    updated when it is sitting in the database.
  */
  if (!response.ok) throw new Error(`GET /api/legal/${code} (${locale}) → ${response.status}`);

  const { data } = await response.json();
  return data;
}

export async function getLegalPage(
  code: LegalPageCode,
  locale: SiteLocale,
): Promise<LegalPage | null> {
  try {
    return await cached(
      `legal:${code}:${locale}`,
      () => fetchLegalPage(code, locale),
      LEGAL_POLICY,
    );
  } catch (error) {
    console.warn(`[legal] ${code} (${locale}) could not be read:`, error);
    return null;
  }
}

export interface LegalPageRoute {
  code: LegalPageCode;
  /** Its key in the route table — which is what gives it a URL per language. */
  routeKey: RouteKey;
  /** Heading and tab title while the document has not been written yet. */
  fallbackTitle: string;
  fallbackDescription: string;
}

/**
 * Every legal page the storefront serves, and the route each one lives at.
 *
 * ONE table, read by both the page file that declares the URL and the sitemap
 * that has to list it — so a page added here cannot be a page crawlers never
 * hear about. The fallbacks are Italian because they stand in for an Italian
 * document that has not been written yet; once it exists, nothing here is used.
 */
export const LEGAL_PAGES: Record<LegalPageCode, LegalPageRoute> = {
  'privacy-policy': {
    code: 'privacy-policy',
    routeKey: 'privacy',
    fallbackTitle: 'Privacy policy',
    fallbackDescription: 'Informativa sul trattamento dei dati personali di Mia Medical Italia.',
  },
};
