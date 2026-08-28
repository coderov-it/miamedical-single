ALTER TABLE "attribute_preset_options" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attribute_presets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_sku_options" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_skus" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_variant_groups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_variant_options" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "attribute_preset_options" CASCADE;--> statement-breakpoint
DROP TABLE "attribute_presets" CASCADE;--> statement-breakpoint
DROP TABLE "product_sku_options" CASCADE;--> statement-breakpoint
DROP TABLE "product_skus" CASCADE;--> statement-breakpoint
DROP TABLE "product_variant_groups" CASCADE;--> statement-breakpoint
DROP TABLE "product_variant_options" CASCADE;--> statement-breakpoint
-- `IF EXISTS` is hand-added: `DROP TABLE "product_skus" CASCADE` above has already
-- taken both of these with it, so drizzle-kit's bare DROP CONSTRAINT aborts the
-- migration on a constraint Postgres removed two statements earlier. Kept rather
-- than deleted so the file still states the intent on a database where the
-- cascade did not reach them.
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_sku_id_product_skus_id_fk";--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_sku_id_product_skus_id_fk";--> statement-breakpoint
DROP INDEX "products_base_sku_key";--> statement-breakpoint
DROP INDEX "cart_items_cart_sku_key";--> statement-breakpoint
-- Hand-edited from drizzle-kit's ADD COLUMN "sku" + DROP COLUMN "base_sku" pair.
-- `base_sku` was only ever "base" as the root of a generated SKU string, so with
-- the matrix gone this is a RENAME — which drizzle cannot tell from a drop-and-add
-- without an interactive prompt. Its version added a NOT NULL column with no
-- default and Postgres refused it on the 98 imported products; this keeps every
-- code the WordPress migration derived.
ALTER TABLE "products" RENAME COLUMN "base_sku" TO "sku";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "product_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_key" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_product_key" ON "cart_items" USING btree ("cart_id","product_id");--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN "sku_id";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "sku_id";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "sku_label";