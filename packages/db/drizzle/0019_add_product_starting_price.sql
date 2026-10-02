ALTER TABLE "products" ADD COLUMN "starting_price" numeric(12, 2);--> statement-breakpoint
-- Backfill with the exact expression the price sort computed per row until now,
-- so the first sort that reads the column orders the catalogue as the last one
-- that did not. From here on the application writes it on every save — see
-- `startingPrice()` in @mia/pricing.
UPDATE "products"
SET "starting_price" = COALESCE(
  "base_price",
  (SELECT MIN((entry->>'price')::numeric)
     FROM jsonb_array_elements("rental_packages") AS entry)
);--> statement-breakpoint
CREATE INDEX "products_status_mode_starting_price_idx" ON "products" USING btree ("status","pricing_mode","starting_price");
