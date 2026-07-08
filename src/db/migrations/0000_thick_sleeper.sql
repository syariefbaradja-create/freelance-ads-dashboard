CREATE TYPE "public"."objective" AS ENUM('awareness', 'traffic', 'engagement', 'leads', 'sales', 'meta_cpas');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('meta', 'tiktok', 'google');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- "auth"."users" is managed by Supabase Auth itself — never created/altered
-- here. It's only declared in schema.ts as a foreign key reference target.
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"objective" "objective" NOT NULL,
	"catalog_name" text,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"date" date NOT NULL,
	"spend" numeric(14, 2) NOT NULL,
	"impressions" numeric(14, 0),
	"reach" numeric(14, 0),
	"frequency" numeric(8, 4),
	"clicks" numeric(14, 0),
	"post_engagements" numeric(14, 0),
	"video_views" numeric(14, 0),
	"leads" numeric(14, 0),
	"conversions" numeric(14, 0),
	"purchases" numeric(14, 0),
	"revenue" numeric(14, 2),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "admins_select_own" ON "admins" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "admins"."id");--> statement-breakpoint
CREATE POLICY "campaigns_select_own_or_admin" ON "campaigns" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("campaigns"."client_id" = auth.uid() or exists (select 1 from "admins" where "admins"."id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "campaigns_admin_write" ON "campaigns" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "admins" where "admins"."id" = auth.uid())) WITH CHECK (exists (select 1 from "admins" where "admins"."id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "clients_select_self_or_admin" ON "clients" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "clients"."id" or exists (select 1 from "admins" where "admins"."id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "clients_admin_write" ON "clients" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "admins" where "admins"."id" = auth.uid())) WITH CHECK (exists (select 1 from "admins" where "admins"."id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "metrics_select_own_or_admin" ON "metrics" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        exists (select 1 from "admins" where "admins"."id" = auth.uid())
        or "metrics"."campaign_id" in (
          select "campaigns"."id" from "campaigns" where "campaigns"."client_id" = auth.uid()
        )
      );--> statement-breakpoint
CREATE POLICY "metrics_admin_write" ON "metrics" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "admins" where "admins"."id" = auth.uid())) WITH CHECK (exists (select 1 from "admins" where "admins"."id" = auth.uid()));