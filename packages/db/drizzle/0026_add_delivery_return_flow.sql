-- Adds order_status and stock_movement_reason values, plus the return tables.
--
-- This migration must stay alone. A transaction cannot use an enum value it
-- added itself, so no backfill may share it. The legacy-order move lives in
-- `apps/server/script/move-legacy-rentals.ts` and runs after this migration
-- has committed (see docs/code/order-delivery-and-return.md).
CREATE TYPE "public"."attention_resolution" AS ENUM('repaired', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."inspection_outcome" AS ENUM('restocked', 'attention');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'out_for_delivery' BEFORE 'fulfilled';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'delivery_missed' BEFORE 'fulfilled';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'delivered' BEFORE 'fulfilled';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'out_for_pickup' BEFORE 'fulfilled';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'pickup_missed' BEFORE 'fulfilled';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'received' BEFORE 'fulfilled';--> statement-breakpoint
ALTER TYPE "public"."stock_movement_reason" ADD VALUE 'unit_repaired' BEFORE 'manual_adjustment';--> statement-breakpoint
CREATE TABLE "return_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"product_id" uuid,
	"outcome" "inspection_outcome" NOT NULL,
	"note" text,
	"resolution" "attention_resolution",
	"resolution_note" text,
	"inspected_by_admin_user_id" uuid,
	"inspected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_by_admin_user_id" uuid,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "return_inspections" ADD CONSTRAINT "return_inspections_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_inspections" ADD CONSTRAINT "return_inspections_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_inspections" ADD CONSTRAINT "return_inspections_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_inspections" ADD CONSTRAINT "return_inspections_inspected_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("inspected_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_inspections" ADD CONSTRAINT "return_inspections_resolved_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("resolved_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "return_inspections_order_idx" ON "return_inspections" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "return_inspections_queue_idx" ON "return_inspections" USING btree ("outcome","resolution","inspected_at");