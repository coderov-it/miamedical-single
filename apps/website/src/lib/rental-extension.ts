import type { InferResponseType } from 'hono/client';

import type { api } from './api.ts';
import { request } from './customer-session.ts';

/**
 * The customer's half of a rental extension — see where it stands, preview and
 * sign the renewal contract, place it, withdraw before paying. Flow and worked
 * example: docs/code/rental-extensions.md. Own module because
 * customer-session.ts is already past its size budget.
 */

export type ExtensionOverview = InferResponseType<
  (typeof api.api.customer)['rental-extensions'][':number']['$get'],
  200
>['data'];

const path = (number: string) => `/api/customer/rental-extensions/${encodeURIComponent(number)}`;

export function getExtension(number: string, locale: string): Promise<ExtensionOverview> {
  return request(`${path(number)}?${new URLSearchParams({ locale })}`);
}

/** The renewal contract the modal would sign for `days`, rendered. Writes nothing. */
export async function previewRenewalContract(number: string, days: number): Promise<string> {
  const { html } = await request<{ html: string }>(`${path(number)}/contract-preview`, {
    method: 'POST',
    body: JSON.stringify({ days }),
  });
  return html;
}

/** Places the renewal with its contract signed; it then waits for payment. */
export function placeRenewal(
  number: string,
  days: number,
  signatureDataUrl: string,
): Promise<unknown> {
  return request(path(number), {
    method: 'POST',
    body: JSON.stringify({ days, contractSignature: { signatureDataUrl, consent: true } }),
  });
}

export function withdrawExtension(number: string): Promise<unknown> {
  return request(`${path(number)}/cancel`, { method: 'POST' });
}
