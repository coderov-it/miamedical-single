ALTER TABLE "products" ADD COLUMN "order_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "products_order_count_idx" ON "products" USING btree ("order_count" desc);--> statement-breakpoint
-- Backfill from the order history, so "most requested" is truthful on day one
-- rather than ranking every product at zero until the next order lands. One per
-- ORDER, not per unit: a cart holding three of the same product counts once.
UPDATE "products" p
SET "order_count" = agg.orders
FROM (
  SELECT "product_id", COUNT(DISTINCT "order_id")::int AS orders
  FROM "order_items"
  WHERE "product_id" IS NOT NULL
  GROUP BY "product_id"
) agg
WHERE p."id" = agg."product_id";
