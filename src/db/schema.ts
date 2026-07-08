import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  numeric,
  pgEnum,
  pgPolicy,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Supabase manages this table (auth.users). We only declare it here so
 * Drizzle can reference it as a foreign key target — never migrate it.
 */
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const platformEnum = pgEnum("platform", ["meta", "tiktok", "google"]);

export const objectiveEnum = pgEnum("objective", [
  "awareness",
  "traffic",
  "engagement",
  "leads",
  "sales",
  "meta_cpas",
]);

export const admins = pgTable(
  "admins",
  {
    // Same id as the Supabase Auth user (auth.users.id).
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    pgPolicy("admins_select_own", {
      for: "select",
      to: "authenticated",
      using: sql`auth.uid() = ${table.id}`,
    }),
  ]
).enableRLS();

export const clients = pgTable(
  "clients",
  {
    // Same id as the Supabase Auth user (auth.users.id).
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    pgPolicy("clients_select_self_or_admin", {
      for: "select",
      to: "authenticated",
      using: sql`auth.uid() = ${table.id} or exists (select 1 from ${admins} where ${admins.id} = auth.uid())`,
    }),
    pgPolicy("clients_admin_write", {
      for: "all",
      to: "authenticated",
      using: sql`exists (select 1 from ${admins} where ${admins.id} = auth.uid())`,
      withCheck: sql`exists (select 1 from ${admins} where ${admins.id} = auth.uid())`,
    }),
  ]
).enableRLS();

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    objective: objectiveEnum("objective").notNull(),
    // Only meaningful when objective = meta_cpas.
    catalogName: text("catalog_name"),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    pgPolicy("campaigns_select_own_or_admin", {
      for: "select",
      to: "authenticated",
      using: sql`${table.clientId} = auth.uid() or exists (select 1 from ${admins} where ${admins.id} = auth.uid())`,
    }),
    pgPolicy("campaigns_admin_write", {
      for: "all",
      to: "authenticated",
      using: sql`exists (select 1 from ${admins} where ${admins.id} = auth.uid())`,
      withCheck: sql`exists (select 1 from ${admins} where ${admins.id} = auth.uid())`,
    }),
  ]
).enableRLS();

export const metrics = pgTable(
  "metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    // Raw fields per PRD 6 — nullable ones only apply to certain objectives.
    spend: numeric("spend", { precision: 14, scale: 2 }).notNull(),
    impressions: numeric("impressions", { precision: 14, scale: 0 }),
    reach: numeric("reach", { precision: 14, scale: 0 }),
    frequency: numeric("frequency", { precision: 8, scale: 4 }),
    clicks: numeric("clicks", { precision: 14, scale: 0 }),
    postEngagements: numeric("post_engagements", { precision: 14, scale: 0 }),
    videoViews: numeric("video_views", { precision: 14, scale: 0 }),
    leads: numeric("leads", { precision: 14, scale: 0 }),
    conversions: numeric("conversions", { precision: 14, scale: 0 }),
    purchases: numeric("purchases", { precision: 14, scale: 0 }),
    revenue: numeric("revenue", { precision: 14, scale: 2 }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => admins.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // "Satu baris = satu campaign pada satu tanggal" — re-uploading the
    // same campaign+date should update that day's numbers, not duplicate.
    uniqueIndex("metrics_campaign_date_unique").on(
      table.campaignId,
      table.date
    ),
    pgPolicy("metrics_select_own_or_admin", {
      for: "select",
      to: "authenticated",
      using: sql`
        exists (select 1 from ${admins} where ${admins.id} = auth.uid())
        or ${table.campaignId} in (
          select ${campaigns.id} from ${campaigns} where ${campaigns.clientId} = auth.uid()
        )
      `,
    }),
    pgPolicy("metrics_admin_write", {
      for: "all",
      to: "authenticated",
      using: sql`exists (select 1 from ${admins} where ${admins.id} = auth.uid())`,
      withCheck: sql`exists (select 1 from ${admins} where ${admins.id} = auth.uid())`,
    }),
  ]
).enableRLS();
