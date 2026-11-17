CREATE TYPE "public"."stock_movement_reason" AS ENUM('opening_balance', 'product_created', 'order_placed', 'order_paid', 'order_cancelled', 'order_refunded', 'rental_returned', 'manual_adjustment', 'unknown');--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stock_movements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"product_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"reason" "stock_movement_reason" NOT NULL,
	"order_id" uuid,
	"actor_admin_user_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movements_delta_check" CHECK ("stock_movements"."delta" <> 0 OR "stock_movements"."reason" IN ('opening_balance', 'product_created'))
);
--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_admin_user_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_movements_product_idx" ON "stock_movements" USING btree ("product_id","id");--> statement-breakpoint
CREATE INDEX "stock_movements_order_idx" ON "stock_movements" USING btree ("order_id");--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- Opening balance: one row per existing product, so each product's deltas sum
-- to its stock from day one. See docs/code/stock-history.md.
INSERT INTO "stock_movements" ("product_id", "delta", "stock_after", "reason", "note")
SELECT "id", "stock", "stock", 'opening_balance', 'Stock when history started (migration 0023).'
FROM "products";--> statement-breakpoint
-- The one writer of stock_movements. The app says WHY just before a stock
-- write, with transaction-local settings (set_config(..., true)):
--   mia.stock_reason, mia.stock_order_id, mia.stock_actor_id, mia.stock_note
-- Each setting is CONSUMED by the row that reads it, so a later write in the
-- same transaction that names nothing is recorded as `unknown` — never under a
-- stale reason. Nothing here can fail the stock write itself: a bad reason or
-- id degrades to `unknown` with the problem in `note`.
CREATE FUNCTION "stock_movements_record"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  raw_reason text := NULLIF(current_setting('mia.stock_reason', true), '');
  raw_order  text := NULLIF(current_setting('mia.stock_order_id', true), '');
  raw_actor  text := NULLIF(current_setting('mia.stock_actor_id', true), '');
  v_note     text := NULLIF(current_setting('mia.stock_note', true), '');
  v_fallback "stock_movement_reason";
  v_reason   "stock_movement_reason";
  v_order    uuid;
  v_actor    uuid;
  v_delta    integer;
BEGIN
  PERFORM set_config('mia.stock_reason', '', true), set_config('mia.stock_order_id', '', true),
          set_config('mia.stock_actor_id', '', true), set_config('mia.stock_note', '', true);

  IF TG_OP = 'INSERT' THEN
    v_delta := NEW."stock";
    v_fallback := 'product_created';
  ELSE
    v_delta := NEW."stock" - OLD."stock";
    v_fallback := 'unknown';
  END IF;

  BEGIN
    v_reason := COALESCE(raw_reason::"stock_movement_reason", v_fallback);
  EXCEPTION WHEN invalid_text_representation THEN
    v_reason := v_fallback;
    v_note := concat_ws(' · ', v_note, 'unrecognised reason: ' || raw_reason);
  END;
  BEGIN
    v_order := raw_order::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_order := NULL;
  END;
  BEGIN
    v_actor := raw_actor::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_actor := NULL;
  END;

  BEGIN
    INSERT INTO "stock_movements"
      ("product_id", "delta", "stock_after", "reason", "order_id", "actor_admin_user_id", "note")
    VALUES (NEW."id", v_delta, NEW."stock", v_reason, v_order, v_actor, v_note);
  EXCEPTION WHEN foreign_key_violation THEN
    -- An order or actor id that does not exist: keep the movement and its
    -- reason, drop only the ids.
    INSERT INTO "stock_movements" ("product_id", "delta", "stock_after", "reason", "note")
    VALUES (NEW."id", v_delta, NEW."stock", v_reason,
            concat_ws(' · ', v_note, 'ids dropped: ' || SQLERRM));
  WHEN check_violation THEN
    -- A zero delta under a reason that must move stock (only on INSERT).
    INSERT INTO "stock_movements" ("product_id", "delta", "stock_after", "reason", "note")
    VALUES (NEW."id", v_delta, NEW."stock", v_fallback,
            concat_ws(' · ', v_note, 'reason dropped: ' || SQLERRM));
  END;
  RETURN NULL;
END $$;--> statement-breakpoint
CREATE TRIGGER "products_stock_movement_ins" AFTER INSERT ON "products"
FOR EACH ROW EXECUTE FUNCTION "stock_movements_record"();--> statement-breakpoint
CREATE TRIGGER "products_stock_movement_upd" AFTER UPDATE OF "stock" ON "products"
FOR EACH ROW WHEN (OLD."stock" IS DISTINCT FROM NEW."stock")
EXECUTE FUNCTION "stock_movements_record"();--> statement-breakpoint
-- Append-only. The `set null` foreign keys may still clear an order or actor
-- that was deleted, and deleting a PRODUCT may cascade its history away
-- (pg_trigger_depth() is 2 inside a cascade); a direct DELETE is refused.
CREATE FUNCTION "stock_movements_append_only"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF pg_trigger_depth() < 2 THEN
      RAISE EXCEPTION 'stock_movements rows are append-only (movement %)', OLD."id"
        USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF (NEW."product_id", NEW."delta", NEW."stock_after", NEW."reason", NEW."note", NEW."created_at")
     IS DISTINCT FROM
     (OLD."product_id", OLD."delta", OLD."stock_after", OLD."reason", OLD."note", OLD."created_at") THEN
    RAISE EXCEPTION 'stock_movements rows are append-only (movement %)', OLD."id"
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER "stock_movements_append_only" BEFORE UPDATE OR DELETE ON "stock_movements"
FOR EACH ROW EXECUTE FUNCTION "stock_movements_append_only"();
