CREATE TABLE "weekly_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"leads_reception" integer DEFAULT 0 NOT NULL,
	"leads_lifts" integer DEFAULT 0 NOT NULL,
	"leads_avito" integer DEFAULT 0 NOT NULL,
	"leads_referral" integer DEFAULT 0 NOT NULL,
	"leads_base" integer DEFAULT 0 NOT NULL,
	"leads_chat" integer DEFAULT 0 NOT NULL,
	"trials" integer DEFAULT 0 NOT NULL,
	"new_regulars" integer DEFAULT 0 NOT NULL,
	"load_percent" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_stats" ADD CONSTRAINT "weekly_stats_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_stats_trainer_week_uniq" ON "weekly_stats" USING btree ("trainer_id","week_start");