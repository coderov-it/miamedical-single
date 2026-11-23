/** The `returnUnits` block of the admin order detail. Pure, no IO. */

import type { ReturnUnitDto } from './dto.ts';
import type { OrderItemRow, ReturnInspectionRow } from './types.ts';

/** Rental lines only, in line order, each with the decisions made so far (oldest first). */
export function toReturnUnits(
  items: readonly OrderItemRow[],
  inspections: readonly ReturnInspectionRow[],
): ReturnUnitDto[] {
  return items
    .filter((item) => item.configuration?.pricingMode === 'rental')
    .map((item) => ({
      orderItemId: item.id,
      productTitle: item.productTitle,
      quantity: item.quantity,
      decisions: inspections
        .filter((row) => row.orderItemId === item.id)
        .map((row) => ({
          id: row.id,
          outcome: row.outcome,
          note: row.note,
          resolution: row.resolution,
          resolutionNote: row.resolutionNote,
          inspectedAt: row.inspectedAt.toISOString(),
          resolvedAt: row.resolvedAt?.toISOString() ?? null,
        })),
    }));
}
