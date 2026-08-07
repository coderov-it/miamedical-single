CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."pricing_mode" AS ENUM('fixed', 'rental');--> statement-breakpoint
CREATE TYPE "public"."question_value_type" AS ENUM('string', 'text', 'number', 'single_select', 'multi_select', 'boolean', 'date');--> statement-breakpoint
CREATE TYPE "public"."rental_unit" AS ENUM('hour', 'day');--> statement-breakpoint
CREATE TYPE "public"."terms_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."value_type" AS ENUM('string', 'number', 'single_select', 'multi_select', 'boolean', 'number_range');--> statement-breakpoint
CREATE TYPE "public"."language_code" AS ENUM('it', 'en');--> statement-breakpoint
CREATE TABLE "attribute_preset_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"preset_id" uuid NOT NULL,
	"value" text NOT NULL,
	"label" jsonb NOT NULL,
	"sku_code" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attribute_preset_options_label_it_check" CHECK ("attribute_preset_options"."label" ? 'it' AND length("attribute_preset_options"."label"->>'it') > 0)
);
--> statement-breakpoint
CREATE TABLE "attribute_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" jsonb NOT NULL,
	"value_type" "value_type" NOT NULL,
	"unit" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"icon" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attribute_presets_label_it_check" CHECK ("attribute_presets"."label" ? 'it' AND length("attribute_presets"."label"->>'it') > 0)
);
--> statement-breakpoint
CREATE TABLE "category_spec_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spec_id" uuid NOT NULL,
	"value" text NOT NULL,
	"label" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_spec_options_label_it_check" CHECK ("category_spec_options"."label" ? 'it' AND length("category_spec_options"."label"->>'it') > 0)
);
--> statement-breakpoint
CREATE TABLE "category_specs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" jsonb NOT NULL,
	"help_text" jsonb,
	"value_type" "value_type" NOT NULL,
	"unit" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_filterable" boolean DEFAULT false NOT NULL,
	"is_comparable" boolean DEFAULT false NOT NULL,
	"icon" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_specs_label_it_check" CHECK ("category_specs"."label" ? 'it' AND length("category_specs"."label"->>'it') > 0),
	CONSTRAINT "category_specs_help_text_it_check" CHECK ("category_specs"."help_text" IS NULL OR ("category_specs"."help_text" ? 'it' AND length("category_specs"."help_text"->>'it') > 0))
);
--> statement-breakpoint
CREATE TABLE "category_translations" (
	"category_id" uuid NOT NULL,
	"language_code" "language_code" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"search_vector" "tsvector",
	CONSTRAINT "category_translations_category_id_language_code_pk" PRIMARY KEY("category_id","language_code")
);
--> statement-breakpoint
CREATE TABLE "product_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"sku" text,
	"pricing_mode" "pricing_mode" NOT NULL,
	"product_pricing_mode" "pricing_mode" NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"rental_unit" "rental_unit",
	"min_quantity" integer DEFAULT 0 NOT NULL,
	"max_quantity" integer,
	"is_required" boolean DEFAULT false NOT NULL,
	"icon" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_addons_name_it_check" CHECK ("product_addons"."name" ? 'it' AND length("product_addons"."name"->>'it') > 0),
	CONSTRAINT "product_addons_description_it_check" CHECK ("product_addons"."description" IS NULL OR ("product_addons"."description" ? 'it' AND length("product_addons"."description"->>'it') > 0)),
	CONSTRAINT "product_addons_mode_check" CHECK ("product_addons"."product_pricing_mode" = 'rental' OR "product_addons"."pricing_mode" = 'fixed'),
	CONSTRAINT "product_addons_rental_unit_check" CHECK (("product_addons"."pricing_mode" = 'rental') = ("product_addons"."rental_unit" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "product_faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"question" jsonb NOT NULL,
	"answer" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_faqs_question_it_check" CHECK ("product_faqs"."question" ? 'it' AND length("product_faqs"."question"->>'it') > 0),
	CONSTRAINT "product_faqs_answer_it_check" CHECK ("product_faqs"."answer" ? 'it' AND length("product_faqs"."answer"->>'it') > 0)
);
--> statement-breakpoint
CREATE TABLE "product_question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"value" text NOT NULL,
	"label" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_question_options_label_it_check" CHECK ("product_question_options"."label" ? 'it' AND length("product_question_options"."label"->>'it') > 0)
);
--> statement-breakpoint
CREATE TABLE "product_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"key" text NOT NULL,
	"prompt" jsonb NOT NULL,
	"help_text" jsonb,
	"question_value_type" "question_value_type" NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"min_value" numeric(14, 4),
	"max_value" numeric(14, 4),
	"max_length" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_questions_prompt_it_check" CHECK ("product_questions"."prompt" ? 'it' AND length("product_questions"."prompt"->>'it') > 0),
	CONSTRAINT "product_questions_help_text_it_check" CHECK ("product_questions"."help_text" IS NULL OR ("product_questions"."help_text" ? 'it' AND length("product_questions"."help_text"->>'it') > 0))
);
--> statement-breakpoint
CREATE TABLE "product_sku_options" (
	"sku_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	CONSTRAINT "product_sku_options_sku_id_option_id_pk" PRIMARY KEY("sku_id","option_id")
);
--> statement-breakpoint
CREATE TABLE "product_skus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"suffix" text NOT NULL,
	"combo_key" text NOT NULL,
	"price_override" numeric(12, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_spec_value_options" (
	"product_id" uuid NOT NULL,
	"spec_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	CONSTRAINT "product_spec_value_options_product_id_spec_id_option_id_pk" PRIMARY KEY("product_id","spec_id","option_id")
);
--> statement-breakpoint
CREATE TABLE "product_spec_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"spec_id" uuid NOT NULL,
	"number_value" numeric(14, 4),
	"number_min" numeric(14, 4),
	"number_max" numeric(14, 4),
	"boolean_value" boolean,
	"text_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_spec_values_text_value_it_check" CHECK ("product_spec_values"."text_value" IS NULL OR ("product_spec_values"."text_value" ? 'it' AND length("product_spec_values"."text_value"->>'it') > 0))
);
--> statement-breakpoint
CREATE TABLE "product_translations" (
	"product_id" uuid NOT NULL,
	"language_code" "language_code" NOT NULL,
	"title" text NOT NULL,
	"short_description" text,
	"description" text,
	"slug" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"search_vector" "tsvector",
	CONSTRAINT "product_translations_product_id_language_code_pk" PRIMARY KEY("product_id","language_code")
);
--> statement-breakpoint
CREATE TABLE "product_variant_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" jsonb NOT NULL,
	"help_text" jsonb,
	"value_type" "value_type" NOT NULL,
	"unit" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"affects_sku" boolean DEFAULT false NOT NULL,
	"source_preset_key" text,
	"min_value" numeric(14, 4),
	"max_value" numeric(14, 4),
	"step_value" numeric(14, 4),
	"price_modifier_per_unit" numeric(12, 2),
	"icon" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variant_groups_label_it_check" CHECK ("product_variant_groups"."label" ? 'it' AND length("product_variant_groups"."label"->>'it') > 0),
	CONSTRAINT "product_variant_groups_help_text_it_check" CHECK ("product_variant_groups"."help_text" IS NULL OR ("product_variant_groups"."help_text" ? 'it' AND length("product_variant_groups"."help_text"->>'it') > 0)),
	CONSTRAINT "product_variant_groups_affects_sku_check" CHECK ("product_variant_groups"."affects_sku" = false OR "product_variant_groups"."value_type" IN ('single_select', 'boolean'))
);
--> statement-breakpoint
CREATE TABLE "product_variant_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"value" text NOT NULL,
	"label" jsonb NOT NULL,
	"sku_code" text,
	"price_modifier" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variant_options_label_it_check" CHECK ("product_variant_options"."label" ? 'it' AND length("product_variant_options"."label"->>'it') > 0)
);
--> statement-breakpoint
CREATE TABLE "product_terms" (
	"product_id" uuid NOT NULL,
	"terms_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_terms_product_id_terms_id_pk" PRIMARY KEY("product_id","terms_id")
);
--> statement-breakpoint
CREATE TABLE "terms_document_translations" (
	"terms_id" uuid NOT NULL,
	"language_code" "language_code" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "terms_document_translations_terms_id_language_code_pk" PRIMARY KEY("terms_id","language_code")
);
--> statement-breakpoint
CREATE TABLE "terms_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"status" "terms_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_images" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_variants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product_categories" CASCADE;--> statement-breakpoint
DROP TABLE "product_images" CASCADE;--> statement-breakpoint
DROP TABLE "product_variants" CASCADE;--> statement-breakpoint
-- Demo-scaffold rows cannot be expressed in the new model (products gain
-- NOT NULL base_sku / category_id / pricing_mode with no defaults). Purge
-- before the ALTERs below, or they fail on any seeded database.
TRUNCATE "cart_items", "carts", "order_items", "orders" CASCADE;--> statement-breakpoint
DELETE FROM "products";--> statement-breakpoint
DELETE FROM "categories";--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_variant_id_product_variants_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_variant_id_product_variants_id_fk";
--> statement-breakpoint
DROP INDEX "categories_slug_key";--> statement-breakpoint
DROP INDEX "categories_parent_idx";--> statement-breakpoint
DROP INDEX "products_slug_key";--> statement-breakpoint
DROP INDEX "cart_items_cart_variant_key";--> statement-breakpoint
ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'EUR';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'EUR';--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "base_sku" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "pricing_mode" "pricing_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "base_price" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "currency" text DEFAULT 'EUR' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rental_unit" "rental_unit";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "media" jsonb DEFAULT '{"thumbnail":null,"cleanPng":null,"gallery":[],"videos":[],"documents":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "sku_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "unit_price" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "sku_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "sku_label" text NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "unit_price" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "total" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_total" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_total" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_total" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "attribute_preset_options" ADD CONSTRAINT "attribute_preset_options_preset_id_attribute_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."attribute_presets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_spec_options" ADD CONSTRAINT "category_spec_options_spec_id_category_specs_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."category_specs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_specs" ADD CONSTRAINT "category_specs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_product_mode_fk" FOREIGN KEY ("product_id","product_pricing_mode") REFERENCES "public"."products"("id","pricing_mode") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_faqs" ADD CONSTRAINT "product_faqs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_question_options" ADD CONSTRAINT "product_question_options_question_id_product_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."product_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sku_options" ADD CONSTRAINT "product_sku_options_sku_id_product_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_skus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sku_options" ADD CONSTRAINT "product_sku_options_option_id_product_variant_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_variant_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sku_options" ADD CONSTRAINT "product_sku_options_group_id_product_variant_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_variant_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_value_options" ADD CONSTRAINT "product_spec_value_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_value_options" ADD CONSTRAINT "product_spec_value_options_spec_id_category_specs_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."category_specs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_value_options" ADD CONSTRAINT "product_spec_value_options_option_id_category_spec_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."category_spec_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_values" ADD CONSTRAINT "product_spec_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_values" ADD CONSTRAINT "product_spec_values_spec_id_category_specs_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."category_specs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_groups" ADD CONSTRAINT "product_variant_groups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_options" ADD CONSTRAINT "product_variant_options_group_id_product_variant_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_variant_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_terms" ADD CONSTRAINT "product_terms_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_terms" ADD CONSTRAINT "product_terms_terms_id_terms_documents_id_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_document_translations" ADD CONSTRAINT "terms_document_translations_terms_id_terms_documents_id_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attribute_preset_options_preset_value_key" ON "attribute_preset_options" USING btree ("preset_id","value");--> statement-breakpoint
CREATE UNIQUE INDEX "attribute_presets_key_key" ON "attribute_presets" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "category_spec_options_spec_value_key" ON "category_spec_options" USING btree ("spec_id","value");--> statement-breakpoint
CREATE UNIQUE INDEX "category_specs_category_key_key" ON "category_specs" USING btree ("category_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "category_translations_lang_slug_key" ON "category_translations" USING btree ("language_code","slug");--> statement-breakpoint
CREATE INDEX "category_translations_search_idx" ON "category_translations" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "product_addons_product_idx" ON "product_addons" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_faqs_product_idx" ON "product_faqs" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_question_options_question_value_key" ON "product_question_options" USING btree ("question_id","value");--> statement-breakpoint
CREATE UNIQUE INDEX "product_questions_product_key_key" ON "product_questions" USING btree ("product_id","key");--> statement-breakpoint
CREATE INDEX "product_sku_options_option_idx" ON "product_sku_options" USING btree ("option_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_skus_sku_key" ON "product_skus" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "product_skus_product_combo_key" ON "product_skus" USING btree ("product_id","combo_key");--> statement-breakpoint
CREATE INDEX "product_skus_product_idx" ON "product_skus" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_spec_value_options_option_idx" ON "product_spec_value_options" USING btree ("option_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_spec_values_product_spec_key" ON "product_spec_values" USING btree ("product_id","spec_id");--> statement-breakpoint
CREATE INDEX "product_spec_values_spec_number_idx" ON "product_spec_values" USING btree ("spec_id","number_value");--> statement-breakpoint
CREATE INDEX "product_spec_values_spec_boolean_idx" ON "product_spec_values" USING btree ("spec_id","boolean_value");--> statement-breakpoint
CREATE UNIQUE INDEX "product_translations_lang_slug_key" ON "product_translations" USING btree ("language_code","slug");--> statement-breakpoint
CREATE INDEX "product_translations_search_idx" ON "product_translations" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_groups_product_key_key" ON "product_variant_groups" USING btree ("product_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_options_group_value_key" ON "product_variant_options" USING btree ("group_id","value");--> statement-breakpoint
CREATE INDEX "product_terms_terms_idx" ON "product_terms" USING btree ("terms_id");--> statement-breakpoint
CREATE UNIQUE INDEX "terms_document_translations_lang_slug_key" ON "terms_document_translations" USING btree ("language_code","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "terms_documents_code_key" ON "terms_documents" USING btree ("code");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_sku_id_product_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_skus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sku_id_product_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_skus"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_code_key" ON "categories" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "products_base_sku_key" ON "products" USING btree ("base_sku");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_sku_key" ON "cart_items" USING btree ("cart_id","sku_id");--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN "variant_id";--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN "unit_price_cents";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "variant_id";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "product_name";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "variant_name";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "unit_price_cents";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "total_cents";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "subtotal_cents";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping_cents";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "tax_cents";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "discount_cents";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "total_cents";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_id_pricing_mode_key" UNIQUE("id","pricing_mode");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_rental_unit_check" CHECK (("products"."pricing_mode" = 'rental') = ("products"."rental_unit" IS NOT NULL));--> statement-breakpoint
-- Hand-added: drizzle-kit cannot express operator-class indexes. Trigram on
-- title powers the admin's substring type-to-find; full-text handles the rest.
CREATE INDEX "product_translations_title_trgm_idx" ON "product_translations" USING gin ("title" gin_trgm_ops);