CREATE TYPE "public"."blog_post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'generated', 'sent', 'viewed', 'signed', 'voided');--> statement-breakpoint
CREATE TYPE "public"."contract_variant" AS ENUM('carrozzina_italian', 'carrozzina_tourist', 'scooter_italian', 'scooter_tourist');--> statement-breakpoint
CREATE SEQUENCE "public"."contract_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1;--> statement-breakpoint
CREATE TABLE "contract_signing_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"order_id" uuid NOT NULL,
	"variant" "contract_variant" NOT NULL,
	"status" "contract_status" DEFAULT 'generated' NOT NULL,
	"language" text NOT NULL,
	"requires_deposit" boolean NOT NULL,
	"deposit_amount" numeric(12, 2),
	"contract_data" jsonb NOT NULL,
	"signed_at" timestamp with time zone,
	"signature_data" jsonb,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"voided_by_admin_user_id" uuid,
	"void_reason" text,
	"pdf_storage_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contracts_signed_check" CHECK ("contracts"."status" <> 'signed' OR "contracts"."signed_at" IS NOT NULL),
	CONSTRAINT "contracts_voided_check" CHECK ("contracts"."status" <> 'voided' OR "contracts"."voided_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" jsonb NOT NULL,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_categories_name_it_check" CHECK ("blog_categories"."name" ? 'it' AND length("blog_categories"."name"->>'it') > 0)
);
--> statement-breakpoint
CREATE TABLE "blog_post_categories" (
	"post_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "blog_post_categories_post_id_category_id_pk" PRIMARY KEY("post_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "blog_post_translations" (
	"post_id" uuid NOT NULL,
	"language_code" "language_code" NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"body" text NOT NULL,
	"excerpt" text,
	"meta_title" text,
	"meta_description" text,
	CONSTRAINT "blog_post_translations_post_id_language_code_pk" PRIMARY KEY("post_id","language_code")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "blog_post_status" DEFAULT 'draft' NOT NULL,
	"featured_image" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contract_signing_tokens" ADD CONSTRAINT "contract_signing_tokens_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_voided_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("voided_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_categories" ADD CONSTRAINT "blog_post_categories_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_categories" ADD CONSTRAINT "blog_post_categories_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_translations" ADD CONSTRAINT "blog_post_translations_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contract_sign_tokens_contract_idx" ON "contract_signing_tokens" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contract_sign_tokens_expires_idx" ON "contract_signing_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_number_key" ON "contracts" USING btree ("number");--> statement-breakpoint
CREATE INDEX "contracts_order_idx" ON "contracts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "contracts_status_idx" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contracts_created_at_idx" ON "contracts" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_categories_code_key" ON "blog_categories" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_post_categories_cat_idx" ON "blog_post_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_post_trans_lang_slug_key" ON "blog_post_translations" USING btree ("language_code","slug");--> statement-breakpoint
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts" USING btree ("published_at");