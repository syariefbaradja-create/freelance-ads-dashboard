/**
 * One-time bootstrap for the very first admin account. There is no UI for
 * this yet — admin account creation via the dashboard is a later phase.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts "Nama Admin" admin@example.com "password-aman" [username]
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  // Dynamic imports so .env.local is loaded before these modules read
  // process.env at module-evaluation time (static imports are hoisted
  // above the config() call above, which would otherwise run too late).
  const { createAdminClient } = await import("../src/lib/supabase/admin-client");
  const { db } = await import("../src/db");
  const { admins } = await import("../src/db/schema");
  const { isUsernameTaken } = await import("../src/lib/auth/resolve-username");

  const [name, email, password, username] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error(
      'Usage: npx tsx scripts/create-admin.ts "Nama Admin" admin@example.com "password-aman" [username]'
    );
    process.exit(1);
  }

  if (username && (await isUsernameTaken(username))) {
    console.error(`Username "${username}" sudah dipakai.`);
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "admin" },
  });

  if (error || !data.user) {
    console.error("Gagal membuat akun Supabase Auth:", error?.message);
    process.exit(1);
  }

  await db.insert(admins).values({
    id: data.user.id,
    name,
    email,
    username: username ?? null,
  });

  console.log(`Admin "${name}" <${email}> berhasil dibuat.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
