CREATE TYPE "public"."rental_extension_status" AS ENUM('renew_pending', 'awaiting_signature', 'active', 'cancelled');--> statement-breakpoint
CREATE TABLE "rental_extensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "rental_extension_status" DEFAULT 'renew_pending' NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"days" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"line_amounts" jsonb NOT NULL,
	"requested_by_customer_account_id" uuid,
	"requested_by_admin_user_id" uuid,
	"payment_method" text,
	"payment_reference" text,
	"paid_at" timestamp with time zone,
	"paid_by_admin_user_id" uuid,
	"contract_id" uuid,
	"activated_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rental_extensions_period_check" CHECK ("rental_extensions"."to_date" > "rental_extensions"."from_date" AND "rental_extensions"."days" > 0),
	CONSTRAINT "rental_extensions_paid_check" CHECK ("rental_extensions"."status" NOT IN ('awaiting_signature', 'active') OR "rental_extensions"."paid_at" IS NOT NULL),
	CONSTRAINT "rental_extensions_cancelled_check" CHECK ("rental_extensions"."status" <> 'cancelled' OR "rental_extensions"."cancelled_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_requested_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("requested_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_paid_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("paid_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_customer_fk" FOREIGN KEY ("requested_by_customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rental_extensions_order_idx" ON "rental_extensions" USING btree ("order_id","to_date");--> statement-breakpoint
CREATE INDEX "rental_extensions_contract_idx" ON "rental_extensions" USING btree ("contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rental_extensions_one_open_key" ON "rental_extensions" USING btree ("order_id") WHERE "rental_extensions"."status" IN ('renew_pending', 'awaiting_signature');