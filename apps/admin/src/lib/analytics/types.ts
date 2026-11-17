import type { InferResponseType } from 'hono/client';

import type { api } from '~/lib/api';

export type Views = InferResponseType<typeof api.api.admin.analytics.views.$get, 200>['data'];
export type Sales = InferResponseType<typeof api.api.admin.analytics.sales.$get, 200>['data'];
export type TopProduct = Sales['topProducts']['byRevenue'][number];
export type SeriesPoint = Sales['series'][number];
export type Metric = 'revenue' | 'orderCount' | 'units' | 'views';

export type ChartKind = 'bar' | 'line';

/** Everything the two chart bodies and their tooltip share. */
export interface TrendModel {
  points: { key: string; value: number }[];
  ticks: string[];
  config: { value: { label: string; color: string } };
  axisFormat: (key: string) => string;
  titleFor: (key: string) => string;
  /** Integer ticks for count metrics; revenue leaves the axis to pick its own. */
  yTicks?: number[];
  yFormat: (value: number) => string;
  fullFormat: (value: number) => string;
}
