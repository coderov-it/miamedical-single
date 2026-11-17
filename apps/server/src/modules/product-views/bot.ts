/**
 * Decides whether a User-Agent is worth a product view. A missing one is not:
 * every browser sends one, so its absence means a script. The pattern covers the
 * crawlers, link-preview fetchers, headless browsers and HTTP libraries that
 * would otherwise swamp the counts; it is deliberately broad, because an
 * undercounted view is cheaper than a view inflated by a scraper.
 *
 *   Mozilla/5.0 (iPhone; … Safari/604.1)          → counted
 *   Mozilla/5.0 (compatible; Googlebot/2.1; …)    → "bot"      → not counted
 *   curl/8.5.0                                    → "curl"     → not counted
 *   (no User-Agent header)                        →             not counted
 */
const NOT_A_PERSON =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|go-http|java\/|okhttp|node-fetch|undici|libwww|httpclient|postman|scrapy|phantom|selenium|puppeteer|playwright/i;

export function isCountableUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return !NOT_A_PERSON.test(userAgent);
}
