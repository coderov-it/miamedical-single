DROP TABLE "delivery_zones" CASCADE;--> statement-breakpoint
DROP TABLE "istat_comune_caps" CASCADE;--> statement-breakpoint
DROP TABLE "istat_comuni" CASCADE;--> statement-breakpoint
DROP TABLE "istat_provinces" CASCADE;--> statement-breakpoint
DROP TABLE "istat_regions" CASCADE;--> statement-breakpoint
DROP TABLE "zone_resolution_misses" CASCADE;--> statement-breakpoint
DROP TYPE "public"."delivery_zone_level";--> statement-breakpoint
DROP TYPE "public"."delivery_zone_value";--> statement-breakpoint
-- Hand-added, like 0008_retire_hotel_delivery before it.
--
-- An order's `delivery` block carried a `quote` object naming the zone that priced
-- it. Those zones are gone, so it points at a row that no longer exists and an
-- operator reading an old order would see a fee nothing can explain.
-- `shipping_total` keeps the amount, which is the part that was actually settled.
--
-- `deliveryCity` and `deliveryPostalCode` are deliberately NOT stripped. New orders
-- stop writing them — the address arrives as one free-text block — but on an order
-- already placed they are a true record of where it went, and the mapper reads the
-- block field by field, so an old shape renders fully and a new one leaves them
-- blank.
UPDATE "orders" SET "delivery" = "delivery" - 'quote' WHERE "delivery" ? 'quote';