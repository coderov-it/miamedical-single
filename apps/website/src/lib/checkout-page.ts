/**
 * What the checkout page works out before it renders: the request it was handed,
 * and the words its script will need.
 *
 * None of it is markup, so none of it belongs in the page file — see the
 * file-size and page-file rules in AGENTS.md.
 */
import { t } from './labels.ts';

/**
 * A cart POSTs its line items; a product detail page can still GET a single one.
 *
 * POST is the cart's path because a multi-item request outgrows a URL and none of
 * it belongs in browser history — but it is a NATIVE form post of hidden inputs,
 * not a fetch, so it still works with JavaScript off. The FormData is normalised
 * into URLSearchParams here so everything downstream reads one shape and cannot
 * tell the two apart. Astro's `security.checkOrigin` default rejects a
 * cross-origin post before this runs.
 */
export async function readRequestParams(request: Request, url: URL): Promise<URLSearchParams> {
  if (request.method !== 'POST') return url.searchParams;

  const params = new URLSearchParams();
  try {
    for (const [key, value] of await request.formData()) {
      // A file upload has no business in a checkout request; drop it rather than
      // stringify it into "[object File]".
      if (typeof value === 'string') params.append(key, value);
    }
  } catch {
    // Malformed or missing body — fall through to the empty state.
  }
  return params;
}

/**
 * The words the page script needs at click time, resolved on the server.
 *
 * It ships as a JSON island rather than being imported, for the same reason the
 * delivery names ride on their cards: importing `~/lib/labels` would put the whole
 * storefront catalog in the browser bundle to get twenty strings. It also keeps
 * the project rule intact — no Italian literal exists inside the script.
 */
export function checkoutScriptLabels() {
  return {
    delivery: t('delivery'),
    free: t('free'),
    deliveryPaidToCarrier: t('deliveryPaidToCarrier'),
    collectedAtBranch: t('collectedAtBranch'),
    collectedAtBranchSale: t('collectedAtBranchSale'),
    returnStage: t('returnStage'),
    payNowFootnote: t('payNowFootnote'),
    payNowFootnoteCarrier: t('payNowFootnoteCarrier'),
    openingPayment: t('openingPayment'),
    outOfStock: t('outOfStock'),
    contractSigned: t('checkoutContract.signed'),
  } as const;
}
