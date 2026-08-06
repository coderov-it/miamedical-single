ALTER TYPE "public"."user_role" ADD VALUE 'super_admin';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permissions" integer[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;