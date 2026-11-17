CREATE TABLE "product_views_daily" (
	"product_id" uuid NOT NULL,
	"day" date NOT NULL,
	"views" integer NOT NULL,
	CONSTRAINT "product_views_daily_pkey" PRIMARY KEY("product_id","day")
);
--> statement-breakpoint
ALTER TABLE "product_views_daily" ADD CONSTRAINT "product_views_daily_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_views_daily_day_idx" ON "product_views_daily" USING btree ("day");