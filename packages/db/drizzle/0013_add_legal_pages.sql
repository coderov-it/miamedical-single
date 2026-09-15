-- The site's own policies (privacy notice today), one row per page.
--
-- No status column and no slug: `code` is the storefront route key, the URL per
-- language is fixed in apps/website/src/lib/routes.ts, and there is no state in
-- which the site legitimately serves no privacy notice. The rental/warranty
-- texts a PRODUCT links to stay where they are, in terms_documents.
--
-- The text columns are inline `{ it, en, fr, de }` jsonb rather than a
-- translations table, per the rule in packages/db/src/schema/i18n.ts: a
-- translations table is for text PostgreSQL indexes (full-text search, a
-- per-locale unique slug), and this is neither. A new language is a key.
CREATE TABLE "legal_pages" (
	"code" text PRIMARY KEY NOT NULL,
	"title" jsonb NOT NULL,
	"body" jsonb NOT NULL,
	"meta_title" jsonb,
	"meta_description" jsonb,
	"effective_at" timestamp with time zone,
	"updated_by_admin_user_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_pages_title_it_check" CHECK ("legal_pages"."title" ? 'it' AND length("legal_pages"."title"->>'it') > 0),
	CONSTRAINT "legal_pages_body_it_check" CHECK ("legal_pages"."body" ? 'it' AND length("legal_pages"."body"->>'it') > 0),
	CONSTRAINT "legal_pages_meta_title_it_check" CHECK ("legal_pages"."meta_title" IS NULL OR ("legal_pages"."meta_title" ? 'it' AND length("legal_pages"."meta_title"->>'it') > 0)),
	CONSTRAINT "legal_pages_meta_desc_it_check" CHECK ("legal_pages"."meta_description" IS NULL OR ("legal_pages"."meta_description" ? 'it' AND length("legal_pages"."meta_description"->>'it') > 0))
);
--> statement-breakpoint
ALTER TABLE "legal_pages" ADD CONSTRAINT "legal_pages_updated_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("updated_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;