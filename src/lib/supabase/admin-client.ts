import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS entirely.
 * Used to create/manage admin & client login accounts.
 *
 * No `server-only` guard here on purpose: this is also imported by
 * scripts/create-admin.ts, which runs via tsx outside Next.js's bundler
 * (where the `server-only` guard would throw unconditionally). App code
 * should import from `./admin` instead, which re-exports this with the
 * guard applied.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
