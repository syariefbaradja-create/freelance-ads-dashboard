import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "client";

/**
 * Role is stamped into the Supabase Auth user's `user_metadata` when the
 * account is created (see src/lib/supabase/admin.ts callers) so it can be
 * read here without an extra database round-trip.
 */
export function getRole(user: User | null | undefined): AppRole | null {
  const role = user?.user_metadata?.role;
  return role === "admin" || role === "client" ? role : null;
}
