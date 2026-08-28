DROP INDEX "products_sku_key";--> statement-breakpoint
ALTER TABLE "product_addons" DROP COLUMN "sku";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "sku";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "sku";