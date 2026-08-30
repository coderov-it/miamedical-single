/**
 * What the checkout page works out before it renders: the request it was handed,
 * the WhatsApp handover, and the words its script will need.
 *
 * None of it is markup, so none of it belongs in the page file — see the
 * file-size and page-file rules in AGENTS.md.
 */
import type { Checkout } from './checkout.ts';
import { t } from './labels.ts';
import { formatDateLabel } from './request-config.ts';

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
 * The handover message, from RESOLVED LABELS ONLY — never from raw input.
 *
 * The page script appends the contact and delivery details the customer types in;
 * this part is server-built so the WhatsApp link is already complete and correct
 * without a byte of JavaScript.
 */
export function buildHandoverMessage(items: Checkout['items']): string {
  const body = items
    .flatMap((item) => [
      `• ${item.product.title}`,
      ...(item.request.rentalPackage
        ? [
            `  ${t('msgPackage')}: ${item.request.rentalPackage.name} (${item.request.rentalPackage.label})`,
          ]
        : []),
      ...(item.request.startDate
        ? [`  ${t('msgFrom')}: ${formatDateLabel(item.request.startDate)}`]
        : []),
      ...(item.request.period
        ? [`  ${t('msgTo')}: ${formatDateLabel(item.request.period.endDate)}`]
        : []),
      ...(item.request.quantity > 1 ? [`  ${t('quantity')}: ${item.request.quantity}`] : []),
      ...item.request.addons.map(
        (entry) =>
          `  ${t('msgExtra')}: ${entry.addon.name}${entry.quantity > 1 ? ` × ${entry.quantity}` : ''}`,
      ),
      ...item.request.answers.map((entry) => `  ${entry.label} ${entry.value}`),
      `  ${t('msgEstimate')}: ${item.subtotal}`,
    ])
    .join('\n');

  return `${t('rentalRequestHeading')}\n${body}`;
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
    name: t('msgName'),
    email: t('msgEmail'),
    phone: t('msgPhone'),
    customerType: t('msgCustomerType'),
    codiceFiscale: t('codiceFiscale'),
    partitaIva: t('partitaIva'),
    deliveryLine: t('msgDelivery'),
    toBeArranged: t('msgToBeArranged'),
    deliveryAddress: t('msgDeliveryAddress'),
    deliveryPending: t('deliveryPending'),
    pickupBranch: t('msgPickupBranch'),
    notes: t('msgNotes'),
    collectedAtBranch: t('collectedAtBranch'),
    returnStage: t('returnStage'),
    requestNumberPrefix: t('msgRequestNumber'),
    sendRequest: t('sendRequest'),
    sendingRequest: t('sendingRequest'),
  } as const;
}
