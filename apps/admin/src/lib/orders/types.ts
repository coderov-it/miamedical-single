/**
 * The order as the admin API hands it over, inferred from the route rather than
 * restated here — the cards that render a slice of it all name their props off
 * this one type, so a field that changes shape on the server breaks the build
 * instead of the page.
 */
import type { InferResponseType } from 'hono/client';

import { api } from '~/lib/api';

export type OrderDetail = InferResponseType<
  (typeof api.api.admin.orders)[':id']['$get'],
  200
>['data'];

export type OrderItem = OrderDetail['items'][number];
export type OrderEvent = OrderDetail['events'][number];
export type OrderAddress = NonNullable<OrderDetail['shippingAddress']>;
