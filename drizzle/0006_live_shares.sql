CREATE TABLE "live_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"share_id" text NOT NULL,
	"manage_token_hash" text NOT NULL,
	"user_id" uuid,
	"trip_id" uuid,
	"title" text,
	"expires_at" timestamp with time zone NOT NULL,
	"stopped_at" timestamp with time zone,
	"lat" double precision,
	"lng" double precision,
	"accuracy_m" real,
	"heading_deg" real,
	"speed_ms" real,
	"position_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "live_shares" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "live_shares" ADD CONSTRAINT "live_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_shares" ADD CONSTRAINT "live_shares_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "live_shares_share_id_idx" ON "live_shares" USING btree ("share_id");--> statement-breakpoint
CREATE INDEX "live_shares_trip_idx" ON "live_shares" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "live_shares_expires_idx" ON "live_shares" USING btree ("expires_at");