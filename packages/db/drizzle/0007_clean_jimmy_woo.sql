CREATE TYPE "public"."customer_type" AS ENUM('private', 'company', 'tourist');--> statement-breakpoint
CREATE SEQUENCE "public"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "configuration" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_type" "customer_type";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "codice_fiscale" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "partita_iva" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_check" CHECK ("orders"."delivery" IS NULL OR "orders"."delivery" ? 'method');--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_fiscal_check" CHECK (("orders"."customer_type" <> 'private' OR "orders"."codice_fiscale" IS NOT NULL)
        AND ("orders"."customer_type" <> 'company' OR ("orders"."partita_iva" IS NOT NULL AND "orders"."codice_fiscale" IS NOT NULL)));