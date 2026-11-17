import type { InferResponseType } from 'hono/client';

import type { api } from '~/lib/api';

export type StockHistory = InferResponseType<
  (typeof api.api.admin.products)[':id']['stock-history']['$get'],
  200
>['data'];
export type Movement = StockHistory['movements'][number];
export type Reason = Movement['reason'];
