-- The in-app notification feed: one table serving both audiences. Purely
-- additive — one new type, one new table, three indexes, three foreign keys. It
-- reads no existing row, rewrites none and drops nothing, so there is no
-- backfill to get wrong and nothing to lose by applying it late.
--
-- Unlike 0011 and 0012, this one may safely share its transaction with
-- everything else pending. That restriction is specific to
-- `ALTER TYPE ... ADD VALUE` on a type that already existed; a type CREATED in
-- the transaction is usable inside it, which is what the CREATE TABLE below
-- relies on.
--
-- ── Hand-edited from drizzle-kit's output to be re-runnable ──────────────────
--
-- `pnpm -w run db:migrate` already refuses to apply this twice — it records what
-- it has run and wraps the whole pending batch in one transaction. These guards
-- are for every other way DDL reaches a database: applied by hand with psql,
-- replayed onto a `drizzle-kit push`ed dev database, or re-run after a restore
-- that captured some objects and not others. Every statement below is a no-op
-- when its object already exists.
--
-- `IF NOT EXISTS` alone would be the WRONG answer, because it cannot tell "this
-- already exists, correctly" from "something of this name exists, shaped
-- differently" — and it skips both in silence. So the last statement is an
-- assertion: it re-reads the catalog and raises if the table that ended up there
-- is not the one this migration describes. Re-running is quiet; re-running onto
-- a divergent database is loud. That is the property worth having, and neither
-- half delivers it alone.
DO $mig$
BEGIN
  -- PostgreSQL has no `CREATE TYPE IF NOT EXISTS`; this is the standard stand-in.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'notification_audience' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "public"."notification_audience" AS ENUM('customer', 'admin');
  END IF;
END
$mig$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audience" "notification_audience" NOT NULL,
	"customer_account_id" uuid,
	"admin_user_id" uuid,
	"type" text NOT NULL,
	"data" jsonb NOT NULL,
	"order_id" uuid,
	"dedupe_key" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_recipient_check" CHECK (("notifications"."audience" = 'customer' AND "notifications"."customer_account_id" IS NOT NULL AND "notifications"."admin_user_id" IS NULL)
        OR ("notifications"."audience" = 'admin' AND "notifications"."admin_user_id" IS NOT NULL AND "notifications"."customer_account_id" IS NULL))
);
--> statement-breakpoint
-- `ADD CONSTRAINT` has no `IF NOT EXISTS` either, so each is guarded by name.
-- Drizzle's derived names are kept rather than replaced: they measure 57, 45 and
-- 35 bytes, comfortably inside PostgreSQL's 63-byte identifier limit. The
-- indexes below are named explicitly anyway, because a name that fits by luck is
-- a name that breaks on the next column rename.
DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_customer_account_id_customer_accounts_id_fk'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_admin_user_id_admin_users_id_fk'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_order_id_orders_id_fk'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END
$mig$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_customer_feed_idx" ON "notifications" USING btree ("customer_account_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_admin_feed_idx" ON "notifications" USING btree ("admin_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
-- PARTIAL, so the event-driven rows that carry no key cost nothing here and only
-- the sweep's rows are policed.
--
-- ⚠️ The predicate is load-bearing beyond this file. PostgreSQL cannot infer a
-- partial unique index for an ON CONFLICT clause unless the STATEMENT repeats
-- the same predicate, so `modules/notifications/write.ts` sends
-- `ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING`. Change the
-- predicate here and every sweep tick fails at runtime with "no unique or
-- exclusion constraint matching the ON CONFLICT specification". The assertion
-- below is what turns that runtime failure into a migration-time one.
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_dedupe_key" ON "notifications" USING btree ("dedupe_key") WHERE "notifications"."dedupe_key" IS NOT NULL;--> statement-breakpoint
-- The half that makes the guards above safe.
--
-- Everything up to here skips quietly when an object of that NAME exists. This
-- re-reads the catalog and refuses to let the migration be recorded as applied
-- unless what is actually in the database matches what this file describes.
-- Re-running on a correct database: silent. Re-running on a divergent one: an
-- error naming exactly what is wrong, and — because db:migrate runs the batch in
-- one transaction — nothing recorded and nothing half-applied.
DO $mig$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(expected.name, ', ' ORDER BY expected.name) INTO missing
  FROM (VALUES
    ('id'), ('audience'), ('customer_account_id'), ('admin_user_id'), ('type'),
    ('data'), ('order_id'), ('dedupe_key'), ('read_at'), ('created_at')
  ) AS expected(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications'
      AND column_name = expected.name
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION
      'notifications already exists but is missing column(s): %. Something other than this migration created it — most likely drizzle-kit push. Reconcile it by hand; do not edit this file.', missing;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_recipient_check'
      AND conrelid = 'public.notifications'::regclass
      AND contype = 'c'
  ) THEN
    RAISE EXCEPTION
      'notifications is missing notifications_recipient_check. Without it a row can name both a customer and an admin, or neither.';
  END IF;

  -- Unique AND partial, both. A non-unique index would let the sweep duplicate;
  -- a non-partial one would make every ON CONFLICT in write.ts fail to infer it.
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'notifications_dedupe_key'
      AND i.indrelid = 'public.notifications'::regclass
      AND i.indisunique
      AND i.indpred IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'notifications_dedupe_key must be a UNIQUE index with a WHERE dedupe_key IS NOT NULL predicate. Without both, the sweep either duplicates rows or fails every tick on ON CONFLICT inference.';
  END IF;
END
$mig$;
