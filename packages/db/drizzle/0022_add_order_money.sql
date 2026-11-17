-- The rollups are derived data and gain NOT NULL columns below; the analytics
-- sweep rebuilds every day on the next boot.
DELETE FROM "sales_daily";--> statement-breakpoint
DELETE FROM "product_sales_daily";--> statement-breakpoint
CREATE TABLE "order_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"rental_extension_id" uuid,
	"actor_admin_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_refunds_amount_check" CHECK ("order_refunds"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "extension_total" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refunded_total" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "net_total" numeric(12, 2) GENERATED ALWAYS AS (total + extension_total - refunded_total) STORED;--> statement-breakpoint
ALTER TABLE "sales_daily" ADD COLUMN "extension_revenue" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_daily" ADD COLUMN "refunded_total" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_rental_extension_id_rental_extensions_id_fk" FOREIGN KEY ("rental_extension_id") REFERENCES "public"."rental_extensions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_actor_admin_user_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_refunds_order_idx" ON "order_refunds" USING btree ("order_id","created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_money_check" CHECK ("orders"."extension_total" >= 0 AND "orders"."refunded_total" >= 0
        AND "orders"."refunded_total" <= "orders"."total" + "orders"."extension_total");--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- Backfill, before the triggers exist. See docs/code/order-money.md.
-- 1. Money already received for extensions.
UPDATE "orders" o SET "extension_total" = s.sum
FROM (SELECT "order_id", SUM("amount") AS sum FROM "rental_extensions"
      WHERE "paid_at" IS NOT NULL GROUP BY "order_id") s
WHERE s."order_id" = o."id";--> statement-breakpoint
-- 2. Orders already fully refunded get one refund row for everything they took in.
INSERT INTO "order_refunds" ("order_id", "amount", "reason", "created_at")
SELECT o."id", o."total" + o."extension_total",
       'Refunded before refund amounts were recorded (migration 0022).', o."updated_at"
FROM "orders" o
WHERE (o."status" = 'refunded' OR o."payment_status" = 'refunded')
  AND o."total" + o."extension_total" > 0;--> statement-breakpoint
UPDATE "orders" o SET "refunded_total" = s.sum
FROM (SELECT "order_id", SUM("amount") AS sum FROM "order_refunds" GROUP BY "order_id") s
WHERE s."order_id" = o."id";--> statement-breakpoint
-- 3. A partial refund was never given an amount, so none is invented here:
--    those orders keep refunded_total 0 and the admin flags them for an operator.
-- ---------------------------------------------------------------------------
-- The one writer of orders.extension_total / refunded_total. It RECOMPUTES from
-- the source rows rather than adding a delta, so it is idempotent and a missed
-- or repeated call can never drift. The order row is locked BEFORE summing: a
-- second transaction touching the same order waits here, then sums with a fresh
-- snapshot that includes the first one's committed rows (no lost update).
CREATE FUNCTION "orders_sync_money"(p_order_id uuid) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  ext numeric(12, 2);
  ref numeric(12, 2);
BEGIN
  PERFORM 1 FROM "orders" WHERE "id" = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN; -- the order itself is being deleted (cascade)
  END IF;
  SELECT COALESCE(SUM("amount"), 0) INTO ext FROM "rental_extensions"
   WHERE "order_id" = p_order_id AND "paid_at" IS NOT NULL;
  SELECT COALESCE(SUM("amount"), 0) INTO ref FROM "order_refunds"
   WHERE "order_id" = p_order_id;
  -- updated_at moves so the analytics sweep rebuilds the order's day.
  UPDATE "orders" SET "extension_total" = ext, "refunded_total" = ref, "updated_at" = now()
   WHERE "id" = p_order_id
     AND ("extension_total", "refunded_total") IS DISTINCT FROM (ext, ref);
END $$;--> statement-breakpoint
CREATE FUNCTION "orders_sync_money_from_row"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    PERFORM "orders_sync_money"(OLD."order_id");
  END IF;
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW."order_id" IS DISTINCT FROM OLD."order_id") THEN
    PERFORM "orders_sync_money"(NEW."order_id");
  END IF;
  RETURN NULL;
END $$;--> statement-breakpoint
CREATE TRIGGER "rental_extensions_money_ins_del" AFTER INSERT OR DELETE ON "rental_extensions"
FOR EACH ROW EXECUTE FUNCTION "orders_sync_money_from_row"();--> statement-breakpoint
CREATE TRIGGER "rental_extensions_money_upd" AFTER UPDATE ON "rental_extensions"
FOR EACH ROW WHEN (OLD."amount" IS DISTINCT FROM NEW."amount"
                OR OLD."paid_at" IS DISTINCT FROM NEW."paid_at"
                OR OLD."order_id" IS DISTINCT FROM NEW."order_id")
EXECUTE FUNCTION "orders_sync_money_from_row"();--> statement-breakpoint
CREATE TRIGGER "order_refunds_money_ins_del" AFTER INSERT OR DELETE ON "order_refunds"
FOR EACH ROW EXECUTE FUNCTION "orders_sync_money_from_row"();--> statement-breakpoint
-- Append-only. The two `set null` foreign keys must still be able to clear an
-- actor or extension that was deleted, so only the money facts are frozen.
CREATE FUNCTION "order_refunds_append_only"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW."order_id", NEW."amount", NEW."reason", NEW."created_at")
     IS DISTINCT FROM (OLD."order_id", OLD."amount", OLD."reason", OLD."created_at") THEN
    RAISE EXCEPTION 'order_refunds rows are append-only (refund %)', OLD."id"
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER "order_refunds_append_only" BEFORE UPDATE ON "order_refunds"
FOR EACH ROW EXECUTE FUNCTION "order_refunds_append_only"();
