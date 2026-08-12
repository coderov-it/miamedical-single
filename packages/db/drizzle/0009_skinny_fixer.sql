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
ALTER TABLE "istat_provinces" ADD CONSTRAINT "istat_provinces_region_code_istat_regions_region_code_fk" FOREIGN KEY ("region_code") REFERENCES "public"."istat_regions"("region_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "istat_provinces_region_idx" ON "istat_provinces" USING btree ("region_code");