CREATE TYPE "public"."split_mode" AS ENUM('legs', 'equal', 'percent', 'manual');--> statement-breakpoint
CREATE TABLE "car_models" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "car_models_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"make" text NOT NULL,
	"model" text NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"consumption_per_100km" numeric(5, 2) NOT NULL,
	"co2_g_km" integer,
	"registrations" integer DEFAULT 0 NOT NULL,
	"data_year" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "car_models" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_passengers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"name" text NOT NULL,
	"pickup_stop" smallint NOT NULL,
	"dropoff_stop" smallint NOT NULL,
	"split_value" numeric(10, 2),
	"amount_cents" integer NOT NULL,
	"has_paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "trip_passengers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"share_id" text NOT NULL,
	"manage_token_hash" text NOT NULL,
	"user_id" uuid,
	"title" text,
	"stops" jsonb NOT NULL,
	"legs_km" jsonb NOT NULL,
	"geometry" jsonb NOT NULL,
	"distance_km" numeric(8, 2) NOT NULL,
	"is_round_trip" boolean DEFAULT false NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"consumption_per_100km" numeric(5, 2) NOT NULL,
	"price_per_unit" numeric(6, 3) NOT NULL,
	"tolls_cents" integer DEFAULT 0 NOT NULL,
	"extras" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"driver_pays" boolean DEFAULT true NOT NULL,
	"split_mode" "split_mode" DEFAULT 'legs' NOT NULL,
	"energy_units" numeric(8, 2) NOT NULL,
	"co2_kg" numeric(8, 2) NOT NULL,
	"energy_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "trip_passengers" ADD CONSTRAINT "trip_passengers_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "car_models_make_model_fuel_idx" ON "car_models" USING btree ("make","model","fuel_type");--> statement-breakpoint
CREATE INDEX "car_models_popularity_idx" ON "car_models" USING btree ("registrations");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_passengers_trip_position_idx" ON "trip_passengers" USING btree ("trip_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "trips_share_id_idx" ON "trips" USING btree ("share_id");--> statement-breakpoint
CREATE INDEX "trips_user_created_idx" ON "trips" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE POLICY "car_models_public_read" ON "car_models" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "trip_passengers_select_own" ON "trip_passengers" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from "trips" where "trips"."id" = "trip_passengers"."trip_id" and "trips"."user_id" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "trips_select_own" ON "trips" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "trips"."user_id");
--> statement-breakpoint
CREATE TRIGGER trips_set_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
