/** Shapes the rollup reads return (see report-sql.ts). Money is `numeric(12,2)` text. */

export type Totals = {
  revenue: string;
  itemsRevenue: string;
  extensionRevenue: string;
  refundedTotal: string;
  orderCount: number;
  units: number;
  averageOrderValue: string;
};

export type SeriesPoint = {
  key: string;
  start: string;
  revenue: string;
  orderCount: number;
  units: number;
};

export type TopProduct = {
  productId: string | null;
  title: string;
  pricingMode: 'fixed' | 'rental';
  revenue: string;
  units: number;
  orderCount: number;
};

export type ModeSplit = {
  pricingMode: 'fixed' | 'rental';
  revenue: string;
  units: number;
  orderCount: number;
};
