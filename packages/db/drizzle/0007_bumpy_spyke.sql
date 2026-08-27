ALTER TABLE "categories" ADD COLUMN "requires_deposit" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
-- Electric mobility categories take a deposit; hand-added like 0006's backfill.
UPDATE "categories" SET "requires_deposit" = true
WHERE "code" ILIKE '%scooter%' OR "code" ILIKE '%elettri%';
