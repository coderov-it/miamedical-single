-- Register with a password: the chosen password waits on the emailed
-- confirmation link and reaches the account only when that link is redeemed.
-- One nullable column, purely additive — no backfill, nothing dropped.
--
-- ── Hand-edited from drizzle-kit's output ────────────────────────────────────
--
-- drizzle-kit re-emitted all of 0015 here too, because 0015 was committed
-- without a snapshot and 0014's was the latest it could diff against. Only the
-- line below is new; 0016_snapshot.json is the first snapshot to include 0015.
-- `IF NOT EXISTS` for the same re-runnable reasoning as 0014 and 0015.

ALTER TABLE "customer_auth_tokens" ADD COLUMN IF NOT EXISTS "pending_password_hash" text;
