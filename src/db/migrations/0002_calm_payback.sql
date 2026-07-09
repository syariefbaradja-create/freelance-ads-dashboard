CREATE TABLE "topups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "topups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "topups" ADD CONSTRAINT "topups_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topups" ADD CONSTRAINT "topups_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "topups_select_own_or_admin" ON "topups" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("topups"."client_id" = auth.uid() or exists (select 1 from "admins" where "admins"."id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "topups_admin_write" ON "topups" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "admins" where "admins"."id" = auth.uid())) WITH CHECK (exists (select 1 from "admins" where "admins"."id" = auth.uid()));