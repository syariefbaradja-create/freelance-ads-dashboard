import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js reads .env.local by convention; drizzle-kit runs outside Next.js
// so we load it explicitly here (falls back to .env if .env.local is absent).
config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Supabase's `auth` schema is declared in schema.ts only so we can
  // reference auth.users as a foreign key — never let drizzle-kit try to
  // manage (diff/migrate) that schema itself.
  schemaFilter: ["public"],
});
