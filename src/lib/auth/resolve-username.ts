import { sql } from "drizzle-orm";
import { db } from "@/db";
import { admins, clients } from "@/db/schema";

/**
 * Looks up a login identifier that isn't shaped like an email (see
 * `login()` in src/app/actions/auth.ts) against both admins and clients,
 * and returns the account's real email for Supabase Auth — which only
 * ever authenticates by email, never by username.
 */
export async function resolveUsernameToEmail(
  username: string
): Promise<string | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return null;

  const [client] = await db
    .select({ email: clients.email })
    .from(clients)
    .where(sql`lower(${clients.username}) = ${normalized}`);
  if (client) return client.email;

  const [admin] = await db
    .select({ email: admins.email })
    .from(admins)
    .where(sql`lower(${admins.username}) = ${normalized}`);
  if (admin) return admin.email;

  return null;
}

/** Username must be unique across both admins and clients (not just within
 * one table) since either can log in with it from the same shared form. */
export async function isUsernameTaken(
  username: string,
  exclude?: { table: "clients" | "admins"; id: string }
): Promise<boolean> {
  const normalized = username.trim().toLowerCase();

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(sql`lower(${clients.username}) = ${normalized}`);
  if (client && !(exclude?.table === "clients" && exclude.id === client.id)) {
    return true;
  }

  const [admin] = await db
    .select({ id: admins.id })
    .from(admins)
    .where(sql`lower(${admins.username}) = ${normalized}`);
  if (admin && !(exclude?.table === "admins" && exclude.id === admin.id)) {
    return true;
  }

  return false;
}
