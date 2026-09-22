CREATE TABLE "registration_risk_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"ip_address" text,
	"session_id" text,
	"event_type" text NOT NULL,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "colour" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "last_known_latitude" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "last_known_longitude" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paystack_transaction_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "receipt_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "risk_status" text DEFAULT 'CLEAR' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "risk_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "risk_signals" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "registration_ip" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "registration_session_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "shipping_events" ADD CONSTRAINT "shipping_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "registration_risk_email_idx" ON "registration_risk_events" USING btree ("email");--> statement-breakpoint
CREATE INDEX "registration_risk_ip_idx" ON "registration_risk_events" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "registration_risk_created_idx" ON "registration_risk_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "shipping_events_order_idx" ON "shipping_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "shipping_events_created_idx" ON "shipping_events" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "visitor_analytics" ADD CONSTRAINT "visitor_analytics_session_unique" UNIQUE("session_id");