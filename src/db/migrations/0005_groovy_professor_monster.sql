ALTER TABLE "admins" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_username_unique" UNIQUE("username");