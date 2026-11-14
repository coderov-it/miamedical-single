CREATE TYPE "public"."payment_attempt_status" AS ENUM('pending', 'paid', 'failed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"rental_extension_id" uuid,
	"provider" text NOT NULL,
	"provider_reference" text NOT NULL,
	"provider_secret" text,
	"access_token" text NOT NULL,
	"status" "payment_attempt_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"provider_result" text,
	"provider_operation_id" text,
	"payment_circuit" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stock_taken" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_rental_extension_id_rental_extensions_id_fk" FOREIGN KEY ("rental_extension_id") REFERENCES "public"."rental_extensions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_attempts_provider_reference_key" ON "payment_attempts" USING btree ("provider","provider_reference");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_attempts_access_token_key" ON "payment_attempts" USING btree ("access_token");--> statement-breakpoint
CREATE INDEX "payment_attempts_order_idx" ON "payment_attempts" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_payment_due_idx" ON "orders" USING btree ("payment_due_at") WHERE "orders"."status" = 'pending' AND "orders"."payment_due_at" IS NOT NULL;