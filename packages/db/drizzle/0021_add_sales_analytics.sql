CREATE TABLE "product_sales_daily" (
	"day" date NOT NULL,
	"product_id" uuid,
	"product_title" text NOT NULL,
	"pricing_mode" "pricing_mode" NOT NULL,
	"order_count" integer NOT NULL,
	"units" integer NOT NULL,
	"revenue" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_daily" (
	"day" date PRIMARY KEY NOT NULL,
	"order_count" integer NOT NULL,
	"revenue" numeric(12, 2) NOT NULL,
	"items_revenue" numeric(12, 2) NOT NULL,
	"shipping_total" numeric(12, 2) NOT NULL,
	"discount_total" numeric(12, 2) NOT NULL,
	"units" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "product_sales_daily_day_idx" ON "product_sales_daily" USING btree ("day");--> statement-breakpoint
CREATE INDEX "product_sales_daily_product_day_idx" ON "product_sales_daily" USING btree ("product_id","day");