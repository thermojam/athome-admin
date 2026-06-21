CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact" text,
	"profile" text,
	"status" text NOT NULL,
	"source" text,
	"personal_fact" text,
	"goal" text,
	"sessions_per_week" integer,
	"last_session_date" date,
	"september_booking" boolean DEFAULT false,
	"note" text,
	"lead_payload" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clients_trainer_idx" ON "clients" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "clients_status_idx" ON "clients" USING btree ("trainer_id","status");--> statement-breakpoint
CREATE INDEX "clients_name_idx" ON "clients" USING btree ("trainer_id","name");