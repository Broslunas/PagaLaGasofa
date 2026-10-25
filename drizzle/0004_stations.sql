CREATE TABLE "favorite_stations" (
	"user_id" uuid NOT NULL,
	"station_id" text NOT NULL,
	"fuel_type" "fuel_type" DEFAULT 'gasolina95' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_stations_user_id_station_id_pk" PRIMARY KEY("user_id","station_id")
);
--> statement-breakpoint
ALTER TABLE "favorite_stations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "station_price_history" (
	"station_id" text NOT NULL,
	"day" date NOT NULL,
	"price_gasolina95" numeric(5, 3),
	"price_gasolina98" numeric(5, 3),
	"price_diesel" numeric(5, 3),
	"price_diesel_premium" numeric(5, 3),
	"price_glp" numeric(5, 3),
	CONSTRAINT "station_price_history_station_id_day_pk" PRIMARY KEY("station_id","day")
);
--> statement-breakpoint
ALTER TABLE "station_price_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"brand" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"locality" text DEFAULT '' NOT NULL,
	"municipality" text DEFAULT '' NOT NULL,
	"province" text DEFAULT '' NOT NULL,
	"postal_code" text DEFAULT '' NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"schedule" text DEFAULT '' NOT NULL,
	"public_sale" boolean DEFAULT true NOT NULL,
	"price_gasolina95" numeric(5, 3),
	"price_gasolina98" numeric(5, 3),
	"price_diesel" numeric(5, 3),
	"price_diesel_premium" numeric(5, 3),
	"price_glp" numeric(5, 3),
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "favorite_stations" ADD CONSTRAINT "favorite_stations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_stations" ADD CONSTRAINT "favorite_stations_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_price_history" ADD CONSTRAINT "station_price_history_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "station_price_history_day_idx" ON "station_price_history" USING btree ("day");--> statement-breakpoint
CREATE INDEX "stations_lat_lng_idx" ON "stations" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "stations_brand_idx" ON "stations" USING btree ("brand");--> statement-breakpoint
CREATE POLICY "favorite_stations_all_own" ON "favorite_stations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "favorite_stations"."user_id") WITH CHECK ((select auth.uid()) = "favorite_stations"."user_id");--> statement-breakpoint
CREATE POLICY "station_price_history_public_read" ON "station_price_history" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "stations_public_read" ON "stations" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);