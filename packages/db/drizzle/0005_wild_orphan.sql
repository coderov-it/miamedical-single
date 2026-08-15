ALTER TABLE "products" DROP CONSTRAINT "products_rental_packages_check";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "base_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "marketing_rate" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_base_price_check" CHECK (("products"."pricing_mode" = 'fixed') = ("products"."base_price" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_marketing_rate_check" CHECK ("products"."marketing_rate" IS NULL OR "products"."pricing_mode" = 'rental');--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_rental_packages_check" CHECK (CASE WHEN "products"."pricing_mode" = 'rental'
                 THEN jsonb_array_length("products"."rental_packages") >= 1
                 ELSE "products"."rental_packages" = '[]'::jsonb END);