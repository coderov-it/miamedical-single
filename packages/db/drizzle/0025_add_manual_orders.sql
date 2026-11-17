CREATE TYPE "public"."order_source" AS ENUM('online', 'manual');--> statement-breakpoint
CREATE TABLE "order_link_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"steps" text NOT NULL,
	"include_details" boolean NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_by_admin_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_fiscal_check";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "source" "order_source" DEFAULT 'online' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "created_by_admin_user_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_reason" text;--> statement-breakpoint
ALTER TABLE "order_link_tokens" ADD CONSTRAINT "order_link_tokens_order_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_link_tokens" ADD CONSTRAINT "order_link_tokens_admin_fk" FOREIGN KEY ("created_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_link_tokens_order_idx" ON "order_link_tokens" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_link_tokens_expires_idx" ON "order_link_tokens" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_admin_fk" FOREIGN KEY ("created_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_check" CHECK ("orders"."discount_total" >= 0 AND "orders"."discount_total" <= "orders"."subtotal" + "orders"."shipping_total");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_manual_actor_check" CHECK ("orders"."source" <> 'manual' OR "orders"."created_by_admin_user_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_fiscal_check" CHECK ("orders"."source" = 'manual' OR (
        ("orders"."customer_type" <> 'private' OR "orders"."codice_fiscale" IS NOT NULL)
        AND ("orders"."customer_type" <> 'company' OR ("orders"."partita_iva" IS NOT NULL AND "orders"."codice_fiscale" IS NOT NULL))));