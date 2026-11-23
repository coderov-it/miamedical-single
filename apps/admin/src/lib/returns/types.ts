/** Wire shapes of the two lists on the Return check page. */

/** What both lists print around one returned unit. */
export interface ReturnUnit {
  orderId: string;
  orderNumber: string;
  productTitle: string;
  /** Storage path; `mediaUrl()` adds the CDN base. Null: no image or product deleted. */
  productImage: string | null;
  unitNumber: number;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerCity: string | null;
  /** `YYYY-MM-DD`, the delivered dates. */
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  receivedAt: string | null;
  receivedByName: string | null;
}

/** `GET /api/admin/returns/pending` — one returned unit nobody has decided yet. */
export interface PendingUnit extends ReturnUnit {
  orderItemId: string;
}

/** `GET /api/admin/attention` — one unit flagged for a look. */
export interface AttentionRow extends ReturnUnit {
  id: string;
  note: string | null;
  inspectedAt: string;
  inspectedByName: string | null;
}
