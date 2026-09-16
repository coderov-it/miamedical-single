-- Push notifications: one new table, one new enum, three new columns, two
-- indexes. Purely additive — it reads no existing row, rewrites none and drops
-- nothing, so there is no backfill to get wrong and nothing to lose by applying
-- it late.
--
-- `customer_accounts.language` is deliberately left NULL on every existing row
-- rather than defaulted to 'it'. NULL means "never told us", which is the truth
-- about all of them; writing 'it' would turn an absence of information into a
-- stated preference and destroy the distinction permanently.
--
-- `notification_preferences` DOES default, to '{}', because the empty object is
-- not a claim about the customer — it is the literal encoding of "no deviations
-- from the defaults", which is exactly what we know.
--
-- ── Hand-edited from drizzle-kit's output to be re-runnable ──────────────────
--
-- Same reasoning as 0014: the ledger already stops a second run through
-- `db:migrate`, so these guards are for every other way DDL arrives — psql by
-- hand, a replay onto a `drizzle-kit push`ed database, or a restore that
-- captured some objects and not others. Every statement is a no-op when its
-- object already exists, and the assertion at the end is loud when what exists
-- is the wrong shape.

DO $mig$
BEGIN
  CREATE TYPE "public"."device_platform" AS ENUM('android', 'ios');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$mig$;

CREATE TABLE IF NOT EXISTS "push_devices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_account_id" uuid NOT NULL,
  "token" text NOT NULL,
  "platform" "public"."device_platform" NOT NULL,
  "language" "public"."language_code",
  "app_version" text NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $mig$
BEGIN
  ALTER TABLE "push_devices"
    ADD CONSTRAINT "push_devices_customer_account_id_customer_accounts_id_fk"
    FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$mig$;

-- Unique across the table, not per customer: a resold or shared handset would
-- otherwise hold one row per person who ever signed in on it, and receive all
-- of their notifications.
CREATE UNIQUE INDEX IF NOT EXISTS "push_devices_token_key" ON "push_devices" ("token");
CREATE INDEX IF NOT EXISTS "push_devices_customer_idx" ON "push_devices" ("customer_account_id");

ALTER TABLE "customer_accounts" ADD COLUMN IF NOT EXISTS "language" "public"."language_code";
ALTER TABLE "customer_accounts"
  ADD COLUMN IF NOT EXISTS "notification_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL;

-- `pushed_at` and its backfill are ONE statement, and they have to be.
--
-- Every customer notification already in this table was written before push
-- existed and was never going to be sent. Left NULL they are "pending", so the
-- first sweep after deploy would treat the last six hours of order updates as a
-- backlog and fire them at whatever devices exist. Today that set is empty and
-- nothing would happen; it will not stay empty, and a migration whose effect
-- depends on when it is run is a migration that breaks exactly once.
--
-- The backfill is INSIDE the "column did not exist" branch rather than a bare
-- UPDATE, because a bare one is the opposite hazard: re-run against a live
-- database it would mark genuinely pending rows as handled and those customers
-- would never be notified. Tying it to the column's creation makes the second
-- run a no-op by construction rather than by a predicate somebody has to get
-- right.
--
-- `now()` rather than `created_at`: both are untrue for a row nobody pushed, and
-- `now()` is untrue in the obvious direction. Anyone later measuring
-- `pushed_at - created_at` sees an absurd value on these rows and asks, where
-- `created_at` would show a plausible zero and be believed.
DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'pushed_at'
  ) THEN
    ALTER TABLE "notifications" ADD COLUMN "pushed_at" timestamp with time zone;
    /* Operator rows are deliberately untouched: nothing pushes to an operator,
       so leaving them NULL keeps "was this ever a push candidate" answerable. */
    UPDATE "notifications" SET "pushed_at" = now() WHERE "audience" = 'customer';
  END IF;
END
$mig$;

-- Partial on BOTH conditions. The pending set is tiny and permanently so — a row
-- is claimed within milliseconds of being written — while `notifications` grows
-- forever, so a full index here would be almost entirely dead entries for rows
-- pushed years ago. The audience clause keeps operator rows, which are never
-- pushed, out of the sweep's scan.
CREATE INDEX IF NOT EXISTS "notifications_push_pending_idx"
  ON "notifications" ("created_at")
  WHERE "pushed_at" IS NULL AND "audience" = 'customer';

-- ── Assertions ───────────────────────────────────────────────────────────────
--
-- IF NOT EXISTS cannot tell "this already exists, correctly" from "something of
-- this name exists, shaped differently", and skips both in silence. So re-read
-- the catalog and refuse loudly when what is there is not what this file
-- describes. Quiet on a correct database; loud and specific on a divergent one,
-- and because the batch is one transaction, nothing is recorded either way.
DO $mig$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(expected.name, ', ' ORDER BY expected.name) INTO missing
  FROM (VALUES
    ('id'), ('customer_account_id'), ('token'), ('platform'),
    ('language'), ('app_version'), ('last_seen_at'), ('created_at')
  ) AS expected(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'push_devices'
      AND column_name = expected.name
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION
      'push_devices already exists but is missing column(s): %. Something other than this migration created it — most likely drizzle-kit push. Reconcile it by hand; do not edit this file.', missing;
  END IF;

  -- The whole point of the table. Non-unique, and one handset accumulates a row
  -- per sign-in and receives every one of those accounts' notifications.
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'push_devices_token_key'
      AND i.indrelid = 'public.push_devices'::regclass
      AND i.indisunique
  ) THEN
    RAISE EXCEPTION
      'push_devices_token_key must be a UNIQUE index. Without it the registration upsert cannot infer a conflict target and one phone can belong to several accounts at once.';
  END IF;

  /* `pushed_at` is not asserted here, and cannot usefully be: the block above
     recreates it when it is absent, so by this point it always exists.
     Self-healing is the right behaviour for a dropped column — it matches the
     ADD COLUMN IF NOT EXISTS above it — but it has one consequence worth
     stating, because it is invisible: dropping this column DESTROYS the
     pending/handled state, and nothing can recover it. The heal therefore marks
     every customer row handled, losing any push that was genuinely queued at
     that moment rather than firing a burst of stale ones later. Verified on a
     scratch database; do not "fix" it into an exception without deciding which
     of those two failures you prefer. */

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_accounts'
      AND column_name = 'notification_preferences' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION
      'customer_accounts.notification_preferences must exist and be NOT NULL. A nullable column would give every read two ways to mean "no deviations".';
  END IF;
END
$mig$;
