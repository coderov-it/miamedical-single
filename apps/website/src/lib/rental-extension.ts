import type { InferResponseType } from 'hono/client';

import type { api } from './api.ts';
import { request } from './customer-session.ts';

/**
 * The customer's half of a rental extension — request, see where it stands,
 * withdraw before paying. Flow and worked example: docs/code/rental-extensions.md.
 * Own module because customer-session.ts is already past its size budget.
 */

export type ExtensionOverview = InferResponseType<
  (typeof api.api.customer)['rental-extensions'][':number']['$get'],
  200
>['data'];

const path = (number: string) => `/api/customer/rental-extensions/${encodeURIComponent(number)}`;

export function getExtension(number: string, locale: string): Promise<ExtensionOverview> {
  return request(`${path(number)}?${new URLSearchParams({ locale })}`);
}

export function requestExtension(number: string, days: number): Promise<unknown> {
  return request(path(number), { method: 'POST', body: JSON.stringify({ days }) });
}

export function withdrawExtension(number: string): Promise<unknown> {
  return request(`${path(number)}/cancel`, { method: 'POST' });
}
