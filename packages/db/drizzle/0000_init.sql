CREATE TYPE "public"."address_kind" AS ENUM('shipping', 'billing');--> statement-breakpoint
CREATE TYPE "public"."customer_auth_purpose" AS ENUM('activation', 'magic_link', 'password_reset', 'order_report');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('private', 'company', 'tourist');--> statement-breakpoint
CREATE TYPE "public"."delivery_zone_level" AS ENUM('country', 'region', 'province', 'comune', 'cap', 'frazione');--> statement-breakpoint
CREATE TYPE "public"."delivery_zone_value" AS ENUM('fee', 'call');--> statement-breakpoint
CREATE TYPE "public"."order_customer_link" AS ENUM('unverified', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."order_dispute_status" AS ENUM('open', 'contacted', 'resolved', 'confirmed_fraud');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'fulfilled', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."pricing_mode" AS ENUM('fixed', 'rental');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."question_value_type" AS ENUM('string', 'text', 'number', 'single_select', 'multi_select', 'boolean', 'date');--> statement-breakpoint
CREATE TYPE "public"."rental_unit" AS ENUM('hour', 'day');--> statement-breakpoint
CREATE TYPE "public"."terms_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."value_type" AS ENUM('string', 'number', 'single_select', 'multi_select', 'boolean', 'number_range');--> statement-breakpoint
CREATE TYPE "public"."language_code" AS ENUM('it', 'en');--> statement-breakpoint
CREATE SEQUENCE "public"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1;--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"full_name" text,
	"phone" text,
	"is_superuser" boolean DEFAULT false NOT NULL,
	"permissions" integer[] DEFAULT '{}' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_account_id" uuid NOT NULL,
	"kind" "address_kind" NOT NULL,
	"full_name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"region" text,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"phone" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"activated_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_account_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"icon" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "product_terms" (
	"product_id" uuid NOT NULL,
	"terms_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_terms_product_id_terms_id_pk" PRIMARY KEY("product_id","terms_id")
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
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_sku" text NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"category_id" uuid NOT NULL,
	"brand" text,
	"pricing_mode" "pricing_mode" NOT NULL,
	"base_price" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"rental_unit" "rental_unit",
	"rental_packages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"chips" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"media" jsonb DEFAULT '{"thumbnail":null,"cleanPng":null,"gallery":[],"videos":[],"documents":[]}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_id_pricing_mode_key" UNIQUE("id","pricing_mode"),
	CONSTRAINT "products_rental_unit_check" CHECK (("products"."pricing_mode" = 'rental') = ("products"."rental_unit" IS NOT NULL)),
	CONSTRAINT "products_rental_packages_check" CHECK ("products"."pricing_mode" = 'rental' OR "products"."rental_packages" = '[]'::jsonb)
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"sku_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_account_id" uuid,
	"token" text NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_account_id" uuid,
	"reported_phone" text NOT NULL,
	"message" text NOT NULL,
	"status" "order_dispute_status" DEFAULT 'open' NOT NULL,
	"admin_notes" text,
	"resolved_by_admin_user_id" uuid,
	"resolved_at" timestamp with time zone,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"sku_id" uuid,
	"product_title" text NOT NULL,
	"sku_label" text NOT NULL,
	"sku" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"configuration" jsonb
);
--> statement-breakpoint
CREATE TABLE "order_status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"field" text NOT NULL,
	"from_value" text,
	"to_value" text NOT NULL,
	"note" text,
	"actor_admin_user_id" uuid,
	"actor_customer_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"customer_account_id" uuid,
	"customer_link_status" "order_customer_link" DEFAULT 'unverified' NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"customer_type" "customer_type",
	"codice_fiscale" text,
	"partita_iva" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"shipping_total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"tax_total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"discount_total" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"shipping_address" jsonb,
	"billing_address" jsonb,
	"delivery" jsonb,
	"notes" text,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_customer_link_check" CHECK ("orders"."customer_link_status" <> 'rejected' OR "orders"."customer_account_id" IS NULL),
	CONSTRAINT "orders_delivery_check" CHECK ("orders"."delivery" IS NULL OR "orders"."delivery" ? 'method'),
	CONSTRAINT "orders_fiscal_check" CHECK (("orders"."customer_type" <> 'private' OR "orders"."codice_fiscale" IS NOT NULL)
        AND ("orders"."customer_type" <> 'company' OR ("orders"."partita_iva" IS NOT NULL AND "orders"."codice_fiscale" IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "customer_auth_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_account_id" uuid NOT NULL,
	"purpose" "customer_auth_purpose" NOT NULL,
	"order_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by_admin_user_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"parent_level" "delivery_zone_level",
	"level" "delivery_zone_level" NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"value_kind" "delivery_zone_value",
	"fee" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_zones_id_level_key" UNIQUE("id","level"),
	CONSTRAINT "delivery_zones_root_is_country_check" CHECK (("delivery_zones"."parent_id" IS NULL) = ("delivery_zones"."parent_level" IS NULL)
        AND ("delivery_zones"."parent_id" IS NULL) = ("delivery_zones"."level" = 'country')),
	CONSTRAINT "delivery_zones_nesting_check" CHECK ("delivery_zones"."parent_level" IS NULL OR ("delivery_zones"."parent_level", "delivery_zones"."level") IN (
        ('country', 'region'),
        ('region', 'province'),
        ('province', 'comune'),
        ('comune', 'cap'),
        ('comune', 'frazione'),
        ('cap', 'frazione')
      )),
	CONSTRAINT "delivery_zones_value_check" CHECK (("delivery_zones"."value_kind" IS NOT DISTINCT FROM 'fee') = ("delivery_zones"."fee" IS NOT NULL)),
	CONSTRAINT "delivery_zones_fee_sign_check" CHECK ("delivery_zones"."fee" IS NULL OR "delivery_zones"."fee" >= 0)
);
--> statement-breakpoint
CREATE TABLE "istat_comune_caps" (
	"istat_code" char(6) NOT NULL,
	"cap" char(5) NOT NULL,
	CONSTRAINT "istat_comune_caps_istat_code_cap_pk" PRIMARY KEY("istat_code","cap")
);
--> statement-breakpoint
CREATE TABLE "istat_comuni" (
	"istat_code" char(6) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_normalised" text NOT NULL,
	"province_code" char(2) NOT NULL,
	"region_code" char(2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "istat_provinces" (
	"province_code" char(2) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region_code" char(2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "istat_regions" (
	"region_code" char(2) PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zone_resolution_misses" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"cap" char(5),
	"provider_name" text,
	"province_code" char(2),
	"resolved_via" text,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_document_translations" ADD CONSTRAINT "terms_document_translations_terms_id_terms_documents_id_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "product_spec_value_options" ADD CONSTRAINT "product_spec_value_options_option_fk" FOREIGN KEY ("option_id") REFERENCES "public"."category_spec_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_values" ADD CONSTRAINT "product_spec_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_values" ADD CONSTRAINT "product_spec_values_spec_id_category_specs_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."category_specs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_terms" ADD CONSTRAINT "product_terms_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_terms" ADD CONSTRAINT "product_terms_terms_id_terms_documents_id_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_groups" ADD CONSTRAINT "product_variant_groups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_options" ADD CONSTRAINT "product_variant_options_group_id_product_variant_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_variant_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_sku_id_product_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_skus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_disputes" ADD CONSTRAINT "order_disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_disputes" ADD CONSTRAINT "order_disputes_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_disputes" ADD CONSTRAINT "order_disputes_resolved_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("resolved_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sku_id_product_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_skus"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_actor_admin_user_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_actor_customer_fk" FOREIGN KEY ("actor_customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_auth_tokens" ADD CONSTRAINT "customer_auth_tokens_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_auth_tokens" ADD CONSTRAINT "customer_auth_tokens_account_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("updated_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_parent_fk" FOREIGN KEY ("parent_id","parent_level") REFERENCES "public"."delivery_zones"("id","level") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "istat_comune_caps" ADD CONSTRAINT "istat_comune_caps_istat_code_istat_comuni_istat_code_fk" FOREIGN KEY ("istat_code") REFERENCES "public"."istat_comuni"("istat_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "istat_provinces" ADD CONSTRAINT "istat_provinces_region_code_istat_regions_region_code_fk" FOREIGN KEY ("region_code") REFERENCES "public"."istat_regions"("region_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_user_idx" ON "admin_sessions" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_users_superuser_idx" ON "admin_users" USING btree ("is_superuser");--> statement-breakpoint
CREATE INDEX "addresses_customer_account_idx" ON "addresses" USING btree ("customer_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_accounts_email_key" ON "customer_accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customer_accounts_phone_idx" ON "customer_accounts" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customer_accounts_created_at_idx" ON "customer_accounts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "customer_sessions_account_idx" ON "customer_sessions" USING btree ("customer_account_id");--> statement-breakpoint
CREATE INDEX "customer_sessions_expires_at_idx" ON "customer_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "terms_document_translations_lang_slug_key" ON "terms_document_translations" USING btree ("language_code","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "terms_documents_code_key" ON "terms_documents" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "attribute_preset_options_preset_value_key" ON "attribute_preset_options" USING btree ("preset_id","value");--> statement-breakpoint
CREATE UNIQUE INDEX "attribute_presets_key_key" ON "attribute_presets" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_code_key" ON "categories" USING btree ("code");--> statement-breakpoint
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
CREATE INDEX "product_terms_terms_idx" ON "product_terms" USING btree ("terms_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_translations_lang_slug_key" ON "product_translations" USING btree ("language_code","slug");--> statement-breakpoint
CREATE INDEX "product_translations_search_idx" ON "product_translations" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_groups_product_key_key" ON "product_variant_groups" USING btree ("product_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_options_group_value_key" ON "product_variant_options" USING btree ("group_id","value");--> statement-breakpoint
CREATE UNIQUE INDEX "products_base_sku_key" ON "products" USING btree ("base_sku");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_sku_key" ON "cart_items" USING btree ("cart_id","sku_id");--> statement-breakpoint
CREATE INDEX "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_token_key" ON "carts" USING btree ("token");--> statement-breakpoint
CREATE INDEX "carts_customer_account_idx" ON "carts" USING btree ("customer_account_id");--> statement-breakpoint
CREATE INDEX "order_disputes_order_idx" ON "order_disputes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_disputes_status_idx" ON "order_disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_disputes_created_idx" ON "order_disputes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_events_order_idx" ON "order_status_events" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_key" ON "orders" USING btree ("number");--> statement-breakpoint
CREATE INDEX "orders_customer_account_idx" ON "orders" USING btree ("customer_account_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_placed_at_idx" ON "orders" USING btree ("placed_at");--> statement-breakpoint
CREATE INDEX "customer_auth_tokens_account_idx" ON "customer_auth_tokens" USING btree ("customer_account_id");--> statement-breakpoint
CREATE INDEX "customer_auth_tokens_expires_idx" ON "customer_auth_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_zones_sibling_key" ON "delivery_zones" USING btree ("parent_id","level","code");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_zones_root_key" ON "delivery_zones" USING btree ("level") WHERE "delivery_zones"."parent_id" IS NULL;--> statement-breakpoint
CREATE INDEX "delivery_zones_parent_idx" ON "delivery_zones" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "delivery_zones_level_code_idx" ON "delivery_zones" USING btree ("level","code");--> statement-breakpoint
CREATE INDEX "istat_comune_caps_cap_idx" ON "istat_comune_caps" USING btree ("cap");--> statement-breakpoint
CREATE INDEX "istat_comuni_name_normalised_idx" ON "istat_comuni" USING btree ("name_normalised");--> statement-breakpoint
CREATE INDEX "istat_comuni_province_idx" ON "istat_comuni" USING btree ("province_code");--> statement-breakpoint
CREATE INDEX "istat_provinces_region_idx" ON "istat_provinces" USING btree ("region_code");--> statement-breakpoint
CREATE INDEX "zone_resolution_misses_seen_at_idx" ON "zone_resolution_misses" USING btree ("seen_at");