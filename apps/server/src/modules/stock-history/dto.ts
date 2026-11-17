import type { StockReason } from '../../shared/stock-context.ts';

export type { StockReason };

export interface StockHistoryDto {
  product: { id: string; title: string; stock: number };
  range: { from: string; to: string };
  /** One per Rome day; null before the product's first movement. */
  series: Array<{ day: string; stock: number | null }>;
  /** Newest first, 25 per page. */
  movements: Array<{
    id: string;
    at: string;
    reason: StockReason;
    delta: number;
    stockAfter: number;
    order: { id: string; number: string } | null;
    actorName: string | null;
    note: string | null;
  }>;
  movementsMeta: { page: number; perPage: number; total: number };
}
