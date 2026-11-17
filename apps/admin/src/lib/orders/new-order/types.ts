import type { InferResponseType } from 'hono/client';

import { api } from '~/lib/api';
import type { MessageKey } from '~/lib/ui-text';

export type AccountMatches = InferResponseType<
  (typeof api.api.admin.orders)['customer-accounts']['$get'],
  200
>['data'];
export type AccountMatch = AccountMatches[number];
export type LineCards = InferResponseType<
  typeof api.api.admin.orders.manual.products.$get,
  200
>['data'];
export type LineCard = LineCards[number];
/** One product with the choices a line asks about, loaded when its card is picked. */
export type LineProduct = InferResponseType<
  (typeof api.api.admin.orders.manual.products)[':id']['$get'],
  200
>['data'];
export type ProductPage = InferResponseType<typeof api.api.admin.orders.manual.products.$get, 200>;
export type Categories = InferResponseType<typeof api.api.categories.$get, 200>['data'];
export type SaleMode = '' | 'fixed' | 'rental';
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

export type StepId = 'products' | 'packages' | 'customer' | 'review';

/** The wizard's steps, in order. */
export const STEPS: { id: StepId; labelKey: MessageKey }[] = [
  { id: 'products', labelKey: 'newOrder.stepProducts' },
  { id: 'packages', labelKey: 'newOrder.stepPackages' },
  { id: 'customer', labelKey: 'newOrder.stepCustomer' },
  { id: 'review', labelKey: 'newOrder.stepReview' },
];

/** Whole-number unit labels; a rental package is hours or days. */
export const UNIT_LABELS: Record<'hour' | 'day', MessageKey> = {
  hour: 'newOrder.unitHour',
  day: 'newOrder.unitDay',
};
