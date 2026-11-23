-- Adds the db_backups log: one row per database backup file, scheduled or manual.
-- Purely additive; see docs/code/db-backup.md.
CREATE TYPE "public"."backup_kind" AS ENUM('scheduled', 'manual');--> statement-breakpoint
CREATE TYPE "public"."backup_status" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "db_backups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "backup_kind" NOT NULL,
	"folder" text NOT NULL,
	"name" text,
	"file_name" text NOT NULL,
	"local_path" text NOT NULL,
	"r2_key" text NOT NULL,
	"size_bytes" bigint,
	"status" "backup_status" NOT NULL,
	"error" text,
	"attempts" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"uploaded_at" timestamp with time zone,
	"triggered_by_admin_user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "db_backups" ADD CONSTRAINT "db_backups_triggered_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("triggered_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "db_backups_r2_key_uq" ON "db_backups" USING btree ("r2_key");--> statement-breakpoint
CREATE INDEX "db_backups_started_idx" ON "db_backups" USING btree ("started_at");