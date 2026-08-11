CREATE TYPE "public"."delivery_zone_level" AS ENUM('country', 'region', 'province', 'comune', 'cap', 'frazione');--> statement-breakpoint
CREATE TYPE "public"."delivery_zone_value" AS ENUM('fee', 'call');--> statement-breakpoint
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
CREATE TABLE "zone_resolution_misses" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"cap" char(5),
	"provider_name" text,
	"province_code" char(2),
	"resolved_via" text,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_parent_fk" FOREIGN KEY ("parent_id","parent_level") REFERENCES "public"."delivery_zones"("id","level") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "istat_comune_caps" ADD CONSTRAINT "istat_comune_caps_istat_code_istat_comuni_istat_code_fk" FOREIGN KEY ("istat_code") REFERENCES "public"."istat_comuni"("istat_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_zones_sibling_key" ON "delivery_zones" USING btree ("parent_id","level","code");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_zones_root_key" ON "delivery_zones" USING btree ("level") WHERE "delivery_zones"."parent_id" IS NULL;--> statement-breakpoint
CREATE INDEX "delivery_zones_parent_idx" ON "delivery_zones" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "delivery_zones_level_code_idx" ON "delivery_zones" USING btree ("level","code");--> statement-breakpoint
CREATE INDEX "istat_comune_caps_cap_idx" ON "istat_comune_caps" USING btree ("cap");--> statement-breakpoint
CREATE INDEX "istat_comuni_name_normalised_idx" ON "istat_comuni" USING btree ("name_normalised");--> statement-breakpoint
CREATE INDEX "istat_comuni_province_idx" ON "istat_comuni" USING btree ("province_code");--> statement-breakpoint
CREATE INDEX "zone_resolution_misses_seen_at_idx" ON "zone_resolution_misses" USING btree ("seen_at");