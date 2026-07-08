import "server-only";

/**
 * Only import this from Next.js server-only code (route handlers, server
 * actions). For scripts run outside Next.js (e.g. scripts/create-admin.ts),
 * import from ./admin-client directly instead.
 */
export { createAdminClient } from "./admin-client";
