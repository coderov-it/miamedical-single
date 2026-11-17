import type { InferResponseType } from 'hono/client';

import { api } from '~/lib/api';
import type { MessageKey } from '~/lib/ui-text';

export type AccountMatches = InferResponseType<
  (typeof api.api.admin.orders)['customer-accounts']['$get'],
  200
>['data'];
export type AccountMatch = AccountMatches[number];
export type LineProducts = InferResponseType<
  typeof api.api.admin.orders.manual.products.$get,
  200
>['data'];
export type LineProduct = LineProducts[number];
export type Quote = InferResponseType<typeof api.api.admin.orders.manual.quote.$post, 200>['data'];

export type CustomerType = 'private' | 'company' | 'tourist';
export type DeliveryMethod = 'homeDelivery' | 'storePickup';

export const CUSTOMER_TYPES: { value: CustomerType; labelKey: MessageKey }[] = [
  { value: 'private', labelKey: 'newOrder.typePrivate' },
  { value: 'company', labelKey: 'newOrder.typeCompany' },
  { value: 'tourist', labelKey: 'newOrder.typeTourist' },
];

/** What a quote request answers: the figures, or the server's refusal. */
export type QuoteResult = { quote: Quote } | { message: string };

/** Row style shared by the two lookup dropdowns. */
export const RESULT_ROW_CLASS =
  'flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted';
