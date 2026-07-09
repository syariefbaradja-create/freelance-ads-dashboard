CREATE TYPE "public"."budget_category" AS ENUM('meta', 'meta_cpas', 'tiktok', 'google');--> statement-breakpoint
ALTER TABLE "topups" ADD COLUMN "platform_category" "budget_category";